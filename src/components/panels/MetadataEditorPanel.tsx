import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Checkbox, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useState } from 'react';
import { Song } from '../../types';

interface MetadataEditorPanelProps {
  songs: Song[];
  onClose: () => void;
}

interface EditableSong extends Song {
  isSelected?: boolean;
}

const MetadataEditorPanel = ({ songs, onClose }: MetadataEditorPanelProps) => {
  const [editableSongs, setEditableSongs] = useState<EditableSong[]>(
    songs.map(song => ({ ...song, isSelected: false }))
  );
  const [selectAll, setSelectAll] = useState(false);

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
            [field]: field === 'bpm' ? parseInt(value) || 0 : value
          }
        };
      }
    }));
  };

  const handleSave = async () => {
    // Implement save logic here
    onClose();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Edit Metadata</Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
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
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>BPM</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Tags</TableCell>
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
                    <TextField
                      defaultValue={song.title}
                      variant="standard"
                      fullWidth
                      onChange={(e) => handleSongChange(song.id, 'title', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.artist}
                      variant="standard"
                      fullWidth
                      onChange={(e) => handleSongChange(song.id, 'artist', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.bpm}
                      variant="standard"
                      type="number"
                      sx={{ width: 80 }}
                      onChange={(e) => handleSongChange(song.id, 'bpm', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.key}
                      variant="standard"
                      sx={{ width: 80 }}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default MetadataEditorPanel; 