/**
 * Export Panel Component
 * 
 * Component for exporting releases to external platforms with preflight validation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HistoryIcon from '@mui/icons-material/History';
import { PreflightResult, SubmissionResult } from '../types/export';
import { ReleaseManifest } from '../types/export';
import { ExportPreset } from '../types/preset';
import { getPresets } from '../services/presetService';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { isFeatureEnabled } from '../config/features';

export interface ExportPanelProps {
  /** Release manifest to export */
  manifest?: ReleaseManifest;
  
  /** Available providers */
  providers?: Array<{ id: string; name: string; enabled: boolean }>;
  
  /** Preflight validation result */
  preflightResult?: PreflightResult;
  
  /** Run preflight validation */
  onRunPreflight?: (manifest: ReleaseManifest) => Promise<PreflightResult>;
  
  /** Submit export */
  onSubmit?: (manifest: ReleaseManifest, providerIds: string[]) => Promise<SubmissionResult[]>;
  
  /** Export history */
  exportHistory?: Array<{
    id: string;
    provider: string;
    status: string;
    submittedAt: string;
    result?: SubmissionResult;
  }>;
  
  /** Whether export is in progress */
  exporting?: boolean;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  manifest,
  providers = [
    { id: 'soundcloud', name: 'SoundCloud', enabled: true },
    { id: 'revelator', name: 'Revelator (All DSPs)', enabled: true },
  ],
  preflightResult,
  onRunPreflight,
  onSubmit,
  exportHistory = [],
  exporting = false,
}) => {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [currentPreflight, setCurrentPreflight] = useState<PreflightResult | undefined>(
    preflightResult
  );
  const [runningPreflight, setRunningPreflight] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [exportResults, setExportResults] = useState<SubmissionResult[]>([]);
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  useEffect(() => {
    setCurrentPreflight(preflightResult);
  }, [preflightResult]);

  useEffect(() => {
    // Load presets when providers are selected (only if feature enabled)
    if (selectedProviders.length > 0 && isFeatureEnabled('exportPresets')) {
      loadPresets(selectedProviders[0]);
    }
  }, [selectedProviders]);

  const loadPresets = async (providerId: string) => {
    try {
      const loadedPresets = await getPresets(providerId);
      setPresets(loadedPresets);
      
      // Auto-select default preset
      const defaultPreset = loadedPresets.find((p) => p.isDefault);
      if (defaultPreset) {
        setSelectedPreset(defaultPreset.id);
        applyPreset(defaultPreset);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const applyPreset = (_preset: ExportPreset) => {
    // Preset → manifest application is not implemented yet; selecting a
    // preset only records the choice. See exportPresets feature flag.
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      applyPreset(preset);
    }
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleRunPreflight = async () => {
    if (!manifest || !onRunPreflight) {
      return;
    }

    setRunningPreflight(true);
    try {
      const result = await onRunPreflight(manifest);
      setCurrentPreflight(result);
    } catch (error) {
      console.error('Preflight failed:', error);
    } finally {
      setRunningPreflight(false);
    }
  };

  const handleExport = async () => {
    if (!manifest || !onSubmit || selectedProviders.length === 0) {
      return;
    }

    try {
      const results = await onSubmit(manifest, selectedProviders);
      setExportResults(results);
      setActiveTab(2); // Switch to history tab
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const activeStep = exporting ? 2 : currentPreflight?.valid ? 1 : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Export Release
      </Typography>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Preflight" />
        <Tab label="Providers" />
        <Tab label="History" icon={<HistoryIcon />} iconPosition="end" />
      </Tabs>

      {/* Preflight Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preflight Validation
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Validate your release before exporting to ensure all requirements are met.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleRunPreflight}
            disabled={!manifest || runningPreflight}
            startIcon={runningPreflight ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{ mb: 3 }}
          >
            {runningPreflight ? 'Running Preflight...' : 'Run Preflight'}
          </Button>

          {currentPreflight && (
            <Box>
              {currentPreflight.valid ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Preflight validation passed! Your release is ready to export.
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Preflight validation failed. Please fix the errors below.
                </Alert>
              )}

              {currentPreflight.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Errors ({currentPreflight.errors.length})
                  </Typography>
                  <List dense>
                    {currentPreflight.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={error.message}
                          secondary={error.field && `Field: ${error.field}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {currentPreflight.warnings.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Warnings ({currentPreflight.warnings.length})
                  </Typography>
                  <List dense>
                    {currentPreflight.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={warning.message}
                          secondary={warning.field && `Field: ${warning.field}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Providers Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Providers
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose which platforms to export your release to.
            </Typography>
          </Box>

          {selectedProviders.length > 0 && isFeatureEnabled('exportPresets') && presets.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Export Preset</InputLabel>
                <Select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  label="Export Preset"
                >
                  <MenuItem value="">None</MenuItem>
                  {presets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.name} {preset.isDefault && '(Default)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            {providers.map((provider) => (
              <FormControlLabel
                key={provider.id}
                control={
                  <Checkbox
                    checked={selectedProviders.includes(provider.id)}
                    onChange={() => handleProviderToggle(provider.id)}
                    disabled={!provider.enabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{provider.name}</Typography>
                    {!provider.enabled && (
                      <Chip label="Disabled" size="small" color="default" />
                    )}
                  </Box>
                }
              />
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Preflight</StepLabel>
            </Step>
            <Step>
              <StepLabel>Select Providers</StepLabel>
            </Step>
            <Step>
              <StepLabel>Export</StepLabel>
            </Step>
          </Stepper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setActiveTab(0)}
              disabled={exporting}
            >
              Back to Preflight
            </Button>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={
                !currentPreflight?.valid ||
                selectedProviders.length === 0 ||
                exporting ||
                !manifest
              }
              startIcon={exporting ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </Box>
        </Box>
      )}

      {/* History Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Export History
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              View past export submissions and their status.
            </Typography>
          </Box>

          {exportResults.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recent Exports
              </Typography>
              <List>
                {exportResults.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {result.status === 'completed' ? (
                        <CheckCircleIcon color="success" />
                      ) : result.status === 'failed' ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <CircularProgress size={20} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`Submission ${result.submissionId}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Status: {result.status}
                          </Typography>
                          {result.providerUrl && (
                            <Typography variant="body2" component="a" href={result.providerUrl}>
                              View on platform
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {exportHistory.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                All Exports
              </Typography>
              <List>
                {exportHistory.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
                      {item.status === 'completed' ? (
                        <CheckCircleIcon color="success" />
                      ) : item.status === 'failed' ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <CircularProgress size={20} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${item.provider} - ${item.status}`}
                      secondary={new Date(item.submittedAt).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {exportHistory.length === 0 && exportResults.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No export history yet
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ExportPanel;

