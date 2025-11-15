import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Checkbox, Button, IconButton, Avatar, CircularProgress, Dialog } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useState } from 'react';
import { Song } from '../../types';
import { uploadCoverArt } from '../../services/storageService';
import { updateSong } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import SoundCloudExportPanel from './SoundCloudExportPanel';

interface MetadataEditorPanelProps {
  songs: Song[];
  onClose: () => void;
  tripId: string;
}

interface EditableSong extends Song {
  isSelected?: boolean;
  isUploading?: boolean;
}

const MetadataEditorPanel = ({ songs, onClose, tripId }: MetadataEditorPanelProps) => {
  const [editableSongs, setEditableSongs] = useState<EditableSong[]>(
    songs.map(song => ({ ...song, isSelected: false, isUploading: false }))
  );
  const [selectAll, setSelectAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [selectedSongForExport, setSelectedSongForExport] = useState<Song | null>(null);
  const { currentUser } = useAuth();

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setEditableSongs(prev => prev.map(song => ({ ...song, isSelected: !selectAll })));
  };

  const handleSelectSong = (songId: string) => {
    setEditableSongs(prev => prev.map(song => 
      song.id === songId ? { ...song, isSelected: !song.isSelected } : song
    ));
  };

  const handleSongChange = (songId: string, field: keyof Song | keyof Required<Song>['metadata'], value: string) => {
    setEditableSongs(prev => prev.map(song => {
      if (song.id !== songId) return song;

      if (field in song) {
        return { ...song, [field]: value };
      } else {
        // Handle metadata fields
        return {
          ...song,
          metadata: {
            ...song.metadata,
            [field]: field === 'bpm' ? parseInt(value) || 0 : 
                     field === 'genre' || field === 'tags' ? value.split(',').map(item => item.trim()) :
                     value
          }
        };
      }
    }));
  };

  const handleCoverArtUpload = async (songId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    
    // Update the song to show uploading state
    setEditableSongs(prev => prev.map(song => 
      song.id === songId ? { ...song, isUploading: true } : song
    ));
    
    try {
      // Upload the cover art
      const imageUrl = await uploadCoverArt(file, tripId, songId);
      
      // Update the song with the new image URL
      setEditableSongs(prev => prev.map(song => 
        song.id === songId ? { ...song, imagePath: imageUrl, isUploading: false } : song
      ));
      
      // Update the song in the database
      await updateSong(songId, { imagePath: imageUrl });
    } catch (error) {
      // Error uploading cover art
      // Reset the uploading state
      setEditableSongs(prev => prev.map(song => 
        song.id === songId ? { ...song, isUploading: false } : song
      ));
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    
    try {
      // Save all selected songs
      const selectedSongs = editableSongs.filter(song => song.isSelected);
      
      for (const song of selectedSongs) {
        const { isSelected, isUploading, ...songData } = song;
        await updateSong(song.id, songData);
      }
      
      onClose();
    } catch (error) {
      // Error saving songs
    } finally {
      setSaving(false);
    }
  };

  const handleExportClick = (song: Song) => {
    setSelectedSongForExport(song);
    setShowExportPanel(true);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Edit Metadata</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Cover</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Release Date</TableCell>
                <TableCell>BPM</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editableSongs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={song.isSelected}
                      onChange={() => handleSelectSong(song.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={song.imagePath} 
                        variant="rounded" 
                        sx={{ width: 50, height: 50 }}
                      />
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id={`cover-upload-${song.id}`}
                        type="file"
                        onChange={(e) => handleCoverArtUpload(song.id, e)}
                      />
                      <label htmlFor={`cover-upload-${song.id}`}>
                        <IconButton 
                          color="primary" 
                          component="span"
                          disabled={song.isUploading}
                        >
                          {song.isUploading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                        </IconButton>
                      </label>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.title}
                      variant="standard"
                      fullWidth
                      onChange={(e) => handleSongChange(song.id, 'title', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={song.artist}
                      onChange={(e) => handleSongChange(song.id, 'artist', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={song.metadata?.releaseDate || ''}
                      onChange={(e) => handleSongChange(song.id, 'releaseDate', e.target.value)}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={song.metadata?.bpm || ''}
                      onChange={(e) => handleSongChange(song.id, 'bpm', e.target.value)}
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={song.metadata?.key || ''}
                      onChange={(e) => handleSongChange(song.id, 'key', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.genre?.join(', ')}
                      variant="standard"
                      fullWidth
                      onChange={(e) => handleSongChange(song.id, 'genre', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.tags?.join(', ')}
                      variant="standard"
                      fullWidth
                      onChange={(e) => handleSongChange(song.id, 'tags', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      startIcon={<CloudDownloadIcon />}
                      onClick={() => handleExportClick(song)}
                      size="small"
                    >
                      Export
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSongForExport && (
          <SoundCloudExportPanel
            song={selectedSongForExport}
            onClose={() => setShowExportPanel(false)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default MetadataEditorPanel; 