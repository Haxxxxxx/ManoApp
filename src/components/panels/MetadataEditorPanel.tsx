import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Checkbox, Button, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Song } from '../../types';

interface MetadataEditorPanelProps {
  songs: Song[];
  onClose: () => void;
}

const MetadataEditorPanel = ({ songs, onClose }: MetadataEditorPanelProps) => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Batch Metadata Editor</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" startIcon={<SaveIcon />}>
              Save Changes
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox />
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
              {songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.title}
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.artist}
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.bpm}
                      variant="standard"
                      type="number"
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.key}
                      variant="standard"
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.genre?.join(', ')}
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      defaultValue={song.metadata?.tags?.join(', ')}
                      variant="standard"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="primary">
            Apply to Selected
          </Button>
          <Button variant="outlined" color="primary">
            Clear Selected
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MetadataEditorPanel; 