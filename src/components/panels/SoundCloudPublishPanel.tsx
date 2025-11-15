import { Box, Typography, Paper, TextField, Button, FormControlLabel, Switch, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { Song } from '../../types';
import { publishToSoundCloud } from '../../services/soundcloudService';
import { getErrorMessage } from '../../utils/storageHelpers';

interface SoundCloudPublishPanelProps {
  song: Song;
  onClose: () => void;
}

const SoundCloudPublishPanel = ({ song, onClose }: SoundCloudPublishPanelProps) => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    if (!song.filePath) {
      setError('No audio file available for publishing');
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccess(false);

    try {
      const trackData = {
        title: song.title,
        description: description || `${song.title} by ${song.artist}`,
        genre: song.metadata?.genre?.[0],
        tags: tags ? tags.split(',').map(tag => tag.trim()) : song.metadata?.tags,
        artworkUrl: song.imagePath,
        fileUrl: song.filePath,
        isPrivate,
        downloadable: isDownloadable
      };

      await publishToSoundCloud(trackData);
      setSuccess(true);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to publish to SoundCloud'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom>
          Publish to SoundCloud
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Successfully published to SoundCloud!
          </Alert>
        )}

        <TextField
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          fullWidth
          helperText="Separate tags with commas"
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          }
          label="Private track"
          sx={{ mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={isDownloadable}
              onChange={(e) => setIsDownloadable(e.target.checked)}
            />
          }
          label="Allow downloads"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={publishing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={publishing}
            startIcon={publishing ? <CircularProgress size={20} /> : null}
          >
            {publishing ? 'Publishing...' : 'Publish to SoundCloud'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SoundCloudPublishPanel; 