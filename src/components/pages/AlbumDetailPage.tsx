import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  Chip, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Album as AlbumIcon,
  MusicNote as MusicNoteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  VolumeUp as VolumeUpIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAlbum, deleteAlbum, updateAlbum } from '../../services/firebaseService';
import { uploadCoverArt } from '../../services/storageService';
import { Album } from '../../types/album';
import { exportAlbum } from '../../services/exportService';

const AlbumDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { albumId } = useParams<{ albumId: string }>();
  const { currentUser } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId || !currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        const albumData = await getAlbum(albumId);
        
        // Check if the album belongs to the current user
        if (albumData && albumData.userId !== currentUser.uid) {
          setError('You do not have permission to view this album.');
          return;
        }
        
        if (albumData) {
          setAlbum(albumData);
        }
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, currentUser]);

  // Handle audio element setup and cleanup
  useEffect(() => {
    if (!album) return;

    const currentSong = album.songs[currentSongIndex];
    // Check both possible locations of the file path
    const filePath = currentSong?.metadata?.filePath || currentSong?.filePath;
    
    if (!filePath) {
      console.warn('No file path found for song:', currentSong);
      return;
    }

    // Create new audio element
    const audio = new Audio(filePath);
    audioRef.current = audio;

    // Set up event listeners
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentSongIndex < album.songs.length - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
      }
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Error playing audio:', e);
      setError('Failed to play the audio file. Please check if the file exists.');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [album, currentSongIndex]);

  // Update play/pause when isPlaying changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play the audio file. Please check if the file exists.');
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleEditAlbum = () => {
    if (albumId) {
      navigate(`/albums/${albumId}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!albumId) return;
    
    try {
      setLoading(true);
      await deleteAlbum(albumId);
      navigate('/albums');
    } catch (err) {
      console.error('Error deleting album:', err);
      setError('Failed to delete album. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handlePlayPause = () => {
    const currentSong = album?.songs[currentSongIndex];
    const filePath = currentSong?.metadata?.filePath || currentSong?.filePath;
    
    if (!filePath) {
      setError('No audio file found for this song.');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextSong = () => {
    if (album && currentSongIndex < album.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePreviousSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleSongClick = (index: number) => {
    const song = album?.songs[index];
    const filePath = song?.metadata?.filePath || song?.filePath;
    
    if (!filePath) {
      setError('No audio file found for this song.');
      return;
    }

    // If clicking the currently playing song, toggle play/pause
    if (index === currentSongIndex) {
      setIsPlaying(!isPlaying);
      return;
    }

    // Otherwise, start playing the new song
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !albumId) return;

    try {
      setUploadingCover(true);
      setError(null);

      // Upload the cover image
      const coverImageUrl = await uploadCoverArt(file, albumId);

      // Update the album with the new cover image
      const updatedAlbum = await updateAlbum(albumId, {
        ...album!,
        coverImage: coverImageUrl
      });

      // Update local state
      setAlbum(updatedAlbum);
    } catch (err) {
      console.error('Error uploading cover:', err);
      setError('Failed to upload cover image. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleExport = async () => {
    if (!album) return;
    
    try {
      setIsExporting(true);
      setError(null);
      await exportAlbum(album);
    } catch (err) {
      console.error('Error exporting album:', err);
      setError('Failed to export album. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/albums')}
          sx={{ mt: 2 }}
        >
          Back to Albums
        </Button>
      </Box>
    );
  }

  if (!album) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">Album not found.</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/albums')}
          sx={{ mt: 2 }}
        >
          Back to Albums
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/albums')} sx={{ color: 'text.secondary' }}>
          <AlbumIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {album.title}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Album Cover and Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box 
              sx={{ 
                width: '100%', 
                aspectRatio: '1', 
                borderRadius: 2, 
                overflow: 'hidden',
                mb: 2,
                position: 'relative',
                '&:hover .cover-overlay': {
                  opacity: 1
                }
              }}
            >
              <Box
                component="img"
                src={album.coverImage || '/placeholder-album.jpg'}
                alt={album.title}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                className="cover-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer'
                }}
              >
                <input
                  accept="image/*"
                  type="file"
                  id="cover-upload"
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="cover-upload">
                  <IconButton
                    component="span"
                    disabled={uploadingCover}
                    sx={{ color: 'white' }}
                  >
                    {uploadingCover ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <PhotoCameraIcon />
                    )}
                  </IconButton>
                </label>
              </Box>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {album.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {album.artist}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(album.releaseDate)}
              </Typography>
            </Box>
            
            {album.genre && (
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={album.genre} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {album.description || 'No description available.'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {album.selectedPlatforms.map((platform) => (
                <Chip 
                  key={platform} 
                  label={platform} 
                  size="small" 
                  variant="outlined" 
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={handleEditAlbum}
                sx={{ flex: 1 }}
              >
                Edit Album
              </Button>
              <Button
                variant="outlined"
                startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={isExporting || album.selectedPlatforms.length === 0}
                sx={{ flex: 1 }}
              >
                {isExporting ? 'Exporting...' : 'Export Album'}
              </Button>
              <IconButton 
                color="error"
                onClick={handleDeleteClick}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
        
        {/* Songs List */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Songs ({album.songs.length})
            </Typography>
            
            <List>
              {album.songs.map((song, index) => (
                <ListItem 
                  key={song.id}
                  sx={{ 
                    bgcolor: index === currentSongIndex ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSongClick(index)}
                >
                  <ListItemIcon>
                    {index === currentSongIndex && isPlaying ? (
                      <PauseIcon color="primary" />
                    ) : (
                      <PlayIcon color={index === currentSongIndex ? 'primary' : 'inherit'} />
                    )}
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
                        {!song.metadata?.filePath && !song.filePath && (
                          <Chip
                            label="No audio file"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography variant="body2" color="text.secondary">
                      {formatDuration(song.duration)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            {album.songs.length > 0 && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={handlePreviousSong} disabled={currentSongIndex === 0}>
                    <SkipPreviousIcon />
                  </IconButton>
                  <IconButton onClick={handlePlayPause} color="primary">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <IconButton onClick={handleNextSong} disabled={currentSongIndex === album.songs.length - 1}>
                    <SkipNextIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {currentSongIndex + 1} of {album.songs.length}
                  </Typography>
                  <IconButton size="small">
                    <VolumeUpIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ShareIcon />
                  </IconButton>
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Album</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{album.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlbumDetailPage; 