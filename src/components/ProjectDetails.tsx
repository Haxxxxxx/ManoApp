import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Song } from '../types/song';
import LocalFileBrowser from './LocalFileBrowser';
import { convertLocalFileToSong } from '../services/localFileService';
import { formatDurationFromString, formatDuration, parseDurationToSeconds } from '../utils/formatters';
import { useSongs } from '../hooks/useSongs';
import { getErrorMessage } from '../utils/storageHelpers';

interface ProjectDetailsProps {
  trip: {
    id: string;
    name: string;
    description?: string;
    songs: Song[];
  };
  onSongsUpdated: (songs: Song[]) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ trip, onSongsUpdated }) => {
  const [showLocalFiles, setShowLocalFiles] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use useSongs hook for proper data management
  const { songs, removeSong, addSong, refresh } = useSongs({
    tripId: trip.id,
    autoFetch: true
  });

  // Sync songs with parent when they change
  // Note: trip.songs is always empty (songs collection is source of truth)
  // We only notify parent of changes, not compare with trip.songs
  React.useEffect(() => {
    onSongsUpdated(songs);
    // Note: Intentionally only depend on songs to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]);

  const handleLocalFilesSelected = async (files: File[]) => {
    try {
      setError(null);
      // Convert local files to songs and add them
      for (const file of files) {
        const localFile = {
          name: file.name,
          path: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        };
        const songData = convertLocalFileToSong(localFile);
        // Create song in Firebase if it's not a local-only file
        if (songData.userId !== 'local') {
          await addSong({
            title: songData.title,
            artist: songData.artist,
            duration: songData.duration,
            filePath: songData.filePath,
            userId: songData.userId,
            metadata: songData.metadata
          });
        }
      }
      await refresh();
      setShowLocalFiles(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add local files'));
    }
  };

  const handleRemoveSong = async (songId: string) => {
    setDeletingSongId(songId);
    setError(null);
    
    try {
      await removeSong(songId);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete song'));
    } finally {
      setDeletingSongId(null);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {trip.name}
        </Typography>
        {trip.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {trip.description}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Project Analysis</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowLocalFiles(true)}
          >
            Add Local Files
          </Button>
        </Box>

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`${songs.length} Songs`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${songs.filter(song => song.metadata?.source === 'local').length} Local Files`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Total Duration: ${formatDuration(songs.reduce((acc, song) => {
                return acc + parseDurationToSeconds(song.duration);
              }, 0))}`}
              color="info"
              variant="outlined"
            />
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Songs
        </Typography>
        <List>
          {songs.map((song) => (
            <ListItem
              key={song.id}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleRemoveSong(song.id)}
                  disabled={deletingSongId === song.id}
                >
                  {deletingSongId === song.id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              }
            >
              <ListItemIcon>
                <MusicNoteIcon />
              </ListItemIcon>
              <ListItemText
                primary={song.title}
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      {song.artist} • {formatDurationFromString(song.duration)}
                    </Typography>
                    {song.metadata?.source === 'local' && (
                      <Chip
                        label="Local File"
                        size="small"
                        color="secondary"
                        sx={{ ml: 1 }}
                      />
                    )}
                    {song.metadata?.tags && song.metadata.tags.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {song.metadata.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
          {songs.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No songs added yet. Click "Add Local Files" to import songs from your computer.
            </Typography>
          )}
        </List>
      </Paper>

      <Dialog
        open={showLocalFiles}
        onClose={() => setShowLocalFiles(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Local Audio Files</DialogTitle>
        <DialogContent>
          <LocalFileBrowser
            onFilesSelected={handleLocalFilesSelected}
            onClose={() => setShowLocalFiles(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails; 