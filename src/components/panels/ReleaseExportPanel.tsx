/**
 * Release Export Panel
 * 
 * Wrapper panel that integrates ExportPanel with release data
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import ExportPanel from '../ExportPanel';
import { ReleaseManifest, PreflightResult, SubmissionResult } from '../../types/export';
import { Release } from '../../types/release';
import { Song } from '../../types/song';
import { SoundCloudConnector } from '../../services/export/connectors/soundcloudConnector';
import { RevelatorConnector } from '../../services/export/connectors/revelatorConnector';
import { getAllPlatforms, getConnector } from '../../services/export/connectors/connectorRegistry';
import { createSubmission } from '../../services/submissionService';
import { isFeatureEnabled } from '../../config/features';
import { useToast } from '../../hooks/useToast';
import { distributeRelease, refreshSubmissions } from '../../services/orchestratorService';

interface ReleaseExportPanelProps {
  release: Release;
  songs: Song[];
  collaborators?: Array<{ id: string; name: string; email?: string; avatar?: string }>;
  onClose: () => void;
  onExportComplete?: () => void;
}

const ReleaseExportPanel: React.FC<ReleaseExportPanelProps> = ({
  release,
  songs,
  onClose,
  onExportComplete,
}) => {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [manifest, setManifest] = useState<ReleaseManifest | undefined>();
  const [preflightResult, setPreflightResult] = useState<PreflightResult | undefined>();
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  // Load submission history
  useEffect(() => {
    if (release?.id && isFeatureEnabled('distributor')) {
      loadSubmissionHistory();
    }
  }, [release?.id]);

  useEffect(() => {
    if (!isFeatureEnabled('soundcloud') && !isFeatureEnabled('distributor')) {
      return;
    }

    // Release docs are schemaless beyond the Release type — pick up
    // distribution fields when present so preflight can validate them
    const releaseExtras = release as Release & {
      genre?: string;
      artworkUrl?: string;
      coverUrl?: string;
      upc?: string;
      label?: string;
      artist?: string;
    };

    // Build release manifest from release and songs
    const releaseManifest: ReleaseManifest = {
      releaseId: release.id,
      title: release.title,
      description: release.description,
      type: release.type,
      releaseDate: release.releaseDate,
      genre: releaseExtras.genre,
      artworkUrl: releaseExtras.artworkUrl || releaseExtras.coverUrl,
      metadata: {
        upc: releaseExtras.upc,
        label: releaseExtras.label,
        primaryArtist: releaseExtras.artist,
      },
      tracks: songs.map((song, index) => ({
        trackNumber: index + 1,
        songId: song.id,
        song,
        title: song.title,
        metadata: {
          isrc: song.metadata?.isrc,
          explicit: false,
          tags: song.metadata?.tags,
        },
      })),
      rightsSplits: [], // Will be populated from release if available
    };

    setManifest(releaseManifest);
  }, [release, songs]);

  const handleRunPreflight = async (manifest: ReleaseManifest): Promise<PreflightResult> => {
    if (!isFeatureEnabled('soundcloud') && !isFeatureEnabled('distributor')) {
      const errorResult = {
        valid: false,
        errors: [{ code: 'FEATURE_DISABLED', message: 'Export features are not enabled', severity: 'error' as const }],
        warnings: []
      };
      setPreflightResult(errorResult);
      showError('Export features are not enabled');
      return errorResult;
    }

    try {
      // The distributor path delivers to DSP ingestion, so use the
      // strictest preflight available
      const connector = isFeatureEnabled('distributor')
        ? new RevelatorConnector()
        : new SoundCloudConnector();
      const result = await connector.runPreflight(manifest);
      setPreflightResult(result);
      
      if (!result.valid) {
        const errorMessages = result.errors.map(e => e.message).join(', ');
        showError(`Preflight validation failed: ${errorMessages}`);
      } else if (result.warnings.length > 0) {
        const warningMessages = result.warnings.map(w => w.message).join(', ');
        showError(`Preflight warnings: ${warningMessages}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to run preflight validation: ${errorMessage}`);
      console.error('Preflight validation error:', error);
      const errorResult = {
        valid: false,
        errors: [{ code: 'PREFLIGHT_ERROR', message: errorMessage, severity: 'error' as const }],
        warnings: [],
      };
      setPreflightResult(errorResult);
      return errorResult;
    }
  };

  const loadSubmissionHistory = async () => {
    if (!release?.id) return;

    try {
      // refreshSubmissions polls providers for in-flight statuses
      // before returning, so the history reflects provider state
      const submissions = await refreshSubmissions(release.id);
      const history = Object.entries(submissions).map(([providerId, submission]) => ({
        id: submission.submissionId || providerId,
        provider: submission.providerName || providerId,
        status: submission.status,
        submittedAt: submission.submittedAt,
        result: {
          submissionId: submission.submissionId,
          status: submission.status,
          error: submission.error,
          providerUrl: submission.providerUrl,
          submittedAt: submission.submittedAt,
          completedAt: submission.completedAt,
        },
      }));
      setExportHistory(history);
    } catch (error) {
      console.error('Failed to load submission history:', error);
    }
  };

  const handleSubmit = async (
    manifest: ReleaseManifest,
    providerIds: string[]
  ): Promise<SubmissionResult[]> => {
    if (!isFeatureEnabled('distributor')) {
      // Fallback to direct connector if orchestrator not enabled
      return handleSubmitDirect(manifest, providerIds);
    }

    if (!providerIds || providerIds.length === 0) {
      const error = new Error('No export providers selected');
      showError(error.message);
      throw error;
    }

    setExporting(true);
    try {
      // Use orchestrator service
      const submissions = await distributeRelease(release.id, providerIds);
      
      // Convert to SubmissionResult format
      const results: SubmissionResult[] = Object.entries(submissions).map(([providerId, submission]) => ({
        submissionId: submission.submissionId || `pending-${providerId}`,
        status: submission.status,
        error: submission.error,
        providerUrl: submission.providerUrl,
        providerData: submission.providerData,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt,
      }));

      // Reload history
      await loadSubmissionHistory();

      showSuccess(`Distribution started for ${providerIds.length} provider(s)`);
      onExportComplete?.();

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to distribute release: ${errorMessage}`);
      throw error;
    } finally {
      setExporting(false);
    }
  };

  // Fallback to direct connector submission (old method)
  const handleSubmitDirect = async (
    manifest: ReleaseManifest,
    providerIds: string[]
  ): Promise<SubmissionResult[]> => {
    if (!isFeatureEnabled('soundcloud')) {
      const error = new Error('SoundCloud export is not enabled');
      showError(error.message);
      throw error;
    }

    const results: SubmissionResult[] = [];

    for (const providerId of providerIds) {
      try {
        const connector = getConnector(providerId as any);
        const payload = await connector.prepare(manifest);
        const result = await connector.submit(payload);
        results.push(result);

        // Track submission
        try {
          await createSubmission({
            releaseId: release.id,
            platformId: providerId,
            userId: '',
            status: result.status,
            submissionId: result.submissionId,
            providerUrl: result.providerUrl,
            submittedAt: result.submittedAt,
            completedAt: result.completedAt,
          });
        } catch {
          // submission tracking is non-critical
        }

        setExportHistory(prev => [...prev, {
          id: result.submissionId,
          provider: connector.name,
          status: result.status,
          submittedAt: result.submittedAt,
          result,
        }]);

        if (result.status === 'completed') {
          showSuccess(`Successfully exported for ${connector.name}`);
        } else if (result.status === 'failed') {
          showError(`Export for ${connector.name} failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showError(`Failed to export to ${providerId}: ${errorMessage}`);
        results.push({
          submissionId: `error-${Date.now()}-${providerId}`,
          status: 'failed',
          error: errorMessage,
          submittedAt: new Date().toISOString(),
        });
      }
    }

    if (results.length > 0 && results.some((r) => r.status === 'completed')) {
      onExportComplete?.();
    }

    return results;
  };

  if (!isFeatureEnabled('soundcloud') && !isFeatureEnabled('distributor')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Export features are not enabled. Please enable distributor or soundcloud in feature flags.
        </Alert>
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    );
  }

  if (!release) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Release not found. Please create a release before exporting.
        </Alert>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </Box>
    );
  }

  if (!manifest) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Loading release data...
        </Alert>
        <CircularProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Export Release: {release.title}
      </Typography>
      <ExportPanel
        manifest={manifest}
        providers={getAllPlatforms().map(p => ({
          id: p.id,
          name: p.name,
          enabled: true,
        }))}
        preflightResult={preflightResult}
        onRunPreflight={handleRunPreflight}
        onSubmit={handleSubmit}
        exportHistory={exportHistory}
        exporting={exporting}
      />
      <ToastComponent />
    </Box>
  );
};

export default ReleaseExportPanel;

