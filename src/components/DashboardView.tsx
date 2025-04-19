import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  ListItemIcon,
  ListItemButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createTrip, createPlaylist, getAnalytics, createSong, deleteTrip } from '../services/firebaseService';
import { Trip } from '../types/trip';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AlbumIcon from '@mui/icons-material/Album';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useDropzone } from 'react-dropzone';
import { uploadMusicFile } from '../services/storageService';
import { Song } from '../types/song';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import PersonIcon from '@mui/icons-material/Person';
import EmptyProjectPanel from './panels/EmptyProjectPanel';

interface DashboardViewProps {
  onSelectTrip: (tripId: string) => void;
}

interface AnalyticsData {
  totalProjects: number;
  totalSongs: number;
  totalPlaylists: number;
  totalCollaborators: number;
  projectsByMonth: { [key: string]: number };
  songsByGenre: { [key: string]: number };
  topCollaborators: { userId: string; count: number }[];
}

// Add type declarations for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTrip }) => {
  const { trips, sharedTrips, loading, error: tripsError, addTrip, removeTrip } = useTrips();
  const [localFiles, setLocalFiles] = useState<Song[]>([]);
  const [localProjectId, setLocalProjectId] = useState<string>('local-songs-project');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState<'private' | 'public' | 'unlisted'>('private');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, artistProfile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [scanningFiles, setScanningFiles] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderPath, setFolderPath] = useState('');
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleTripClick = (tripId: string) => {
    setSelectedTripId(tripId);
    onSelectTrip(tripId);
    navigate(`/trip/${tripId}`);
  };

  const handleCreateProject = async (song: any) => {
    if (!currentUser) return;
    
    try {
      const newTrip = await createTrip({
        name: song.title,
        description: song.metadata?.lyrics || '',
        userId: currentUser.uid,
        songs: [song],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: song.metadata?.tags || [],
        status: 'draft',
        type: 'project'
      });
      
      // Add the trip to the context
      addTrip(newTrip);
      
      setOpenDialog(false);
      
      // Navigate to the new project
      navigate(`/trip/${newTrip.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const handleUploadClick = () => {
    setShowUploadDialog(true);
  };

  const handlePlaylistClick = () => {
    setShowPlaylistDialog(true);
  };

  const handleAnalyticsClick = async () => {
    setShowAnalyticsDialog(true);
    try {
      const data = await getAnalytics(currentUser?.uid || '');
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!currentUser) {
      setError('You must be logged in to upload songs');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create a new project for the uploads
      const newTrip = await createTrip({
        name: 'Uploaded Songs',
        description: 'Songs uploaded from dashboard',
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: ['uploaded'],
        status: 'draft',
        type: 'project'
      });

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
            const filePath = await uploadMusicFile(file, newTrip.id);
            
            // Create a new song entry
            const newSong: Omit<Song, 'id'> = {
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              artist: currentUser.email?.split('@')[0] || 'Unknown Artist',
              duration: '0:00', // Default duration, would need audio processing to get actual duration
              filePath,
              userId: currentUser.uid,
              metadata: {
                tags: ['uploaded'],
                genre: [],
              }
            };
            
            // Save the song to Firestore
            await createSong(newTrip.id, newSong);
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
      
      // Add the trip to the context
      addTrip(newTrip);
      
      // Select the newly created trip
      onSelectTrip(newTrip.id);
      navigate(`/trip/${newTrip.id}`);
      
      // Close the dialog
      setShowUploadDialog(false);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(`Failed to upload files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      'application/*': ['.flp']
    },
    onDrop
  });

  const handleCreatePlaylist = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a playlist');
      return;
    }
    
    if (!playlistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      const newPlaylist = await createPlaylist({
        name: playlistName,
        description: playlistDescription,
        userId: currentUser.uid,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visibility: playlistVisibility,
        collaborators: [],
        tags: [],
        status: 'draft',
        type: 'playlist'
      });
      
      // Add the playlist to the context
      addTrip(newPlaylist);
      
      // Select the newly created playlist
      onSelectTrip(newPlaylist.id);
      navigate(`/trip/${newPlaylist.id}`);
      
      // Reset form and close dialog
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistVisibility('private');
      setShowPlaylistDialog(false);
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setPlaylistVisibility(event.target.value as 'private' | 'public' | 'unlisted');
  };

  // Calculate statistics
  const totalProjects = trips.length + (localFiles.length > 0 ? 1 : 0);
  const totalSongs = trips.reduce((acc, trip) => acc + (trip.songs?.length || 0), 0) + localFiles.length;
  const recentProjects = [...trips].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const handleDeleteTrip = async (trip: Trip) => {
    setTripToDelete(trip);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    
    setDeletingTripId(tripToDelete.id);
    setError(null);
    
    try {
      // Check if user has permission to delete (owner or collaborator)
      const isOwner = tripToDelete.userId === currentUser?.uid;
      const isCollaborator = tripToDelete.collaborators?.includes(currentUser?.uid || '');
      
      if (!isOwner && !isCollaborator) {
        throw new Error('You do not have permission to delete this project');
      }
      
      // Delete from Firebase
      try {
        await deleteTrip(tripToDelete.id);
      } catch (deleteError) {
        console.error('Error deleting trip:', deleteError);
        // Even if there's an error, we'll still update the UI
        // The error might be due to permissions, but the deletion might have succeeded
      }
      
      // Remove from context regardless of whether the Firebase deletion succeeded
      removeTrip(tripToDelete.id);
      
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error in delete process:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project. Please try again.');
    } finally {
      setDeletingTripId(null);
      setTripToDelete(null);
    }
  };

  const cancelDeleteTrip = () => {
    setDeleteConfirmOpen(false);
    setTripToDelete(null);
  };

  const handleLocalFileCardClick = () => {
    // Navigate to the local songs project
    onSelectTrip(localProjectId);
  };

  const handlePathSubmit = async () => {
    if (!folderPath.trim()) {
      setError('Please enter a valid folder path');
      return;
    }

    setScanningFiles(true);
    setScanProgress(0);
    setScannedFiles([]);

    try {
      // Here you would typically make an API call to your backend
      // to scan the folder at the given path
      // For now, we'll simulate the scanning process
      const audioFiles: File[] = [];
      const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
      
      // Create a new trip with the scanned files
      const newTrip: Trip = {
        id: `local-${Date.now()}`,
        name: folderPath.split('/').pop() || 'Local Songs',
        description: `Local songs from ${folderPath}`,
        songs: audioFiles.map(file => ({
          id: `song-${Date.now()}-${Math.random()}`,
          title: file.name.replace(/\.(mp3|wav|flac|aac|ogg|m4a)$/i, ''),
          artist: 'Local',
          duration: '0:00',
          filePath: URL.createObjectURL(file),
          userId: currentUser?.uid || '',
          metadata: {
            tags: ['local'],
            genre: [],
            localFile: true,
            originalFileName: file.name,
            fileSize: file.size,
            lastModified: file.lastModified
          }
        })),
        userId: currentUser?.uid || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: ['local'],
        status: 'draft',
        type: 'project'
      };

      setLocalFiles(prev => [...prev, ...newTrip.songs]);
      setShowPathDialog(false);
      setFolderPath('');
    } catch (error: any) {
      console.error('Error processing folder:', error);
      setError('Failed to process folder. Please try again.');
    } finally {
      setScanningFiles(false);
    }
  };

  const handleLocalSongClick = (song: Song) => {
    // Navigate to the song details page
    navigate(`/song/${song.id}?source=local`);
  };

  const handleFolderSelect = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker();
        const audioFiles: File[] = [];
        
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && entry instanceof FileSystemFileHandle) {
            const file = await entry.getFile();
            if (file.type.startsWith('audio/')) {
              audioFiles.push(file);
            }
          }
        }
        
        if (audioFiles.length > 0) {
          createLocalTrip(audioFiles);
        }
      } else {
        // Fallback to regular file input
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('webkitdirectory', '');
          fileInputRef.current.setAttribute('directory', '');
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setError('Failed to select folder. Please try again.');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.mp3') || 
      file.name.toLowerCase().endsWith('.wav') || 
      file.name.toLowerCase().endsWith('.flac') || 
      file.name.toLowerCase().endsWith('.aac') || 
      file.name.toLowerCase().endsWith('.ogg') || 
      file.name.toLowerCase().endsWith('.m4a')
    );

    if (audioFiles.length > 0) {
      const folderName = files[0].webkitRelativePath.split('/')[0];
      createLocalTrip(audioFiles);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createLocalTrip = async (files: File[]) => {
    try {
      const songs = files.map(file => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        duration: '0:00',
        filePath: URL.createObjectURL(file),
        userId: 'local',
        metadata: {
          source: 'local' as const,
          originalFileName: file.name,
          fileSize: file.size,
          lastModified: file.lastModified,
          tags: [],
          genre: []
        }
      } as Song));

      const newLocalFiles = [...localFiles, ...songs];
      setLocalFiles(newLocalFiles);
      localStorage.setItem('localFiles', JSON.stringify(newLocalFiles));
      setShowFolderDialog(false);
    } catch (error) {
      console.error('Error creating local trip:', error);
      setError('Failed to create local trip');
    }
  };

  // Add useEffect to load local files from localStorage on component mount
  useEffect(() => {
    const savedLocalFiles = localStorage.getItem('localFiles');
    if (savedLocalFiles) {
      setLocalFiles(JSON.parse(savedLocalFiles));
    }
    
    // Create a local project ID if it doesn't exist
    const savedLocalProjectId = localStorage.getItem('localProjectId');
    if (savedLocalProjectId) {
      setLocalProjectId(savedLocalProjectId);
    } else {
      const newLocalProjectId = 'local-songs-project';
      setLocalProjectId(newLocalProjectId);
      localStorage.setItem('localProjectId', newLocalProjectId);
    }
  }, []);

  // Update the cleanup function to handle file URLs
  useEffect(() => {
    return () => {
      // Revoke object URLs when component unmounts
      localFiles.forEach(song => {
        if (song.filePath && song.filePath.startsWith('blob:')) {
          URL.revokeObjectURL(song.filePath);
        }
      });
    };
  }, [localFiles]);

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Load local files from localStorage on mount
    const savedLocalFiles = localStorage.getItem('localFiles');
    if (savedLocalFiles) {
      setLocalFiles(JSON.parse(savedLocalFiles));
    }
  }, []);

  const handleDeleteLocalFile = (songId: string) => {
    const updatedFiles = localFiles.filter(song => song.id !== songId);
    setLocalFiles(updatedFiles);
    localStorage.setItem('localFiles', JSON.stringify(updatedFiles));
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Add file input for fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        multiple
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome back, {artistProfile?.name || currentUser?.email?.split('@')[0] || 'Artist'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your music projects, collaborate with others, and publish your work.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <FolderIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {totalProjects}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.secondary.main, 0.2),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <MusicNoteIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="secondary.main">
              {totalSongs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Songs
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.2),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {trips.filter(trip => trip.songs && trip.songs.length > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.2),
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <GroupAddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {trips.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Collaborators
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
                '&:hover': {
                  boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
                }
              }}
            >
              Create Project
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                borderColor: 'secondary.main',
                color: 'secondary.main',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  bgcolor: 'rgba(124, 77, 255, 0.05)',
                }
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Song'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PlaylistAddIcon />}
              onClick={handlePlaylistClick}
              disabled={creating}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: 'rgba(102, 187, 106, 0.05)',
                }
              }}
            >
              {creating ? 'Creating...' : 'Create Playlist'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<AlbumIcon />}
              onClick={() => navigate('/albums/create')}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  borderColor: 'warning.dark',
                  bgcolor: 'rgba(255, 167, 38, 0.05)',
                }
              }}
            >
              Customize Album
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={handleAnalyticsClick}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                borderColor: 'info.main',
                color: 'info.main',
                '&:hover': {
                  borderColor: 'info.dark',
                  bgcolor: 'rgba(41, 182, 246, 0.05)',
                }
              }}
            >
              View Analytics
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Projects */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Your Projects
        </Typography>
        <Button
          variant="text"
          color="primary"
          endIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create New'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : trips.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
            mb: 4
          }}
        >
          <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to get started with music management.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={creating}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
              }
            }}
          >
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} key={trip.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
                    borderColor: 'primary.main',
                  },
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <Box 
                  onClick={() => handleTripClick(trip.id)}
                  sx={{ height: '100%' }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      bgcolor: 'background.default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlbumIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {trip.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                      {trip.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MusicNoteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {trip.songs?.length || 0} songs
                      </Typography>
                    </Box>
                  </CardContent>
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip);
                  }}
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
                  <DeleteIcon />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Local Files Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Local Files
        </Typography>
        <Button
          variant="text"
          color="primary"
          endIcon={<AddIcon />}
          onClick={handleFolderSelect}
        >
          Add Local Files
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              }
            }}
            onClick={handleLocalFileCardClick}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Local Songs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {localFiles.length} songs
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFolderSelect();
                }}
              >
                Add Local Files
              </Button>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              {localFiles.length > 0 ? (
                <Grid container spacing={2}>
                  {localFiles.slice(0, 4).map((song) => (
                    <Grid item xs={12} sm={6} md={3} key={song.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[4],
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocalSongClick(song);
                        }}
                      >
                        <Box
                          sx={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          <MusicNoteIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap>
                            {song.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {song.artist}
                          </Typography>
                          {song.metadata?.tags && song.metadata.tags.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={song.metadata.tags[0]}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {localFiles.length > 4 && (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          + {localFiles.length - 4} more songs
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No local files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click 'Add Local Files' to import songs from your computer
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Shared Projects Section */}
      {sharedTrips.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
            <Typography variant="h5" fontWeight="bold">
              Shared with You
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {sharedTrips.map((trip) => (
              <Grid item xs={12} sm={6} md={4} key={trip.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
                      borderColor: 'secondary.main',
                    },
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Box 
                    onClick={() => handleTripClick(trip.id)}
                    sx={{ height: '100%' }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        bgcolor: 'background.default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AlbumIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
                    </CardMedia>
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {trip.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                        {trip.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          size="small"
                          label={trip.type === 'project' ? 'Project' : 'Playlist'}
                          color={trip.type === 'project' ? 'primary' : 'secondary'}
                        />
                        <Chip
                          size="small"
                          label="Shared"
                          color="info"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Updated {new Date(trip.updatedAt || trip.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog 
        open={showUploadDialog} 
        onClose={() => !uploading && setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Songs</DialogTitle>
        <DialogContent>
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
              mb: 2
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
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress.toFixed(0)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)} disabled={uploading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playlist Dialog */}
      <Dialog 
        open={showPlaylistDialog} 
        onClose={() => !creating && setShowPlaylistDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Playlist Name"
            type="text"
            fullWidth
            variant="outlined"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select
              labelId="visibility-label"
              id="visibility"
              value={playlistVisibility}
              onChange={handleVisibilityChange}
              label="Visibility"
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="unlisted">Unlisted</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlaylistDialog(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreatePlaylist} variant="contained" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog 
        open={showAnalyticsDialog} 
        onClose={() => setShowAnalyticsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Global Analytics</DialogTitle>
        <DialogContent>
          {analyticsData ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {analyticsData.totalProjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.secondary.main, 0.2),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <MusicNoteIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      {analyticsData.totalSongs}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Songs
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.success.main, 0.2),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <PlaylistAddIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {analyticsData.totalPlaylists}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Playlists
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.2),
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <GroupAddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {analyticsData.totalCollaborators}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Collaborators
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Projects by Month
              </Typography>
              <Box sx={{ height: 200, mb: 4 }}>
                {/* Here you would add a chart component to visualize projects by month */}
                <Typography variant="body2" color="text.secondary">
                  Chart visualization would go here
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Songs by Genre
              </Typography>
              <Box sx={{ height: 200, mb: 4 }}>
                {/* Here you would add a chart component to visualize songs by genre */}
                <Typography variant="body2" color="text.secondary">
                  Chart visualization would go here
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Collaborators
              </Typography>
              <List>
                {analyticsData.topCollaborators.map((collaborator, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>{collaborator.userId.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={collaborator.userId} 
                      secondary={`${collaborator.count} projects`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalyticsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDeleteTrip}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete "{tripToDelete?.name}"? This action cannot be undone and will delete all songs associated with this project.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteTrip} disabled={deletingTripId !== null}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteTrip} 
            color="error" 
            variant="contained"
            disabled={deletingTripId !== null}
            startIcon={deletingTripId !== null ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletingTripId !== null ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Folder Path Dialog */}
      <Dialog
        open={showPathDialog}
        onClose={() => !scanningFiles && setShowPathDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Folder Path</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Enter the path to your music folder:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Path"
              type="text"
              fullWidth
              variant="outlined"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="e.g., C:\Music or /home/user/music"
              disabled={scanningFiles}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPathDialog(false)} 
            disabled={scanningFiles}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePathSubmit}
            variant="contained"
            disabled={scanningFiles || !folderPath.trim()}
          >
            {scanningFiles ? 'Scanning...' : 'Scan Folder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Project Dialog */}
      {openDialog && (
        <EmptyProjectPanel
          tripId="new"
          onClose={() => setOpenDialog(false)}
          onProjectCreated={handleCreateProject}
          isDialog={true}
          mode="project"
        />
      )}
    </Box>
  );
};

export default DashboardView; 