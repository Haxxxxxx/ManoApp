import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import {
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Album as AlbumIcon,
  DragIndicator as DragIndicatorIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MusicNote as MusicNoteIcon,
  Folder as FolderIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips } from '../../contexts/TripContext';
import { Song } from '../../types/song';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { getUserSongs } from '../../services/firebaseService';
import { createAlbum, getAlbum, updateAlbum, deleteAlbum } from '../../services/firebaseService';
import type { Album, AlbumSong } from '../../services/firebaseService';

type SongSource = 'local' | 'remote' | 'upload';

interface ExtendedSong extends Omit<Song, 'metadata'> {
  metadata?: {
    source?: SongSource;
    projectName?: string;
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
    releaseDate?: string;
    featuring?: string[];
    lyrics?: string;
    videoUrl?: string;
    base64Data?: string;
    originalFileName?: string;
    fileSize?: number;
    lastModified?: number;
  };
}

const platforms = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'apple', name: 'Apple Music', color: '#FC3C44' },
  { id: 'amazon', name: 'Amazon Music', color: '#00A8E1' },
  { id: 'youtube', name: 'YouTube Music', color: '#FF0000' },
];

const AlbumCustomizationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, artistProfile } = useAuth();
  const { trips } = useTrips();
  const { albumId } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumData, setAlbumData] = useState({
    title: '',
    artist: '',
    releaseDate: '',
    genre: '',
    description: '',
    coverImage: null as string | null,
    selectedPlatforms: [] as string[],
  });
  const [selectedSongs, setSelectedSongs] = useState<ExtendedSong[]>([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<ExtendedSong[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSong, setEditingSong] = useState<ExtendedSong | null>(null);

  // Load all available songs from different sources
  useEffect(() => {
    const loadAllSongs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allSongs: ExtendedSong[] = [];

        // 1. Load songs from local storage
        const savedLocalFiles = localStorage.getItem('localFiles');
        if (savedLocalFiles) {
          const localSongs = JSON.parse(savedLocalFiles);
          allSongs.push(...localSongs.map((song: Song) => ({
            ...song,
            metadata: {
              ...song.metadata,
              source: 'local' as SongSource
            }
          })));
        }

        // 2. Load songs from trips/projects
        trips.forEach(trip => {
          if (trip.songs) {
            allSongs.push(...trip.songs.map(song => ({
              ...song,
              metadata: {
                ...song.metadata,
                source: 'project' as SongSource,
                projectName: trip.name
              }
            })));
          }
        });

        // 3. Load songs from Firebase
        if (currentUser) {
          try {
            const firebaseSongs = await getUserSongs(currentUser.uid);
            allSongs.push(...firebaseSongs.map(song => ({
              ...song,
              metadata: {
                ...song.metadata,
                source: 'firebase' as SongSource
              }
            })));
          } catch (error) {
            console.error('Error loading Firebase songs:', error);
          }
        }

        setAvailableSongs(allSongs);
      } catch (error) {
        console.error('Error loading songs:', error);
        setError('Failed to load songs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllSongs();
  }, [currentUser, trips]);

  const handlePlatformToggle = (platformId: string) => {
    setAlbumData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAlbumData(prev => ({
          ...prev,
          coverImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSongSelect = (song: ExtendedSong) => {
    setSelectedSongIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(song.id)) {
        newSet.delete(song.id);
      } else {
        newSet.add(song.id);
      }
      return newSet;
    });
  };

  const handleAddSelectedSongs = () => {
    const newSongs = availableSongs.filter(song => selectedSongIds.has(song.id));
    setSelectedSongs(prev => [...prev, ...newSongs]);
    setSelectedSongIds(new Set());
    setShowSongSelector(false);
  };

  const handleRemoveSong = (songId: string) => {
    setSelectedSongs(prev => prev.filter(song => song.id !== songId));
  };

  const handleMoveSong = (fromIndex: number, toIndex: number) => {
    const newSongs = [...selectedSongs];
    const [movedSong] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, movedSong);
    setSelectedSongs(newSongs);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedSongs(items);
  };

  const handleEditSong = (song: ExtendedSong) => {
    setEditingSong(song);
  };

  const handleSaveSongEdit = () => {
    if (editingSong) {
      setSelectedSongs(prev => prev.map(song => song.id === editingSong.id ? editingSong : song));
      setEditingSong(null);
    }
  };

  const handleSaveAlbum = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const mapSource = (source: SongSource | undefined): 'local' | 'project' | 'firebase' => {
        switch (source) {
          case 'local':
            return 'local';
          case 'remote':
            return 'local';
          case 'upload':
            return 'local';
          default:
            return 'local';
        }
      };

      // Clean up the album data by removing undefined values
      const cleanAlbumData = {
        userId: currentUser.uid,
        title: albumData.title || '',
        artist: albumData.artist || '',
        releaseDate: albumData.releaseDate || '',
        genre: albumData.genre || '',
        description: albumData.description || '',
        coverImage: albumData.coverImage || null,
        selectedPlatforms: albumData.selectedPlatforms || [],
        songs: selectedSongs.map(song => {
          // Create a clean metadata object without undefined values
          const cleanMetadata: Record<string, any> = {
            source: mapSource(song.metadata?.source)
          };

          // Only add metadata fields if they have values
          if (song.metadata?.projectName) cleanMetadata.projectName = song.metadata.projectName;
          if (song.metadata?.bpm) cleanMetadata.bpm = song.metadata.bpm;
          if (song.metadata?.key) cleanMetadata.key = song.metadata.key;
          if (song.metadata?.genre) cleanMetadata.genre = song.metadata.genre;
          if (song.metadata?.tags) cleanMetadata.tags = song.metadata.tags;
          if (song.metadata?.releaseDate) cleanMetadata.releaseDate = song.metadata.releaseDate;
          if (song.metadata?.featuring) cleanMetadata.featuring = song.metadata.featuring;
          if (song.metadata?.lyrics) cleanMetadata.lyrics = song.metadata.lyrics;
          if (song.metadata?.videoUrl) cleanMetadata.videoUrl = song.metadata.videoUrl;

          return {
            id: song.id,
            title: song.title || '',
            artist: song.artist || '',
            duration: song.duration || 0,
            metadata: cleanMetadata
          };
        })
      };

      if (albumId) {
        await updateAlbum(albumId, cleanAlbumData);
      } else {
        const newAlbum = await createAlbum(cleanAlbumData);
        navigate(`/albums/${newAlbum.id}`);
      }

      // Show success message or redirect
      navigate('/albums');
    } catch (error) {
      console.error('Error saving album:', error);
      setError('Failed to save album. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <AlbumIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Album Customization
        </Typography>
      </Box>

      {/* Songs Selection Section */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Songs ({selectedSongs.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowSongSelector(true)}
          >
            Add Songs
          </Button>
        </Box>

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
                          bgcolor: 'background.paper',
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemIcon {...provided.dragHandleProps}>
                          <DragIndicatorIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={song.title}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {song.artist}
                              </Typography>
                              {song.metadata?.projectName && (
                                <Chip
                                  label={song.metadata.projectName}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                              {song.metadata?.tags && song.metadata.tags.length > 0 && (
                                <Chip
                                  label={song.metadata.tags[0]}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditSong(song)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSong(song.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <RemoveIcon />
                          </IconButton>
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

        {selectedSongs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No songs added yet. Click "Add Songs" to start building your album.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Album Details Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Album Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Album Title"
                  value={albumData.title}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Artist Name"
                  value={albumData.artist}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, artist: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Release Date"
                  InputLabelProps={{ shrink: true }}
                  value={albumData.releaseDate}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, releaseDate: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Genre"
                  value={albumData.genre}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, genre: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Album Description"
                  value={albumData.description}
                  onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Target Platforms
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {platforms.map((platform) => (
                <Chip
                  key={platform.id}
                  label={platform.name}
                  onClick={() => handlePlatformToggle(platform.id)}
                  sx={{
                    bgcolor: albumData.selectedPlatforms.includes(platform.id)
                      ? alpha(platform.color, 0.1)
                      : 'transparent',
                    border: '1px solid',
                    borderColor: albumData.selectedPlatforms.includes(platform.id)
                      ? platform.color
                      : 'divider',
                    color: albumData.selectedPlatforms.includes(platform.id)
                      ? platform.color
                      : 'text.primary',
                    '&:hover': {
                      bgcolor: alpha(platform.color, 0.2),
                    },
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cover Image
            </Typography>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                mb: 2,
                position: 'relative',
              }}
            >
              {albumData.coverImage ? (
                <Box
                  component="img"
                  src={albumData.coverImage}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <AlbumIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" align="center">
              Click or drag to upload cover image
            </Typography>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => {/* TODO: Implement preview */}}
            >
              Preview
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAlbum}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Song Selector Dialog */}
      <Dialog
        open={showSongSelector}
        onClose={() => setShowSongSelector(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Songs</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab icon={<StorageIcon />} label="All Songs" />
              <Tab icon={<FolderIcon />} label="Projects" />
              <Tab icon={<CloudIcon />} label="Cloud" />
              <Tab icon={<MusicNoteIcon />} label="Local" />
            </Tabs>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : (
            <List>
              {availableSongs
                .filter(song => {
                  if (activeTab === 0) return true;
                  if (activeTab === 1) return song.metadata?.projectName !== undefined;
                  if (activeTab === 2) return song.metadata?.source === 'remote';
                  if (activeTab === 3) return song.metadata?.source === 'local';
                  return true;
                })
                .map((song) => (
                  <ListItem key={song.id}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedSongIds.has(song.id)}
                        onChange={() => handleSongSelect(song)}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      {song.metadata?.source === 'local' && <StorageIcon />}
                      {song.metadata?.projectName && <FolderIcon />}
                      {song.metadata?.source === 'remote' && <CloudIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={song.title}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {song.artist}
                          </Typography>
                          {song.metadata?.projectName && (
                            <Chip
                              label={song.metadata.projectName}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {song.metadata?.tags && song.metadata.tags.length > 0 && (
                            <Chip
                              label={song.metadata.tags[0]}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSongSelector(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSelectedSongs}
            disabled={selectedSongIds.size === 0}
          >
            Add Selected ({selectedSongIds.size})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Song Edit Dialog */}
      <Dialog
        open={!!editingSong}
        onClose={() => setEditingSong(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Edit Song Details</Typography>
            <IconButton onClick={() => setEditingSong(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={editingSong?.title || ''}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Artist"
                  value={editingSong?.artist || ''}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, artist: e.target.value } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Genre"
                  value={editingSong?.metadata?.genre?.join(', ') || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      genre: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                    }
                  } : null)}
                  helperText="Separate multiple genres with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={editingSong?.metadata?.tags?.join(', ') || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }
                  } : null)}
                  helperText="Separate multiple tags with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Release Date"
                  type="date"
                  value={editingSong?.metadata?.releaseDate || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      releaseDate: e.target.value
                    }
                  } : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="BPM"
                  type="number"
                  value={editingSong?.metadata?.bpm || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      bpm: Number(e.target.value)
                    }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Key"
                  value={editingSong?.metadata?.key || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      key: e.target.value
                    }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Video URL"
                  value={editingSong?.metadata?.videoUrl || ''}
                  onChange={(e) => setEditingSong(prev => prev ? {
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      videoUrl: e.target.value
                    }
                  } : null)}
                  placeholder="Enter YouTube or other video platform URL"
                  helperText="Add a link to a video preview or music video"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Lyrics
                  </Typography>
                  {editingSong?.metadata?.lyrics ? (
                    <Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={editingSong.metadata.lyrics}
                        onChange={(e) => setEditingSong(prev => prev ? {
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            lyrics: e.target.value
                          }
                        } : null)}
                      />
                      <Button
                        size="small"
                        onClick={() => setEditingSong(prev => prev ? {
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            lyrics: ''
                          }
                        } : null)}
                        sx={{ mt: 1 }}
                      >
                        Clear Lyrics
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <input
                        type="file"
                        accept=".txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const content = event.target?.result as string;
                              setEditingSong(prev => prev ? {
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  lyrics: content
                                }
                              } : null);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="lyrics-file-input"
                      />
                      <label htmlFor="lyrics-file-input">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                        >
                          Upload Lyrics File
                        </Button>
                      </label>
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Upload a .txt file containing the song lyrics
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSong(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSongEdit}
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlbumCustomizationPage; 