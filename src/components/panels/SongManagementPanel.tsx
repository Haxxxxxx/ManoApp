import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Song } from '../../types';
import { updateSong, deleteSong } from '../../services/firebaseService';
import { exportMixtapeForSoundCloud } from '../../services/exportService';

interface SongManagementPanelProps {
  songs: Song[];
  tripId: string;
  onClose: () => void;
  onSongsUpdated: (songs: Song[]) => void;
}

const SongManagementPanel: React.FC<SongManagementPanelProps> = ({
  songs,
  tripId,
  onClose,
  onSongsUpdated
}) => {
  const [editableSongs, setEditableSongs] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedArtist, setEditedArtist] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [mixtapeTitle, setMixtapeTitle] = useState('');
  const [mixtapeDescription, setMixtapeDescription] = useState('');
  const [mixtapeTags, setMixtapeTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportPlatform, setExportPlatform] = useState<'soundcloud' | 'spotify'>('soundcloud');
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize editable songs when component mounts
  useEffect(() => {
    setEditableSongs([...songs]);
  }, [songs]);

  // Handle song reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(editableSongs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEditableSongs(items);
    onSongsUpdated(items);
  };

  // Start editing a song
  const handleEditStart = (song: Song) => {
    setEditingSongId(song.id);
    setEditedTitle(song.title);
    setEditedArtist(song.artist);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingSongId(null);
    setEditedTitle('');
    setEditedArtist('');
  };

  // Save song edits
  const handleEditSave = async (songId: string) => {
    try {
      const updatedSong = editableSongs.find(s => s.id === songId);
      if (!updatedSong) return;

      const songUpdates = {
        title: editedTitle,
        artist: editedArtist
      };

      // Update in Firebase
      await updateSong(songId, songUpdates);

      // Update local state
      const updatedSongs = editableSongs.map(song => 
        song.id === songId 
          ? { ...song, title: editedTitle, artist: editedArtist } 
          : song
      );

      setEditableSongs(updatedSongs);
      onSongsUpdated(updatedSongs);
      setEditingSongId(null);
    } catch (error) {
      console.error('Error updating song:', error);
    }
  };

  // Toggle song selection
  const handleToggleSelect = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId) 
        : [...prev, songId]
    );
  };

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !mixtapeTags.includes(newTag.trim())) {
      setMixtapeTags([...mixtapeTags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setMixtapeTags(mixtapeTags.filter(tag => tag !== tagToRemove));
  };

  // Open export dialog
  const handleOpenExportDialog = () => {
    if (selectedSongs.length === 0) return;
    
    // Set default mixtape title if not already set
    if (!mixtapeTitle) {
      const selectedSongsData = editableSongs.filter(song => selectedSongs.includes(song.id));
      setMixtapeTitle(`${selectedSongsData[0]?.artist || 'Mixtape'} - ${new Date().toLocaleDateString()}`);
    }
    
    setExportDialogOpen(true);
  };

  // Close export dialog
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setExportError(null);
    setExportSuccess(false);
  };

  // Export mixtape
  const handleExportMixtape = async () => {
    if (selectedSongs.length === 0) return;
    
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      const selectedSongsData = editableSongs.filter(song => selectedSongs.includes(song.id));
      
      if (exportPlatform === 'soundcloud') {
        await exportMixtapeForSoundCloud(
          selectedSongsData,
          mixtapeTitle,
          mixtapeDescription,
          mixtapeTags
        );
      } else {
        // Spotify export would go here
        console.log('Spotify export not implemented yet');
      }
      
      setExportSuccess(true);
      setTimeout(() => {
        handleCloseExportDialog();
      }, 2000);
    } catch (error) {
      console.error('Error exporting mixtape:', error);
      setExportError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle song deletion
  const handleDeleteSong = (song: Song) => {
    setSongToDelete(song);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    
    setDeletingSongId(songToDelete.id);
    setError(null);
    
    try {
      // Delete from Firebase
      await deleteSong(songToDelete.id);
      
      // Update local state
      const updatedSongs = editableSongs.filter(s => s.id !== songToDelete.id);
      setEditableSongs(updatedSongs);
      onSongsUpdated(updatedSongs);
      
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song. Please try again.');
    } finally {
      setDeletingSongId(null);
      setSongToDelete(null);
    }
  };

  const cancelDeleteSong = () => {
    setDeleteConfirmOpen(false);
    setSongToDelete(null);
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        Song Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Songs ({editableSongs.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudDownloadIcon />}
            onClick={handleOpenExportDialog}
            disabled={selectedSongs.length === 0}
          >
            Export Selected ({selectedSongs.length})
          </Button>
        </Box>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="songs">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {editableSongs.map((song, index) => (
                  <Draggable key={song.id} draggableId={song.id} index={index}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                            <DragIndicatorIcon color="action" />
                          </Box>
                          
                          {editingSongId === song.id ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <TextField
                                label="Title"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                              <TextField
                                label="Artist"
                                value={editedArtist}
                                onChange={(e) => setEditedArtist(e.target.value)}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton 
                                  onClick={() => handleEditCancel()} 
                                  color="error"
                                  size="small"
                                  sx={{ mr: 1 }}
                                >
                                  <CancelIcon />
                                </IconButton>
                                <IconButton 
                                  onClick={() => handleEditSave(song.id)} 
                                  color="primary"
                                  size="small"
                                >
                                  <SaveIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          ) : (
                            <>
                              <ListItemText
                                primary={song.title}
                                secondary={song.artist}
                                sx={{ flex: 1 }}
                              />
                              <Box sx={{ display: 'flex' }}>
                                <IconButton 
                                  onClick={() => handleEditStart(song)}
                                  size="small"
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  onClick={() => handleDeleteSong(song)}
                                  size="small"
                                  color="error"
                                  disabled={deletingSongId === song.id}
                                >
                                  {deletingSongId === song.id ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    <DeleteIcon />
                                  )}
                                </IconButton>
                              </Box>
                            </>
                          )}
                        </Box>
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
      
      {/* Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={handleCloseExportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Export Mixtape</DialogTitle>
        <DialogContent>
          {exportError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}
          
          {exportSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Mixtape exported successfully!
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Export Platform</InputLabel>
                <Select
                  value={exportPlatform}
                  onChange={(e) => setExportPlatform(e.target.value as 'soundcloud' | 'spotify')}
                  label="Export Platform"
                >
                  <MenuItem value="soundcloud">SoundCloud</MenuItem>
                  <MenuItem value="spotify">Spotify</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Mixtape Title"
                value={mixtapeTitle}
                onChange={(e) => setMixtapeTitle(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={mixtapeDescription}
                onChange={(e) => setMixtapeDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {mixtapeTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  Add
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Songs ({selectedSongs.length})
              </Typography>
              <List dense>
                {editableSongs
                  .filter(song => selectedSongs.includes(song.id))
                  .map((song, index) => (
                    <ListItem key={song.id}>
                      <ListItemText 
                        primary={`${index + 1}. ${song.title}`} 
                        secondary={song.artist} 
                      />
                    </ListItem>
                  ))}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button 
            onClick={handleExportMixtape} 
            variant="contained" 
            color="primary"
            disabled={isExporting || !mixtapeTitle || selectedSongs.length === 0}
            startIcon={isExporting ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDeleteSong}
        aria-labelledby="delete-song-dialog-title"
        aria-describedby="delete-song-dialog-description"
      >
        <DialogTitle id="delete-song-dialog-title">
          Delete Song
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-song-dialog-description">
            Are you sure you want to delete "{songToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteSong} disabled={deletingSongId !== null}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteSong} 
            color="error" 
            variant="contained"
            disabled={deletingSongId !== null}
            startIcon={deletingSongId !== null ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletingSongId !== null ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SongManagementPanel; 