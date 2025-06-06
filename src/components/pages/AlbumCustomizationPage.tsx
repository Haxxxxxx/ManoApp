import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  InputAdornment
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
  Close as CloseIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrips } from '../../contexts/TripContext';
import { Song } from '../../types/song';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { getUserSongs } from '../../services/firebaseService';
import { createAlbum, getAlbum, updateAlbum, deleteAlbum } from '../../services/firebaseService';
import type { Album, AlbumSong } from '../../services/firebaseService';
import { debounce } from 'lodash';
import { formatDuration } from '../../utils/formatters';

type SongSource = 'local' | 'project' | 'firebase';

interface ExtendedSong extends Omit<AlbumSong, 'duration' | 'metadata'> {
  duration: string | number;
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
    filePath?: string;
  };
}

const platforms = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'apple', name: 'Apple Music', color: '#FC3C44' },
  { id: 'amazon', name: 'Amazon Music', color: '#00A8E1' },
  { id: 'youtube', name: 'YouTube Music', color: '#FF0000' },
];

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const GENRE_MAX_LENGTH = 50;

interface FieldError {
  error: boolean;
  message: string;
}

interface FormErrors {
  title: FieldError;
  artist: FieldError;
  genre: FieldError;
  description: FieldError;
}

const mapSourceType = (source: SongSource | undefined): SongSource | undefined => source;

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
  const [lastSavedData, setLastSavedData] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: { error: false, message: '' },
    artist: { error: false, message: '' },
    genre: { error: false, message: '' },
    description: { error: false, message: '' },
  });

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

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!albumId) {
      const savedDraft = localStorage.getItem('albumDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setAlbumData(draft.albumData);
          setSelectedSongs(draft.selectedSongs);
        } catch (err) {
          console.error('Error loading draft:', err);
        }
      }
    }
  }, [albumId]);

  // Debounced save function
  const saveToLocalStorage = useCallback(
    debounce((data: { albumData: typeof albumData; selectedSongs: typeof selectedSongs }) => {
      try {
        localStorage.setItem('albumDraft', JSON.stringify(data));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error saving draft:', err);
        setSaveStatus('error');
      }
    }, 1000),
    []
  );

  // Autosave when data changes
  useEffect(() => {
    if (!albumId) {  // Only autosave for new albums
      const currentData = JSON.stringify({ albumData, selectedSongs });
      if (currentData !== lastSavedData) {
        setSaveStatus('saving');
        saveToLocalStorage({ albumData, selectedSongs });
        setLastSavedData(currentData);
      }
    }
  }, [albumData, selectedSongs, albumId, lastSavedData, saveToLocalStorage]);

  // Add this effect to load existing album data when editing
  useEffect(() => {
    const loadAlbumData = async () => {
      if (!albumId || !currentUser) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const albumData = await getAlbum(albumId);
        
        if (!albumData) {
          setError('Album not found');
          return;
        }
        
        if (albumData.userId !== currentUser.uid) {
          setError('You do not have permission to edit this album');
          return;
        }
        
        // Set the album data
        setAlbumData({
          title: albumData.title,
          artist: albumData.artist,
          releaseDate: albumData.releaseDate,
          genre: albumData.genre,
          description: albumData.description,
          coverImage: albumData.coverImage,
          selectedPlatforms: albumData.selectedPlatforms || [],
        });
        
        // Set the selected songs
        setSelectedSongs(albumData.songs.map(song => ({
          ...song,
          duration: typeof song.duration === 'number' ? 
            formatDuration(song.duration) : 
            song.duration
        })));
        
      } catch (error) {
        console.error('Error loading album:', error);
        setError('Failed to load album data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbumData();
  }, [albumId, currentUser]);

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
    const songsToAdd = availableSongs
      .filter(song => selectedSongIds.has(song.id))
      .map(song => ({
        ...song,
        duration: typeof song.duration === 'string' ? 
          parseInt(song.duration.split(':')[0]) * 60 + parseInt(song.duration.split(':')[1]) : 
          song.duration
      }));
    
    setSelectedSongs(prev => [...prev, ...songsToAdd]);
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

  const validateField = (field: keyof FormErrors, value: string) => {
    switch (field) {
      case 'title':
        if (!value.trim()) {
          return { error: true, message: 'Title is required' };
        }
        if (value.length > TITLE_MAX_LENGTH) {
          return { error: true, message: `Title must be ${TITLE_MAX_LENGTH} characters or less` };
        }
        break;
      case 'artist':
        if (!value.trim()) {
          return { error: true, message: 'Artist name is required' };
        }
        break;
      case 'genre':
        if (value.length > GENRE_MAX_LENGTH) {
          return { error: true, message: `Genre must be ${GENRE_MAX_LENGTH} characters or less` };
        }
        break;
      case 'description':
        if (value.length > DESCRIPTION_MAX_LENGTH) {
          return { error: true, message: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less` };
        }
        break;
    }
    return { error: false, message: '' };
  };

  const handleFieldChange = (field: keyof typeof albumData, value: string) => {
    const validation = validateField(field as keyof FormErrors, value);
    setFormErrors(prev => ({
      ...prev,
      [field]: validation
    }));

    setAlbumData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    const validations = {
      title: validateField('title', albumData.title),
      artist: validateField('artist', albumData.artist),
      genre: validateField('genre', albumData.genre),
      description: validateField('description', albumData.description),
    };

    setFormErrors(validations);
    return !Object.values(validations).some(v => v.error);
  };

  const handleSaveAlbum = async () => {
    if (!isFormValid()) {
      setError('Please fix the form errors before saving');
      return;
    }

    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);

      const cleanAlbumData = {
        userId: currentUser.uid,
        title: albumData.title,
        artist: albumData.artist,
        releaseDate: albumData.releaseDate,
        genre: albumData.genre,
        description: albumData.description,
        coverImage: albumData.coverImage,
        selectedPlatforms: albumData.selectedPlatforms,
        songs: selectedSongs.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: typeof song.duration === 'string' ? 
            parseInt(song.duration.split(':')[0]) * 60 + parseInt(song.duration.split(':')[1]) : 
            Number(song.duration),
          metadata: {
            ...song.metadata,
            source: mapSourceType(song.metadata?.source)
          }
        })) as AlbumSong[]
      };

      if (albumId) {
        await updateAlbum(albumId, cleanAlbumData);
      } else {
        const newAlbum = await createAlbum(cleanAlbumData);
        navigate(`/albums/${newAlbum.id}`);
      }

      if (!albumId) {
        localStorage.removeItem('albumDraft');
      }

      navigate('/albums');
    } catch (err) {
      console.error('Error saving album:', err);
      setError('Failed to save album. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSongsByTab = (song: ExtendedSong) => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return song.metadata?.source === 'local';
    if (activeTab === 2) return song.metadata?.source === 'firebase';
    return true;
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <AlbumIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {albumId ? 'Edit Album' : 'Create Album'}
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
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
                <TextField
                  fullWidth
                  label="Album Title"
                  value={albumData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  error={formErrors.title.error}
                  helperText={
                    formErrors.title.error ? formErrors.title.message :
                    `${albumData.title.length}/${TITLE_MAX_LENGTH} characters`
                  }
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: albumData.title.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFieldChange('title', '')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Artist Name"
                  value={albumData.artist}
                  onChange={(e) => handleFieldChange('artist', e.target.value)}
                  error={formErrors.artist.error}
                  helperText={formErrors.artist.error && formErrors.artist.message}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: albumData.artist.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFieldChange('artist', '')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Genre"
                  value={albumData.genre}
                  onChange={(e) => handleFieldChange('genre', e.target.value)}
                  error={formErrors.genre.error}
                  helperText={
                    formErrors.genre.error ? formErrors.genre.message :
                    `${albumData.genre.length}/${GENRE_MAX_LENGTH} characters`
                  }
                  margin="normal"
                  InputProps={{
                    endAdornment: albumData.genre.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFieldChange('genre', '')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Release Date"
                  type="date"
                  value={albumData.releaseDate}
                  onChange={(e) => handleFieldChange('releaseDate', e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={albumData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  error={formErrors.description.error}
                  helperText={
                    formErrors.description.error ? formErrors.description.message :
                    `${albumData.description.length}/${DESCRIPTION_MAX_LENGTH} characters`
                  }
                  margin="normal"
                  multiline
                  rows={4}
                  InputProps={{
                    endAdornment: albumData.description.length > 0 && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => handleFieldChange('description', '')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Release Platforms
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {platforms.map((platform) => (
                      <Chip
                        key={platform.id}
                        label={platform.name}
                        onClick={() => handlePlatformToggle(platform.id)}
                        color={albumData.selectedPlatforms.includes(platform.id) ? 'primary' : 'default'}
                        sx={{
                          bgcolor: albumData.selectedPlatforms.includes(platform.id) 
                            ? alpha(platform.color, 0.1)
                            : 'transparent',
                          '&:hover': {
                            bgcolor: albumData.selectedPlatforms.includes(platform.id)
                              ? alpha(platform.color, 0.2)
                              : alpha(platform.color, 0.05),
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
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
        </>
      )}

      {/* Song Selector Dialog */}
      <Dialog
        open={showSongSelector}
        onClose={() => setShowSongSelector(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Songs</DialogTitle>
        <DialogContent>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="All Songs" />
            <Tab label="Local Files" />
            <Tab label="Cloud Files" />
          </Tabs>

          <List>
            {availableSongs
              .filter(filterSongsByTab)
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
                    {song.metadata?.source === 'local' && <FolderIcon />}
                    {song.metadata?.source === 'firebase' && <CloudIcon />}
                    {!song.metadata?.source && <MusicNoteIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={song.title}
                    secondary={song.artist}
                  />
                  <ListItemSecondaryAction>
                    <Typography variant="body2" color="text.secondary">
                      {typeof song.duration === 'string' ? song.duration : formatDuration(song.duration)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSongSelector(false)}>Cancel</Button>
          <Button
            onClick={handleAddSelectedSongs}
            color="primary"
            disabled={selectedSongIds.size === 0}
          >
            Add {selectedSongIds.size} Song{selectedSongIds.size !== 1 ? 's' : ''}
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