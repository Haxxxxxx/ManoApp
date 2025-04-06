import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs } from '../services/firebaseService';
import { Song } from '../types';
import { useEffect, useState } from 'react';

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
    <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h6">
          {isDragActive
            ? 'Drop your files here'
            : 'Drag and drop audio files, images, or FL Studio projects here'}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          {selectedTrip ? tripName : 'Select a Trip'}
        </Typography>
        {selectedTrip && (
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
        )}
      </Box>
    </Box>
  );
};

export default MainContent; 