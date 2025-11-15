/**
 * Release Export Panel
 * 
 * Wrapper panel that integrates ExportPanel with release data
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import ExportPanel from '../ExportPanel';
import { ReleaseManifest, PreflightResult, SubmissionResult } from '../../types/export';
import { Release } from '../../types/release';
import { Song } from '../../types/song';
import { SoundCloudConnector } from '../../services/export/connectors/soundcloudConnector';
import { isFeatureEnabled } from '../../config/features';
import { useToast } from '../../hooks/useToast';

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
  collaborators = [],
  onClose,
  onExportComplete,
}) => {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [manifest, setManifest] = useState<ReleaseManifest | undefined>();
  const [preflightResult, setPreflightResult] = useState<PreflightResult | undefined>();
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!isFeatureEnabled('soundcloud')) {
      return;
    }

    // Build release manifest from release and songs
    const releaseManifest: ReleaseManifest = {
      releaseId: release.id,
      title: release.title,
      description: release.description,
      type: release.type,
      releaseDate: release.releaseDate,
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
    if (!isFeatureEnabled('soundcloud')) {
      return { valid: false, errors: [{ code: 'FEATURE_DISABLED', message: 'SoundCloud export is not enabled', severity: 'error' }], warnings: [] };
    }

    try {
      const connector = new SoundCloudConnector();
      const result = await connector.runPreflight(manifest);
      setPreflightResult(result);
      return result;
    } catch (error) {
      showError('Failed to run preflight validation');
      return {
        valid: false,
        errors: [{ code: 'PREFLIGHT_ERROR', message: error instanceof Error ? error.message : 'Unknown error', severity: 'error' }],
        warnings: [],
      };
    }
  };

  const handleSubmit = async (
    manifest: ReleaseManifest,
    providerIds: string[]
  ): Promise<SubmissionResult[]> => {
    if (!isFeatureEnabled('soundcloud')) {
      throw new Error('SoundCloud export is not enabled');
    }

    const results: SubmissionResult[] = [];

    for (const providerId of providerIds) {
      try {
        if (providerId === 'soundcloud') {
          const connector = new SoundCloudConnector();
          const payload = await connector.prepare(manifest);
          const result = await connector.submit(payload);
          results.push(result);

          // Add to history
          setExportHistory((prev) => [
            ...prev,
            {
              id: result.submissionId,
              provider: 'SoundCloud',
              status: result.status,
              submittedAt: result.submittedAt,
              result,
            },
          ]);

          showSuccess(`Successfully exported to ${providerId}`);
        }
      } catch (error) {
        showError(`Failed to export to ${providerId}`);
        results.push({
          submissionId: `error-${Date.now()}`,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          submittedAt: new Date().toISOString(),
        });
      }
    }

    if (results.length > 0 && results.some((r) => r.status === 'completed')) {
      onExportComplete?.();
    }

    return results;
  };

  if (!isFeatureEnabled('soundcloud')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          SoundCloud export is not enabled. Please enable it in feature flags.
        </Alert>
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    );
  }

  if (!manifest) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading release data...</Typography>
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
        providers={[
          { id: 'soundcloud', name: 'SoundCloud', enabled: isFeatureEnabled('soundcloud') },
        ]}
        preflightResult={preflightResult}
        onRunPreflight={handleRunPreflight}
        onSubmit={handleSubmit}
        exportHistory={exportHistory}
      />
      <ToastComponent />
    </Box>
  );
};

export default ReleaseExportPanel;

