/**
 * Feature Flag Panel Component
 * 
 * Admin panel for managing feature flags
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { checkIsAdmin } from '../../services/userRoleService';
import { useAuth } from '../../contexts/AuthContext';
import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { FeatureFlags } from '../../config/features';

export const FeatureFlagPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlags>({
    distributor: false,
    fingerprint: false,
    exportPresets: false,
    splitSheet: false,
    aiMetadata: true,
    stemsAndMixer: false,
    releaseChecklist: true,
    comments: true,
    gdriveImport: false,
    soundcloud: true,
    batchOperations: true,
    multiPlatformPublish: true,
    analytics: true,
    globalSearch: true,
    notificationCenter: true,
    metadataCompleteness: true,
    activityFeed: true,
    keyboardShortcuts: true,
    smartTemplates: true,
    quickActions: true,
  });

  useEffect(() => {
    if (currentUser) {
      checkIsAdmin(currentUser.uid).then(setIsAdmin);
      loadFlags();
    }
  }, [currentUser]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      if (!functions) {
        throw new Error('Firebase Functions not available');
      }

      const getFlags = httpsCallable<{}, { flags: FeatureFlags }>(
        functions as Functions,
        'getFeatureFlags'
      );

      const result = await getFlags({});
      if (result.data?.flags) {
        setFlags(result.data.flags);
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flag: keyof FeatureFlags, enabled: boolean) => {
    try {
      if (!functions) {
        throw new Error('Firebase Functions not available');
      }

      const setFlag = httpsCallable<{ flag: string; enabled: boolean }, { success: boolean }>(
        functions as Functions,
        'setFeatureFlag'
      );

      await setFlag({ flag, enabled });
      setFlags({ ...flags, [flag]: enabled });
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      alert('Failed to update feature flag. Please try again.');
    }
  };

  if (!isAdmin) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">Admin privileges required</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Feature Flags</Typography>
        <Button onClick={loadFlags} size="small">
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={flags.distributor}
                onChange={(e) => handleToggle('distributor', e.target.checked)}
              />
            }
            label="Distributor Orchestrator"
          />
          <FormControlLabel
            control={
              <Switch
                checked={flags.fingerprint}
                onChange={(e) => handleToggle('fingerprint', e.target.checked)}
              />
            }
            label="Fingerprinting & Dedupe"
          />
          <FormControlLabel
            control={
              <Switch
                checked={flags.exportPresets}
                onChange={(e) => handleToggle('exportPresets', e.target.checked)}
              />
            }
            label="Export Presets"
          />
          <FormControlLabel
            control={
              <Switch
                checked={flags.splitSheet}
                onChange={(e) => handleToggle('splitSheet', e.target.checked)}
              />
            }
            label="Split-Sheet Generation"
          />
        </Box>
      )}
    </Paper>
  );
};

export default FeatureFlagPanel;

