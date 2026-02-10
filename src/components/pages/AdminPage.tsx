/**
 * Admin Page
 * 
 * Admin dashboard for managing feature flags and provider connections
 */

import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import FeatureFlagPanel from '../admin/FeatureFlagPanel';
import ConnectionsPanel from '../admin/ConnectionsPanel';
import { useAuth } from '../../contexts/AuthContext';
import { checkIsAdmin } from '../../services/userRoleService';
import { useState, useEffect } from 'react';
import { Alert, CircularProgress } from '@mui/material';

export const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (currentUser) {
      checkIsAdmin(currentUser.uid).then(setIsAdmin);
    }
  }, [currentUser]);

  if (isAdmin === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Admin privileges required</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Feature Flags" />
          <Tab label="Provider Connections" />
        </Tabs>
      </Paper>

      {activeTab === 0 && <FeatureFlagPanel />}
      {activeTab === 1 && <ConnectionsPanel />}
    </Box>
  );
};

export default AdminPage;

