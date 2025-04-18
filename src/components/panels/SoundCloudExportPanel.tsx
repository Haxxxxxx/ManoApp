import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { Song } from '../../types';
import { exportForSoundCloud } from '../../services/exportService';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

interface SoundCloudExportPanelProps {
  song: Song;
  onClose: () => void;
}

const SoundCloudExportPanel = ({ song, onClose }: SoundCloudExportPanelProps) => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Validate the file URL when the component mounts
    if (!song.filePath) {
      setError('No audio file available for export');
    } else {
      // Test if the file URL is accessible
      fetch(song.filePath, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            setError(`Audio file is not accessible: ${response.status} ${response.statusText}`);
          }
        })
        .catch(error => {
          setError(`Failed to access audio file: ${error.message}`);
        });
    }
  }, [song.filePath]);

  const handleExport = async () => {
    if (!song.filePath) {
      setError('No audio file available for export');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Starting export for song:', song.title);
      await exportForSoundCloud(song);
      console.log('Export completed successfully');
      setSuccess(true);
    } catch (error) {
      console.error('Error in export process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export for SoundCloud';
      setError(errorMessage);
      
      // Log additional details about the song
      console.error('Song details:', {
        title: song.title,
        filePath: song.filePath,
        hasMetadata: !!song.metadata,
        fileType: song.filePath?.split('.').pop()
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom>
          Export for SoundCloud
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Song details:
        </Typography>
        <Box sx={{ mb: 3, pl: 2 }}>
          <Typography variant="body2">Title: {song.title}</Typography>
          <Typography variant="body2">Artist: {song.artist}</Typography>
          <Typography variant="body2">File: {song.filePath ? song.filePath.split('/').pop() : 'No file'}</Typography>
          {song.metadata && (
            <>
              <Typography variant="body2">Genre: {song.metadata.genre?.join(', ') || 'None'}</Typography>
              <Typography variant="body2">Tags: {song.metadata.tags?.join(', ') || 'None'}</Typography>
            </>
          )}
        </Box>

        <Typography variant="body1" sx={{ mb: 3 }}>
          This will create a zip file containing:
          <ul>
            <li>Your audio file in MP3 format</li>
            <li>A text file with all metadata for easy reference</li>
            <li>Step-by-step instructions for uploading to SoundCloud</li>
          </ul>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Successfully exported! Check your downloads folder.
          </Alert>
        )}

        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={exporting}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={exporting || !!error}
            startIcon={exporting ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
          >
            {exporting ? 'Exporting...' : 'Export for SoundCloud'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SoundCloudExportPanel; 