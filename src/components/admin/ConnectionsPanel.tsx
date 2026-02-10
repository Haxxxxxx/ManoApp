/**
 * Connections Panel Component
 * 
 * Admin panel for managing provider connections
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { checkIsAdmin } from '../../services/userRoleService';
import { useAuth } from '../../contexts/AuthContext';

export const ConnectionsPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Array<{
    provider: string;
    connected: boolean;
    lastRefresh?: string;
  }>>([]);

  useEffect(() => {
    if (currentUser) {
      checkIsAdmin(currentUser.uid).then(setIsAdmin);
      loadConnections();
    }
  }, [currentUser]);

  const loadConnections = async () => {
    setLoading(true);
    // TODO: Load connections from Firestore
    // For now, mock data
    setConnections([
      { provider: 'soundcloud', connected: true, lastRefresh: new Date().toISOString() },
      { provider: 'spotify', connected: false },
    ]);
    setLoading(false);
  };

  const handleConnect = (provider: string) => {
    // TODO: Start OAuth flow for provider
    alert(`Connect to ${provider} - OAuth flow coming soon`);
  };

  const handleRevoke = (provider: string) => {
    if (window.confirm(`Revoke connection to ${provider}?`)) {
      // TODO: Revoke connection
      alert(`Revoke ${provider} - Implementation coming soon`);
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
      <Typography variant="h6" gutterBottom>
        Provider Connections
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {connections.map((conn) => (
            <ListItem key={conn.provider}>
              <ListItemText
                primary={conn.provider}
                secondary={
                  conn.connected
                    ? `Last refreshed: ${conn.lastRefresh ? new Date(conn.lastRefresh).toLocaleString() : 'Never'}`
                    : 'Not connected'
                }
              />
              <ListItemSecondaryAction>
                {conn.connected ? (
                  <>
                    <Chip label="Connected" color="success" size="small" sx={{ mr: 1 }} />
                    <Button
                      size="small"
                      startIcon={<LinkOffIcon />}
                      onClick={() => handleRevoke(conn.provider)}
                    >
                      Revoke
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => handleConnect(conn.provider)}
                    variant="contained"
                  >
                    Connect
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ConnectionsPanel;

