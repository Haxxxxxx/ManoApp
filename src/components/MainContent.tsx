import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper, IconButton, Button, Dialog, Avatar, Chip, Grid, Snackbar, Alert, CircularProgress, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs, createSong, updateSong, createTrip, deleteSong, updateTrip, getSong } from '../services/firebaseService';
import { getSharedDriveFiles, getNotionTemplate, uploadMusicFile, uploadCoverArt } from '../services/storageService';
import { Song } from '../types/song';
import { Trip } from '../types/trip';
import { useEffect, useState, useCallback, Suspense } from 'react';
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
import DashboardView from './DashboardView';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DynamicPanel from './panels/DynamicPanel';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { getPanelProps, panelRegistry } from './panels/panelRegistry';

// Import panels
import ExportSettingsPanel from './panels/ExportSettingsPanel';
import MetadataEditorPanel from './panels/MetadataEditorPanel';
import CollaboratorsPanel from './panels/CollaboratorsPanel';
import ProjectAnalyticsPanel from './panels/ProjectAnalyticsPanel';
import TagsAndCategoriesPanel from './panels/TagsAndCategoriesPanel';
import ProjectSettingsPanel from './panels/ProjectSettingsPanel';
import PublishingPanel from './panels/PublishingPanel';
import SongDetailsPanel from './panels/SongDetailsPanel';
import SongManagementPanel from './panels/SongManagementPanel';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import SettingsPanel from './panels/SettingsPanel';

type ActivePanel = 'export' | 'metadata' | 'collaborators' | 'analytics' | 'tags' | 'settings' | 'publish-spotify' | 'publish-soundcloud' | 'song-management' | 'create-project' | 'upload' | 'create-playlist' | null;

interface MainContentProps {
  selectedTrip?: string | null;
  onSelectTrip: (tripId: string) => void;
  initialPanel?: ActivePanel;
}

interface PanelRegistry {
  [key: string]: {
    component: React.ComponentType<any>;
    title: string;
    icon?: React.ReactNode;
    requiresTrip?: boolean;
    props?: Record<string, any>;
  };
}

const LoadingPanel: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

