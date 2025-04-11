import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper, IconButton, Button, Dialog, Avatar, Chip, Grid, Snackbar, Alert } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs, createSong } from '../services/firebaseService';
import { getSharedDriveFiles, getNotionTemplate } from '../services/storageService';
import { Song, Trip } from '../types';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TagIcon from '@mui/icons-material/Tag';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorageIcon from '@mui/icons-material/Storage';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import DescriptionIcon from '@mui/icons-material/Description';
import React from 'react';

// Import panels
import ExportSettingsPanel from './panels/ExportSettingsPanel';
import MetadataEditorPanel from './panels/MetadataEditorPanel';
import CollaboratorsPanel from './panels/CollaboratorsPanel';
import ProjectAnalyticsPanel from './panels/ProjectAnalyticsPanel';
import TagsAndCategoriesPanel from './panels/TagsAndCategoriesPanel';
import ProjectSettingsPanel from './panels/ProjectSettingsPanel';
import PublishingPanel from './panels/PublishingPanel';
import EmptyProjectPanel from './panels/EmptyProjectPanel';

type ActivePanel = 'export' | 'metadata' | 'collaborators' | 'analytics' | 'tags' | 'settings' | 'publish-spotify' | 'publish-soundcloud' | null;

interface MainContentProps {
  selectedTrip: string | null;
}

