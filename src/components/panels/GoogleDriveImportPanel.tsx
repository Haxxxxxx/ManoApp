/**
 * Google Drive Import Panel
 * 
 * Panel for importing files from Google Drive
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import { isFeatureEnabled } from '../../config/features';
import {
  startGoogleDriveOAuth,
  handleGoogleDriveCallback,
  listGoogleDriveFiles,
  importGoogleDriveFile,
  isGoogleDriveConnected,
  type DriveFile,
} from '../../services/integrations/googleDriveService';
import { useToast } from '../../hooks/useToast';

interface GoogleDriveImportPanelProps {
  projectId?: string;
  onClose: () => void;
  onFileImported?: (assetId: string) => void;
}

const GoogleDriveImportPanel: React.FC<GoogleDriveImportPanelProps> = ({
  projectId,
  onClose,
  onFileImported,
}) => {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  useEffect(() => {
    if (!isFeatureEnabled('gdriveImport')) {
      showError('Google Drive import is not enabled');
      return;
    }

    checkConnection();
  }, []);

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const isConnected = await isGoogleDriveConnected();
      setConnected(isConnected);
      if (isConnected) {
        await loadFiles();
      }
    } catch (error) {
      setConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to check Google Drive connection: ${errorMessage}`);
      console.error('Error checking Google Drive connection:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl, state } = await startGoogleDriveOAuth();

      // Store state in sessionStorage for callback
      sessionStorage.setItem('gdrive_oauth_state', state);
      
      // Redirect to OAuth URL (better UX than popup for OAuth)
      window.location.href = authUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to start OAuth flow: ${errorMessage}`);
      console.error('Error starting Google Drive OAuth:', error);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      await handleGoogleDriveCallback(code, state);
      sessionStorage.removeItem('gdrive_oauth_state');
      showSuccess('Successfully connected to Google Drive');
      await checkConnection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to complete OAuth flow: ${errorMessage}`);
      console.error('Error completing Google Drive OAuth:', error);
      sessionStorage.removeItem('gdrive_oauth_state');
    }
  };

  // Handle OAuth callback if code is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('gdrive_oauth_state');

    if (code && state && storedState === state) {
      handleOAuthCallback(code, state);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFiles = async (pageToken?: string) => {
    setLoading(true);
    try {
      const result = await listGoogleDriveFiles({
        pageSize: 20,
        pageToken,
        query: "mimeType contains 'audio' or mimeType contains 'image'",
      });
      setFiles(pageToken ? [...files, ...result.files] : result.files);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to load files from Google Drive: ${errorMessage}`);
      console.error('Error loading Google Drive files:', error);
      // Don't clear files on error, keep existing files visible
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: DriveFile) => {
    setImporting(file.id);
    try {
      const result = await importGoogleDriveFile({
        fileId: file.id,
        projectId,
      });

      if (result.duplicate) {
        showError(`File "${file.name}" has already been imported`);
      } else {
        showSuccess(`Successfully imported ${file.name}`);
        onFileImported?.(result.assetId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to import "${file.name}": ${errorMessage}`);
      console.error('Error importing file:', error);
    } finally {
      setImporting(null);
    }
  };

  if (!isFeatureEnabled('gdriveImport')) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Google Drive import is not enabled. Please enable it in feature flags.
        </Alert>
      </Paper>
    );
  }

  if (checkingConnection) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Checking connection...</Typography>
      </Paper>
    );
  }

  if (!connected) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connect Google Drive
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connect your Google Drive account to import audio files and images.
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleConnect}
        >
          Connect Google Drive
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Import from Google Drive</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {files.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No audio or image files found in your Google Drive.
        </Alert>
      )}

      {files.length > 0 && (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleImport(file)}
                  disabled={importing === file.id}
                  startIcon={importing === file.id ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                >
                  {importing === file.id ? 'Importing...' : 'Import'}
                </Button>
              }
            >
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={file.mimeType} size="small" />
                    {file.size && (
                      <Chip label={`${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB`} size="small" />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {nextPageToken && (
        <Button
          fullWidth
          onClick={() => loadFiles(nextPageToken)}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Loading...' : 'Load More'}
        </Button>
      )}

      <ToastComponent />
    </Paper>
  );
};

export default GoogleDriveImportPanel;

