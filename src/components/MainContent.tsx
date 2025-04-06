import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper, IconButton, Button, Dialog } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs } from '../services/firebaseService';
import { Song } from '../types';
import { useEffect, useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TagIcon from '@mui/icons-material/Tag';

// Import panels
import ExportSettingsPanel from './panels/ExportSettingsPanel';
import MetadataEditorPanel from './panels/MetadataEditorPanel';
import CollaboratorsPanel from './panels/CollaboratorsPanel';
import ProjectAnalyticsPanel from './panels/ProjectAnalyticsPanel';

type ActivePanel = 'export' | 'metadata' | 'collaborators' | 'analytics' | null;

interface MainContentProps {
  selectedTrip: string | null;
}

const MainContent = ({ selectedTrip }: MainContentProps) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [tripName, setTripName] = useState<string>('');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

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

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  const renderActivePanel = () => {
    if (!activePanel) return null;

    const panels = {
      export: <ExportSettingsPanel onClose={handleClosePanel} />,
      metadata: <MetadataEditorPanel songs={songs} onClose={handleClosePanel} />,
      collaborators: <CollaboratorsPanel tripId={selectedTrip || ''} onClose={handleClosePanel} />,
      analytics: <ProjectAnalyticsPanel songs={songs} onClose={handleClosePanel} />,
    };

    return (
      <Dialog 
        open={true} 
        onClose={handleClosePanel}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: { 
            width: '95%', 
            height: '90%',
            maxWidth: 'none',
          }
        }}
      >
        {panels[activePanel]}
      </Dialog>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" sx={{ p: 2 }}>
          {selectedTrip ? tripName : 'Select a Trip'}
        </Typography>

        <Paper sx={{ p: 2 }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MusicNoteIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Songs</Typography>
          </Box>
          <List>
            {songs.map((song) => (
              <ListItem 
                key={song.id} 
                divider 
                secondaryAction={
                  <IconButton edge="end" aria-label="play" onClick={() => console.log('Play song')}>
                    <PlayArrowIcon />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleSongClick(song)}>
                  <ListItemText
                    primary={song.title}
                    secondary={`${song.artist} • ${song.duration}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {songs.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No songs yet"
                  secondary="Drop audio files above to add songs to your trip"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>

      {/* Right Panel */}
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Project Actions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Project Actions</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<PublishIcon />}
              variant="outlined"
              fullWidth
              onClick={() => setActivePanel('export')}
            >
              Export Settings
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              fullWidth
              onClick={() => setActivePanel('metadata')}
            >
              Edit Metadata
            </Button>
            <Button
              startIcon={<GroupAddIcon />}
              variant="outlined"
              fullWidth
              onClick={() => setActivePanel('collaborators')}
            >
              Collaborators
            </Button>
            <Button
              startIcon={<BarChartIcon />}
              variant="outlined"
              fullWidth
              onClick={() => setActivePanel('analytics')}
            >
              Project Analytics
            </Button>
          </Box>
        </Paper>

        {/* Publishing Options */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Publishing</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<CloudUploadIcon />}
              variant="outlined"
              color="success"
              fullWidth
              onClick={() => console.log('Spotify settings')}
            >
              Spotify
            </Button>
            <Button
              startIcon={<CloudUploadIcon />}
              variant="outlined"
              color="warning"
              fullWidth
              onClick={() => console.log('SoundCloud settings')}
            >
              SoundCloud
            </Button>
          </Box>
        </Paper>

        {/* Project Settings */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<TagIcon />}
              variant="outlined"
              fullWidth
              onClick={() => console.log('Manage tags')}
            >
              Tags & Categories
            </Button>
            <Button
              startIcon={<SettingsIcon />}
              variant="outlined"
              fullWidth
              onClick={() => console.log('Project settings')}
            >
              Project Settings
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Feature Panels */}
      {renderActivePanel()}
    </Box>
  );
};

export default MainContent; 