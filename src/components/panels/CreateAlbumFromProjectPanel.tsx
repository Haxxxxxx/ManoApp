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
import { useSongs } from '../../hooks/useSongs';
import { getErrorMessage } from '../../utils/storageHelpers';
import { formatDurationFromString, parseDurationToSeconds } from '../../utils/formatters';
import type { AlbumSong } from '../../types/album';

interface CreateAlbumFromProjectPanelProps {
  trip: Trip;
  onClose: () => void;
  onAlbumCreated?: (albumId: string) => void;
}

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
  const [localError, setLocalError] = useState<string | null>(null);

  // Use useSongs hook for proper data management
  const { songs, loading: isLoading, error: songsError } = useSongs({
    tripId: trip?.id,
    autoFetch: true
  });

  // Update selected songs when songs are loaded
  useEffect(() => {
    if (songs.length > 0) {
      setSelectedSongs(songs);
      setLocalError(null);
    } else if (songs.length === 0 && !isLoading) {
      setLocalError('No songs found in project');
    }
  }, [songs, isLoading]);

  // Combine errors
  const error = localError || (songsError ? getErrorMessage(songsError, 'Failed to load songs') : null);

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
      setLocalError('You must be logged in to create an album');
      return;
    }

    if (!selectedSongs.length) {
      setLocalError('Please add at least one song to the album');
      return;
    }

    if (!albumData.title.trim()) {
      setLocalError('Please enter an album title');
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);

      // Creating album with selected songs

      const albumSongs: AlbumSong[] = selectedSongs.map(song => {
        // Parse duration using utility function for consistency
        const durationInSeconds = parseDurationToSeconds(song.duration);

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
      setLocalError(getErrorMessage(err, 'Failed to create album. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };


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
                                        {formatDurationFromString(song.duration)}
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