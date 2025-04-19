import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  IconButton, 
  Chip, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Album as AlbumIcon,
  MusicNote as MusicNoteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAlbums, deleteAlbum } from '../../services/firebaseService';
import { Album } from '../../types/album';

const AlbumsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        const userAlbums = await getAlbums(currentUser.uid);
        setAlbums(userAlbums);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError('Failed to load albums. Please try again.');
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

  const handleDeleteClick = (album: Album) => {
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
      console.error('Error deleting album:', err);
      setError('Failed to delete album. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAlbumToDelete(null);
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

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          My Albums
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAlbum}
        >
          Create Album
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : albums.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 6,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <AlbumIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Albums Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create your first album to start organizing your music.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAlbum}
          >
            Create Album
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {albums.map((album) => (
            <Grid item xs={12} sm={6} md={4} key={album.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={album.coverImage || '/placeholder-album.jpg'}
                  alt={album.title}
                  sx={{ objectFit: 'cover' }}
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
                      {formatDate(album.releaseDate)}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        size="small" 
                        onClick={() => handleViewAlbum(album.id)}
                      >
                        View
                      </Button>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditAlbum(album.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(album)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
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