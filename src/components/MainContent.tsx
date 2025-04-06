import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper, Card, IconButton, Divider } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs } from '../services/firebaseService';
import { Song } from '../types';
import { useEffect, useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MicIcon from '@mui/icons-material/Mic';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';

interface MainContentProps {
  selectedTrip: string | null;
}

const MainContent = ({ selectedTrip }: MainContentProps) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [tripName, setTripName] = useState<string>('');

  useEffect(() => {
    const fetchTripData = async () => {
      if (selectedTrip) {
        const trip = await getTrip(selectedTrip);
        if (trip) {
          setTripName(trip.name);
          const tripSongs = await getSongs(selectedTrip);
          setSongs(tripSongs);
        }
      }
    };

    fetchTripData();
  }, [selectedTrip]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/*': ['.flp']
    }
  });

  const handleSongClick = (song: Song) => {
    if (selectedTrip) {
      navigate(`/trip/${selectedTrip}/song/${song.id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* Left Panel */}
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" sx={{ p: 2 }}>
          {selectedTrip ? tripName : 'Select a Trip'}
        </Typography>

        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PlayArrowIcon />
            <Typography>Quick Actions</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="primary">
              <MicIcon />
            </IconButton>
            <IconButton color="primary">
              <LibraryMusicIcon />
            </IconButton>
          </Box>
        </Card>

        <Card sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" gutterBottom>Recent Files</Typography>
          <List dense>
            {songs.slice(0, 5).map((song) => (
              <ListItem key={song.id} disablePadding>
                <ListItemButton onClick={() => handleSongClick(song)}>
                  <ListItemText primary={song.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Card>

        <IconButton 
          color="primary" 
          sx={{ alignSelf: 'center', width: 56, height: 56 }}
        >
          <AddCircleIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>

      {/* Middle Panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            }}
          >
            <input {...getInputProps()} />
            <Typography>
              {isDragActive
                ? 'Drop your files here'
                : 'Drag and drop audio files, images, or FL Studio projects here'}
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>All Files</Typography>
          <List>
            {songs.map((song) => (
              <ListItem key={song.id} divider>
                <ListItemButton onClick={() => handleSongClick(song)}>
                  <ListItemText
                    primary={song.title}
                    secondary={`${song.artist} • ${song.duration}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Right Panel */}
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2, height: '50%' }}>
          <Typography variant="h6" gutterBottom>Project Info</Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date().toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Files: {songs.length}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, height: '50%' }}>
          <Typography variant="h6" gutterBottom>Activity</Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="File added"
                secondary="2 minutes ago"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Project updated"
                secondary="1 hour ago"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default MainContent; 