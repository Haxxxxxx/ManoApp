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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Song } from '../types/song';
import LocalFileBrowser from './LocalFileBrowser';
import { LocalFile, convertLocalFileToSong } from '../services/localFileService';
import { deleteSong } from '../services/firebaseService';

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

  const handleLocalFilesSelected = async (files: File[]) => {
    const newSongs = files.map(file => {
      const localFile = {
        name: file.name,
        path: file.name, // Using name as path since we don't have full path
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      };
      return convertLocalFileToSong(localFile);
    });

    onSongsUpdated([...trip.songs, ...newSongs]);
    setShowLocalFiles(false);
  };

  const handleRemoveSong = async (songId: string) => {
    setDeletingSongId(songId);
    setError(null);
    
    try {
      // Delete from Firebase
      await deleteSong(songId);
      
      // Update local state
      const updatedSongs = trip.songs.filter(song => song.id !== songId);
      onSongsUpdated(updatedSongs);
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song. Please try again.');
    } finally {
      setDeletingSongId(null);
    }
  };

  const formatDuration = (duration: string) => {
    // If duration is already formatted (e.g., "3:45"), return as is
    if (duration.includes(':')) {
      return duration;
    }
    // Otherwise, format the number of seconds
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
              label={`${trip.songs.length} Songs`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${trip.songs.filter(song => song.metadata?.source === 'local').length} Local Files`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Total Duration: ${trip.songs.reduce((acc, song) => {
                const duration = song.duration;
                const [minutes, seconds] = duration.split(':').map(Number);
                return acc + (minutes * 60 + seconds);
              }, 0)} seconds`}
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
          {trip.songs.map((song) => (
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
                      {song.artist} • {formatDuration(song.duration)}
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
          {trip.songs.length === 0 && (
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