const MainContent = ({ selectedTrip, onSelectTrip, initialPanel }: MainContentProps) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [tripName, setTripName] = useState<string>('');
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(initialPanel || null);
  const { currentUser, artistProfile } = useAuth();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const theme = useTheme();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Default tags for different genres and moods
  const defaultTags = {
    genres: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Metal'],
    moods: ['Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Melancholic', 'Upbeat', 'Dark', 'Peaceful', 'Dramatic'],
    instruments: ['Piano', 'Guitar', 'Drums', 'Bass', 'Strings', 'Synth', 'Vocals', 'Saxophone', 'Trumpet', 'Violin'],
    production: ['Studio', 'Live', 'Demo', 'Remix', 'Cover', 'Original', 'Acoustic', 'Electronic', 'Experimental', 'Traditional']
  };

  const allDefaultTags = [
    ...defaultTags.genres,
    ...defaultTags.moods,
    ...defaultTags.instruments,
    ...defaultTags.production
  ];

  // Filter tags based on input
  useEffect(() => {
    if (newTag.trim()) {
      const filtered = allDefaultTags.filter(tag => 
        tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !selectedTags.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(allDefaultTags.filter(tag => !selectedTags.includes(tag)));
    }
  }, [newTag, selectedTags]);

  // Add effect to handle initialPanel changes
  useEffect(() => {
    if (initialPanel) {
      setActivePanel(initialPanel);
    }
  }, [initialPanel]);

  useEffect(() => {
    const fetchTripData = async () => {
      if (!selectedTrip) {
        setTripData(null);
        setTripName('');
        setSongs([]);
        setSelectedSong(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Check if this is a local songs project
        if (selectedTrip === 'local-songs-project') {
          // Get local files from localStorage
          const savedLocalFiles = localStorage.getItem('localFiles');
          if (savedLocalFiles) {
            const localFiles = JSON.parse(savedLocalFiles);
            
            // Create a project from all local files
            const localProject: Trip = {
              id: selectedTrip,
              name: 'Local Songs',
              description: 'Collection of local audio files',
              userId: 'local',
              songs: localFiles,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              collaborators: [],
              tags: ['local-files'],
              status: 'draft' as const,
              type: 'project'
            };
            
            setTripData(localProject);
            setTripName(localProject.name);
            setSongs(localFiles);
            
            // Check if we need to select a specific song
            const songMatch = window.location.pathname.match(/\/song\/([^\/]+)/);
            if (songMatch && songMatch[1]) {
              const songId = songMatch[1];
              const song = localFiles.find((s: Song) => s.id === songId);
              if (song) {
                setSelectedSong(song);
                // Ensure the song details panel is visible
                setActivePanel('song-management');
              }
            }
            
            setIsLoading(false);
            return;
          }
        }
        
        // Check if this is a local file project
        const searchParams = new URLSearchParams(window.location.search);
        const isLocalFile = searchParams.get('source') === 'local';
        
        if (isLocalFile) {
          // Get local project data from sessionStorage
          const currentLocalProject = sessionStorage.getItem('currentLocalProject');
          if (currentLocalProject) {
            const project = JSON.parse(currentLocalProject);
            if (project.id === selectedTrip) {
              setTripData(project);
              setTripName(project.name);
              setSongs(project.songs || []);

              // Check if we need to select a specific song
              const songMatch = window.location.pathname.match(/\/song\/([^\/]+)/);
              if (songMatch && songMatch[1]) {
                const songId = songMatch[1];
                const song = project.songs.find((s: Song) => s.id === songId);
                if (song) {
                  setSelectedSong(song);
                  // Ensure the song details panel is visible
                  setActivePanel('song-management');
                }
              }
              setIsLoading(false);
              return;
            }
          }

          // If we can't find the project in sessionStorage, try localStorage
          const savedLocalFiles = localStorage.getItem('localFiles');
          if (savedLocalFiles) {
            const localFiles = JSON.parse(savedLocalFiles);
            const song = localFiles.find((s: Song) => `local-${s.id}` === selectedTrip);
            if (song) {
              // Create a project from the local file
              const localProject: Trip = {
                id: selectedTrip,
                name: song.title,
                description: `Project created from local file: ${song.title}`,
                userId: 'local',
                songs: [song],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                collaborators: [],
                tags: ['local-file'],
                status: 'draft' as const,
                type: 'project'
              };
              setTripData(localProject);
              setTripName(localProject.name);
              setSongs([song]);
              setSelectedSong(song);
              // Store the project in sessionStorage for future access
              sessionStorage.setItem('currentLocalProject', JSON.stringify(localProject));
              setIsLoading(false);
              return;
            }
          }

          setError('Local project data not found');
          setTripData(null);
          setTripName('');
          setSongs([]);
          setSelectedSong(null);
          navigate('/');
          return;
        }

        // Handle regular Firebase trip
        const trip = await getTrip(selectedTrip);
        if (!trip) {
          throw new Error('Trip not found');
        }

        setTripData(trip);
        setTripName(trip.name);
        setSongs(trip.songs || []);

        // Check if we need to select a specific song
        const songMatch = window.location.pathname.match(/\/song\/([^\/]+)/);
        if (songMatch && songMatch[1]) {
          const songId = songMatch[1];
          const song = trip.songs?.find(s => s.id === songId);
          if (song) {
            setSelectedSong(song);
          }
        }
      } catch (error) {
        console.error('Error fetching trip data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load project data');
        setTripData(null);
        setTripName('');
        setSongs([]);
        setSelectedSong(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripData();
  }, [selectedTrip, navigate]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedTrip || !currentUser) {
      setError('Please select a trip first and make sure you are logged in');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Process each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileType = file.type;
        
        // Update progress
        setUploadProgress((i / acceptedFiles.length) * 100);
        
        try {
          // Check if it's an audio file
          if (fileType.startsWith('audio/') || fileType === 'application/octet-stream' || 
              file.name.toLowerCase().endsWith('.mp3') || 
              file.name.toLowerCase().endsWith('.wav') || 
              file.name.toLowerCase().endsWith('.flac') || 
              file.name.toLowerCase().endsWith('.aac') || 
              file.name.toLowerCase().endsWith('.ogg') || 
              file.name.toLowerCase().endsWith('.m4a')) {
            
            console.log(`Uploading audio file: ${file.name}, type: ${fileType}`);
            
            // Upload the audio file
            const filePath = await uploadMusicFile(file, selectedTrip);
            
            // Create a new song entry
            const newSong: Omit<Song, 'id'> = {
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              artist: artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
              duration: '0:00', // Default duration, would need audio processing to get actual duration
              filePath,
              userId: currentUser.uid,
              metadata: {
                tags: ['uploaded'],
                genre: [],
              }
            };
            
            // Save the song to Firestore
            const createdSong = await createSong(selectedTrip, newSong);
            setSongs(prev => [...prev, createdSong]);
          } 
          // Check if it's an image file
          else if (fileType.startsWith('image/') || 
                  file.name.toLowerCase().endsWith('.jpg') || 
                  file.name.toLowerCase().endsWith('.jpeg') || 
                  file.name.toLowerCase().endsWith('.png') || 
                  file.name.toLowerCase().endsWith('.gif')) {
            
            console.log(`Uploading image file: ${file.name}, type: ${fileType}`);
            
            // Upload the image file
            const imagePath = await uploadCoverArt(file, selectedTrip);
            
            // If we have songs, update the first one with the cover art
            if (songs.length > 0) {
              const firstSong = songs[0];
              await updateSong(firstSong.id, { imagePath });
              
              // Update the local state
              setSongs(prev => prev.map(song => 
                song.id === firstSong.id ? { ...song, imagePath } : song
              ));
            } else {
              // Create a placeholder song with the image
              const newSong: Omit<Song, 'id'> = {
                title: 'Cover Art',
                artist: artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
                duration: '0:00',
                filePath: imagePath,
                imagePath,
                userId: currentUser.uid,
                metadata: {
                  tags: ['cover-art'],
                  genre: [],
                  source: 'upload'
                }
              };
              
              // Save the song to Firestore
              const createdSong = await createSong(selectedTrip, newSong);
              setSongs(prev => [...prev, createdSong]);
            }
          } else {
            console.warn(`Unsupported file type: ${fileType} for file ${file.name}`);
            setError(`Unsupported file type: ${fileType} for file ${file.name}`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          setError(`Error processing file ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }
      
      // Complete upload
      setUploadProgress(100);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(`Failed to upload files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedTrip, currentUser, artistProfile, songs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/*': ['.flp']
    },
    onDrop
  });

  const handleSongClick = async (song: Song) => {
    try {
      // Check if this is a local file by looking at the metadata
      const isLocalFile = song.metadata?.source === 'local';
      
      if (isLocalFile) {
        // For local files, use the song data directly without fetching
        setSelectedSong(song);
        return;
      }

      // For Firebase songs, fetch the latest data
      const latestSong = await getSong(song.id);
      if (latestSong) {
        setSelectedSong(latestSong);
      }
    } catch (error) {
      console.error('Error fetching latest song data:', error);
      // Fallback to using the provided song data if we couldn't fetch the latest
      setSelectedSong(song);
    }
  };

  const handleSongUpdated = async (updatedSong: Song) => {
    // Update the song in the local songs array
    setSongs(prev => prev.map(song => 
      song.id === updatedSong.id ? updatedSong : song
    ));
    
    // Only update Firebase if it's not a local file
    if (selectedTrip && updatedSong.metadata?.source !== 'local') {
      try {
        // Fetch the latest trip data
        const refreshedTrip = await getTrip(selectedTrip);
        if (refreshedTrip) {
          // Update the song in the trip's songs array
          const updatedSongs = refreshedTrip.songs.map(song => 
            song.id === updatedSong.id ? updatedSong : song
          );
          
          // Update only the songs array and updatedAt timestamp
          await updateTrip(selectedTrip, {
            songs: updatedSongs,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating song in trip:', error);
      }
    }
  };

  const handleReplaceSong = async (song: Song, file: File) => {
    if (!selectedTrip || !currentUser) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Upload the new file
      const filePath = await uploadMusicFile(file, selectedTrip, song.id);
      
      // Update the song with the new file path
      await updateSong(song.id, {
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        artist: song.artist,
        metadata: {
          ...song.metadata,
          tags: ['uploaded']
        }
      });
      
      // Update local state
      setSongs(prev => prev.map(s => 
        s.id === song.id ? { ...s, filePath, title: file.name.replace(/\.[^/.]+$/, '') } : s
      ));
      
      setUploadProgress(100);
    } catch (error) {
      console.error('Error replacing song:', error);
      setError(`Failed to replace song: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  const handleCreateEmptyProject = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a project');
      return;
    }
    
    setIsCreatingProject(true);
    setError(null);
    
    try {
      const newTrip = await createTrip({
        name: 'New Project',
        description: '',
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: [],
        status: 'draft',
        type: 'project'
      });
      
      // Update local state
      setTripData(newTrip);
      setTripName(newTrip.name);
      setSongs([]);
      
      // Select the newly created trip
      onSelectTrip(newTrip.id);
      navigate(`/trip/${newTrip.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddSongClick = () => {
    // Only open the EmptyProjectPanel dialog, not the Create Song dialog
    setIsCreatingProject(true);
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      handleAddTag(newTag.trim());
      setNewTag('');
      setShowTagSuggestions(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    handleAddTag(tag);
    setNewTag('');
    setShowTagSuggestions(false);
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

  const handleDeleteSong = async (songId: string) => {
    if (!selectedTrip) return;
    
    // Find the song to delete
    const songToDelete = songs.find(song => song.id === songId);
    if (!songToDelete) return;
    
    // Open confirmation dialog
    setSongToDelete(songToDelete);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete from Firebase
      await deleteSong(songToDelete.id);
      
      // Update local state
      setSongs(prev => prev.filter(song => song.id !== songToDelete.id));
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song. Please try again.');
    } finally {
      setIsLoading(false);
      setDeleteConfirmOpen(false);
      setSongToDelete(null);
    }
  };

  const cancelDeleteSong = () => {
    setDeleteConfirmOpen(false);
    setSongToDelete(null);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleProjectCreated = (song: Song) => {
    setSongs(prev => [...prev, song]);
    setIsCreatingProject(false);
  };

  const renderActivePanel = () => {
    if (isCreatingProject) {
      return (
        <Suspense fallback={<LoadingPanel />}>
          <EmptyProjectPanel
            tripId="new"
            onClose={() => setIsCreatingProject(false)}
            onProjectCreated={handleProjectCreated}
            isDialog={true}
          />
        </Suspense>
      );
    }

    if (!activePanel) {
      return null;
    }

    return (
      <Suspense fallback={<LoadingPanel />}>
        <DynamicPanel
          panelType={activePanel}
          tripData={tripData}
          songs={songs}
          selectedTrip={selectedTrip}
          onClose={handleClosePanel}
        />
      </Suspense>
    );
  };

  // Add a drop zone for file uploads
  const renderDropZone = () => {
    return (
      <Box
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse
        </Typography>
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        p: 3, 
        overflow: 'auto',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {selectedTrip ? (
            <>
              <IconButton 
                onClick={() => navigate('/')}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight="bold">
                {tripName}
                </Typography>
            </>
          ) : (
            <Typography variant="h4" fontWeight="bold">
              Dashboard
            </Typography>
          )}
        </Box>
        
        {selectedTrip && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSongClick}
              sx={{ 
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'rgba(29, 185, 84, 0.05)',
                }
              }}
            >
              Add Song
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setActivePanel('publish-spotify')}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
                '&:hover': {
                  boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
                }
              }}
            >
              Publish
            </Button>
          </Box>
        )}
      </Box>

      {/* Content Section */}
      {selectedTrip ? (
        <>
          {/* Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FolderSharedIcon />}
              onClick={handleOpenSharedDrive}
              disabled={isLoadingDrive}
              sx={{ 
                borderRadius: 2,
                borderColor: 'info.main',
                color: 'info.main',
                '&:hover': {
                  borderColor: 'info.dark',
                  bgcolor: 'rgba(41, 182, 246, 0.05)',
                }
              }}
            >
              {isLoadingDrive ? 'Loading...' : 'Shared Drive'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleOpenNotionTemplate}
              disabled={isLoadingTemplate}
              sx={{ 
                borderRadius: 2,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  bgcolor: 'rgba(124, 77, 255, 0.05)',
                }
              }}
            >
              {isLoadingTemplate ? 'Loading...' : 'Notion Template'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setActivePanel('metadata')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  borderColor: 'warning.dark',
                  bgcolor: 'rgba(255, 167, 38, 0.05)',
                }
              }}
            >
              Edit Metadata
            </Button>
            <Button
              variant="outlined"
              startIcon={<GroupAddIcon />}
              onClick={() => setActivePanel('collaborators')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: 'rgba(102, 187, 106, 0.05)',
                }
              }}
            >
              Collaborators
            </Button>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => setActivePanel('analytics')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'error.main',
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  bgcolor: 'rgba(244, 67, 54, 0.05)',
                }
              }}
            >
              Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<TagIcon />}
              onClick={() => setActivePanel('tags')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'info.dark',
                color: 'info.dark',
                '&:hover': {
                  borderColor: 'info.main',
                  bgcolor: 'rgba(41, 182, 246, 0.05)',
                }
              }}
            >
              Tags
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleSettingsClick}
              sx={{ 
                borderRadius: 2,
                borderColor: 'text.secondary',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Settings
            </Button>
          </Box>

          {/* Songs List */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : songs.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '50vh',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <MusicNoteIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No songs yet
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, maxWidth: 500 }}>
                Add songs to your project by uploading files, importing from shared drive, or creating an empty project.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSongClick}
                  sx={{
                    borderRadius: 2,
                    boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
                    '&:hover': {
                      boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
                    }
                  }}
                >
                  Add Song
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FolderSharedIcon />}
                  onClick={handleOpenSharedDrive}
                  sx={{ borderRadius: 2 }}
                >
                  Import from Drive
                </Button>
              </Box>
              
              {/* Add drop zone for file uploads */}
              <Box sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
                {renderDropZone()}
              </Box>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {songs.map((song) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={song.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
                        borderColor: 'primary.main',
                      },
                      position: 'relative',
                    }}
                  >
                    {/* Delete Button */}
                    <IconButton
                      onClick={() => handleDeleteSong(song.id)}
                      disabled={isLoading && deletingSongId === song.id}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'white',
                        },
                        zIndex: 1,
                      }}
                    >
                      {isLoading && deletingSongId === song.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>

                    <Box 
                      sx={{ 
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 2,
                        aspectRatio: '1/1',
                        bgcolor: 'background.default',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSongClick(song)}
                    >
                      {song.imagePath ? (
                        <Box
                          component="img"
                          src={song.imagePath}
                          alt={song.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                          }}
                        >
                          <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        </Box>
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          p: 1,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconButton
                          size="small" 
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.3)',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.5)',
                            },
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {song.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {song.artist}
                    </Typography>
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {song.duration}
                      </Typography>
                      {song.metadata?.tags && song.metadata.tags.length > 0 && (
                        <Chip
                          label={song.metadata.tags[0]}
                          size="small"
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: 'primary.dark',
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <DashboardView onSelectTrip={onSelectTrip} />
      )}

      {/* Feature Panels */}
      {renderActivePanel()}

      {/* Song Details Panel */}
      {selectedSong && (
        <SongDetailsPanel
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onSongUpdated={handleSongUpdated}
        />
      )}

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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDeleteSong}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Song
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete "{songToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteSong} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteSong} 
            color="error" 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MainContent; 