const MainContent = ({ selectedTrip }: MainContentProps) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [tripName, setTripName] = useState<string>('');
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const { currentUser, artistProfile } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showEmptyProjectPanel, setShowEmptyProjectPanel] = useState(false);

  useEffect(() => {
    const fetchTripData = async () => {
      if (selectedTrip) {
        const trip = await getTrip(selectedTrip);
        if (trip) {
          setTripData(trip);
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

  const handleCreateEmptyProject = () => {
    if (!selectedTrip) {
      setError('Please select a trip first');
      return;
    }
    setIsCreatingProject(true);
  };

  const handleProjectCreated = (newSong: Song) => {
    setSongs(prev => [...prev, newSong]);
    setIsCreatingProject(false);
  };

  const handleOpenSharedDrive = async () => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      await getSharedDriveFiles();
      // Open shared drive in a new window
      window.open('/shared-drive', '_blank');
    } catch (error) {
      console.error('Error accessing shared drive:', error);
      setDriveError('Failed to access shared drive. Please try again.');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleOpenNotionTemplate = async () => {
    setIsLoadingTemplate(true);
    setTemplateError(null);
    try {
      const templateUrl = await getNotionTemplate('trip-template');
      // Open Notion template in a new window
      window.open(templateUrl, '_blank');
    } catch (error) {
      console.error('Error accessing Notion template:', error);
      setTemplateError('Failed to access Notion template. Please try again.');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const renderActivePanel = () => {
    if (!activePanel) {
      if (isCreatingProject && selectedTrip) {
        return (
          <Dialog
            open={true}
            onClose={() => setIsCreatingProject(false)}
            maxWidth="md"
            fullWidth
          >
            <Suspense fallback={<CircularProgress />}>
              <EmptyProjectPanel
                tripId={selectedTrip}
                onClose={() => setIsCreatingProject(false)}
                onProjectCreated={handleProjectCreated}
              />
            </Suspense>
          </Dialog>
        );
      }
      return null;
    }

    // For panels that require tripData, ensure it exists
    if (activePanel !== 'export' && !tripData) return null;

    const panels = {
      'export': <ExportSettingsPanel onClose={handleClosePanel} />,
      'metadata': <MetadataEditorPanel songs={songs} onClose={handleClosePanel} />,
      'collaborators': <CollaboratorsPanel tripId={selectedTrip || ''} onClose={handleClosePanel} />,
      'analytics': <ProjectAnalyticsPanel songs={songs} onClose={handleClosePanel} />,
      'tags': <TagsAndCategoriesPanel songs={songs} onClose={handleClosePanel} />,
      'settings': tripData && <ProjectSettingsPanel trip={tripData} onClose={handleClosePanel} />,
      'publish-spotify': tripData && <PublishingPanel trip={tripData} songs={songs} platform="spotify" onClose={handleClosePanel} />,
      'publish-soundcloud': tripData && <PublishingPanel trip={tripData} songs={songs} platform="soundcloud" onClose={handleClosePanel} />,
    } as const;

    const PanelComponent = panels[activePanel];
    if (!PanelComponent) return null;

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
            m: 2
          }
        }}
      >
        {PanelComponent}
      </Dialog>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Top Bar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={3}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ width: 50, height: 50 }}
                src={currentUser?.photoURL || undefined}
              >
                {artistProfile?.displayName?.[0] || currentUser?.email?.[0]}
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="h6" noWrap>
                  {artistProfile?.displayName || currentUser?.email?.split('@')[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {currentUser?.email}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Typography variant="h5">{tripName || 'Select a Trip'}</Typography>
          </Grid>
          <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FolderSharedIcon />}
              onClick={handleOpenSharedDrive}
              disabled={isLoadingDrive}
            >
              {isLoadingDrive ? 'Loading...' : 'Shared Drive'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleOpenNotionTemplate}
              disabled={isLoadingTemplate}
            >
              {isLoadingTemplate ? 'Loading...' : 'Notion Template'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Project Info */}
        <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', borderRight: 1, borderColor: 'divider' }}>
          {selectedTrip && tripData ? (
            <>
              {/* Project Overview */}
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FolderIcon color="primary" />
                  <Typography variant="h6">{tripName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AudiotrackIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Songs</Typography>
                      <Typography variant="h6">{songs.length}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Duration</Typography>
                      <Typography variant="h6">
                        {Math.floor(songs.reduce((acc, song) => acc + (parseInt(song.duration) || 0), 0) / 60)}m
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography variant="h6">
                        {new Date(tripData.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>

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
            </>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {selectedTrip ? 'Create a new project' : 'Select a project or create a new one to get started'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateEmptyProject}
                disabled={isCreating || !selectedTrip}
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </Paper>
          )}
        </Box>

        {/* Center Content */}
        <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedTrip && (
            <>
              {/* Drop Zone */}
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

              {/* Songs List */}
              <Paper sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MusicNoteIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Songs</Typography>
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={handleCreateEmptyProject}
                    disabled={isCreating || !selectedTrip}
                  >
                    {isCreating ? 'Creating...' : 'New Project'}
                  </Button>
                </Box>
                <List sx={{ overflow: 'auto' }}>
                  {songs.map((song) => (
                    <ListItem 
                      key={song.id} 
                      divider 
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {song.metadata?.tags?.includes('project') && (
                            <Chip 
                              label="Project" 
                              color="primary" 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                          )}
                          <IconButton edge="end" aria-label="play">
                            <PlayArrowIcon />
                          </IconButton>
                        </Box>
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
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Drop audio files above to add songs to your trip
                            </Typography>
                            <Button
                              startIcon={<AddIcon />}
                              variant="outlined"
                              size="small"
                              onClick={handleCreateEmptyProject}
                              disabled={isCreating || !selectedTrip}
                              sx={{ alignSelf: 'flex-start' }}
                            >
                              Or create an empty project
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </>
          )}
        </Box>

        {/* Right Sidebar */}
        <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: 1, borderColor: 'divider' }}>
          {selectedTrip && tripData && (
            <>
              {/* Publishing Options */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Publishing</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    startIcon={<CloudUploadIcon />}
                    variant="outlined"
                    color="success"
                    fullWidth
                    onClick={() => setActivePanel('publish-spotify')}
                  >
                    Spotify
                  </Button>
                  <Button
                    startIcon={<CloudUploadIcon />}
                    variant="outlined"
                    color="warning"
                    fullWidth
                    onClick={() => setActivePanel('publish-soundcloud')}
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
                    onClick={() => setActivePanel('tags')}
                  >
                    Tags & Categories
                  </Button>
                  <Button
                    startIcon={<SettingsIcon />}
                    variant="outlined"
                    fullWidth
                    onClick={() => setActivePanel('settings')}
                  >
                    Project Settings
                  </Button>
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Box>

      {/* Feature Panels */}
      {renderActivePanel()}

      {/* Error Snackbars */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!driveError} 
        autoHideDuration={6000} 
        onClose={() => setDriveError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setDriveError(null)} severity="error">
          {driveError}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!templateError} 
        autoHideDuration={6000} 
        onClose={() => setTemplateError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setTemplateError(null)} severity="error">
          {templateError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainContent; 