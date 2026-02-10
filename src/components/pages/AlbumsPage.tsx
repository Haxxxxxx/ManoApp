import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Album as AlbumIcon,
  MusicNote as MusicNoteIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAlbums, deleteAlbum } from '../../services/firebaseService';
import { Album } from '../../types/album';
import { formatDate } from '../../utils/formatters';
import { createDevPlaceholderAlbum, isDevPlaceholderAlbum } from '../../utils/devPlaceholder';
import { useMemo } from 'react';

const AlbumsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!currentUser) {
        setLoading(false);
        setAlbums([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const userAlbums = await getAlbums(currentUser.uid);
        // Ensure we always have an array
        const albumsArray = Array.isArray(userAlbums) ? userAlbums : [];
        setAlbums(albumsArray);
      } catch (err) {
        // Error fetching albums
        setError('Failed to load albums. Please try again.');
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [currentUser]);

  const handleCreateAlbum = () => {
    navigate('/albums/create');
  };

  const handleEditAlbum = (albumId: string) => {
    navigate(`/albums/${albumId}/edit`);
  };

  const handleViewAlbum = (albumId: string) => {
    navigate(`/albums/${albumId}`);
  };

  // Add dev placeholder album in development mode
  const displayAlbums = useMemo(() => {
    const allAlbums = [...albums];
    if (import.meta.env.DEV && albums.length === 0) {
      allAlbums.push(createDevPlaceholderAlbum());
    }
    return allAlbums;
  }, [albums]);

  const handleDeleteClick = (album: Album) => {
    // Prevent deletion of dev placeholder
    if (import.meta.env.DEV && isDevPlaceholderAlbum(album)) {
      return;
    }
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!albumToDelete) return;
    
    try {
      setLoading(true);
      await deleteAlbum(albumToDelete.id);
      setAlbums(albums.filter(album => album.id !== albumToDelete.id));
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    } catch (err) {
      // Error deleting album
      setError('Failed to delete album. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAlbumToDelete(null);
  };

  // Use centralized formatDate from utils/formatters

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          variant="h4" 
          fontWeight="bold"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          My Albums
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAlbum}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            boxShadow: `0px 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: `0px 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            }
          }}
        >
          Create Album
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonLoader variant="card" count={6} />
      ) : displayAlbums.length === 0 ? (
        <EmptyState
          icon={<AlbumIcon sx={{ fontSize: 80, color: 'primary.main' }} />}
          title="No Albums Yet"
          description="Create your first album to start organizing your music. Albums help you group related songs together and prepare them for release."
          actionLabel="Create Album"
          onAction={handleCreateAlbum}
          sx={{ my: 6 }}
        />
      ) : (
        <Grid container spacing={3}>
          {displayAlbums.map((album) => {
            const isDev = import.meta.env.DEV && isDevPlaceholderAlbum(album);
            return (
            <Grid item xs={12} sm={6} md={4} key={album.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0px 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
                    borderColor: theme.palette.primary.main,
                    '&::before': {
                      opacity: 1,
                    }
                  }
                }}
                onClick={() => handleViewAlbum(album.id)}
              >
                {isDev && (
                  <Chip
                    label="🧪 DEV"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      bgcolor: 'error.main',
                      color: 'white',
                      fontSize: '0.65rem',
                      height: 20,
                      fontWeight: 'bold',
                      border: '1px solid white',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                )}
                <CardMedia
                  component="img"
                  height="200"
                  image={album.coverImage || '/placeholder-album.jpg'}
                  alt={album.title}
                  sx={{ objectFit: 'cover', position: 'relative' }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {album.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {album.artist}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {album.releaseDate ? formatDate(album.releaseDate) : 'No date'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MusicNoteIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {album.songs.length} {album.songs.length === 1 ? 'song' : 'songs'}
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
                  
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {!isDev && (
                        <>
                          <Tooltip title="Edit Album" arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAlbum(album.id);
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: 2,
                                }
                              }}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete Album" arrow>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(album);
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: 2,
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            );
          })}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Album</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{albumToDelete?.title}"? This action cannot be undone.
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

export default AlbumsPage; 