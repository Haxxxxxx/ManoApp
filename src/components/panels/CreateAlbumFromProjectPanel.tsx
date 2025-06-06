import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  useTheme
} from '@mui/material';
import {
  DragIndicator as DragIndicatorIcon,
  MusicNote as MusicNoteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useAuth } from '../../contexts/AuthContext';
import { Trip } from '../../types/trip';
import { Song } from '../../types/song';
import { createAlbum } from '../../services/firebaseService';
import { audioService } from '../../services/audioService';
import type { AlbumSong } from '../../types/album';

interface CreateAlbumFromProjectPanelProps {
  trip: Trip;
  onClose: () => void;
  onAlbumCreated?: (albumId: string) => void;
}

// Add a helper function to format duration
const formatDuration = (duration: string | number): string => {
  if (typeof duration === 'string') {
    // If it's already in MM:SS format, return as is
    if (duration.includes(':')) return duration;
    
    // If it's a string number, convert to number first
    return audioService.formatDuration(Number(duration));
  }
  // If it's a number, format it
  return audioService.formatDuration(duration);
};

const CreateAlbumFromProjectPanel: React.FC<CreateAlbumFromProjectPanelProps> = ({
  trip,
  onClose,
  onAlbumCreated
}) => {
  const theme = useTheme();
  const { currentUser, artistProfile } = useAuth();
  const [albumData, setAlbumData] = useState({
    title: '',
    artist: artistProfile?.name || '',
    releaseDate: new Date().toISOString().split('T')[0],
    genre: '',
    description: '',
    coverImage: null as string | null
  });
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with all project songs
  useEffect(() => {
    console.log('Trip data received:', trip);
    if (trip && trip.songs && Array.isArray(trip.songs)) {
      console.log('Setting songs from trip:', trip.songs);
      setSelectedSongs(trip.songs);
    } else {
      console.warn('No songs found in trip data or invalid format:', trip);
      setError('No songs found in project');
    }
  }, [trip]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedSongs(items);
  };

  const handleMoveSong = (fromIndex: number, toIndex: number) => {
    const newSongs = [...selectedSongs];
    const [movedSong] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, movedSong);
    setSelectedSongs(newSongs);
  };

  const handleSaveAlbum = async () => {
    if (!currentUser) {
      setError('You must be logged in to create an album');
      return;
    }

    if (!selectedSongs.length) {
      setError('Please add at least one song to the album');
      return;
    }

    if (!albumData.title.trim()) {
      setError('Please enter an album title');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Creating album with songs:', selectedSongs);

      const albumSongs: AlbumSong[] = selectedSongs.map(song => {
        // Parse duration properly
        let durationInSeconds: number;
        if (typeof song.duration === 'number') {
          durationInSeconds = song.duration;
        } else if (typeof song.duration === 'string') {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          if (!isNaN(minutes) && !isNaN(seconds)) {
            durationInSeconds = minutes * 60 + seconds;
          } else {
            // If parsing fails, default to 0 or handle the error
            console.warn(`Invalid duration format for song ${song.title}:`, song.duration);
            durationInSeconds = 0;
          }
        } else {
          durationInSeconds = 0;
        }

        return {
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: durationInSeconds,
          metadata: {
            ...song.metadata,
            source: 'project',
            projectName: trip.name,
            filePath: song.filePath
          }
        };
      });

      const newAlbum = await createAlbum({
        userId: currentUser.uid,
        title: albumData.title,
        artist: albumData.artist,
        releaseDate: albumData.releaseDate,
        genre: albumData.genre,
        description: albumData.description,
        coverImage: albumData.coverImage,
        selectedPlatforms: [],
        songs: albumSongs
      });

      if (onAlbumCreated) {
        onAlbumCreated(newAlbum.id);
      }

      onClose();
    } catch (err) {
      console.error('Error creating album:', err);
      setError('Failed to create album. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add debug output for current state
  useEffect(() => {
    console.log('Current selected songs:', selectedSongs);
  }, [selectedSongs]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Create Album from Project</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {selectedSongs.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No songs available in this project. Please add songs before creating an album.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Album Title"
                value={albumData.title}
                onChange={(e) => setAlbumData({ ...albumData, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Artist"
                value={albumData.artist}
                onChange={(e) => setAlbumData({ ...albumData, artist: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Release Date"
                type="date"
                value={albumData.releaseDate}
                onChange={(e) => setAlbumData({ ...albumData, releaseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Genre"
                value={albumData.genre}
                onChange={(e) => setAlbumData({ ...albumData, genre: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={albumData.description}
                onChange={(e) => setAlbumData({ ...albumData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Song Order
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1 }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="songs">
                    {(provided) => (
                      <List {...provided.droppableProps} ref={provided.innerRef}>
                        {selectedSongs.map((song, index) => (
                          <Draggable key={song.id} draggableId={song.id} index={index}>
                            {(provided) => (
                              <ListItem
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                              >
                                <ListItemIcon>
                                  <DragIndicatorIcon />
                                </ListItemIcon>
                                <ListItemIcon>
                                  <MusicNoteIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary={song.title}
                                  secondary={
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" component="span">
                                        {song.artist}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" component="span">
                                        {formatDuration(song.duration)}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMoveSong(index, index - 1)}
                                      disabled={index === 0}
                                    >
                                      <ArrowUpwardIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleMoveSong(index, index + 1)}
                                      disabled={index === selectedSongs.length - 1}
                                    >
                                      <ArrowDownwardIcon />
                                    </IconButton>
                                  </Stack>
                                </ListItemSecondaryAction>
                              </ListItem>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </List>
                    )}
                  </Droppable>
                </DragDropContext>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSaveAlbum}
          disabled={isLoading || !albumData.title || !albumData.artist}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          Create Album
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAlbumFromProjectPanel; 