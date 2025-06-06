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
  Tooltip,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createTrip, createPlaylist, getAnalytics, createSong, deleteTrip } from '../services/firebaseService';
import type { Trip, TripStatus } from '../types/trip';
import { useAuth } from '../hooks';
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
import type { Song } from '../types/song';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import PersonIcon from '@mui/icons-material/Person';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import StatisticsCards from './dashboard/StatisticsCards';
import QuickActions from './dashboard/QuickActions';
import ProjectsSection from './dashboard/ProjectsSection';
import DashboardDialogs from './dashboard/DashboardDialogs';
import LocalFilesSection from './dashboard/LocalFilesSection';

interface AnalyticsData {
  totalSongs: number;
  totalProjects: number;
  recentActivity: any[];
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

interface StatisticsCardsProps {
  totalProjects: number;
  totalSongs: number;
  activeProjects: number;
  totalCollaborators: number;
}

interface QuickActionsProps {
  onUploadClick: () => void;
  onPlaylistClick: () => void;
  onAnalyticsClick: () => void;
  uploading: boolean;
  creating: boolean;
  onCreateProject: () => void;
}

interface ProjectCardProps {
  trip: Trip;
  onTripClick: (tripId: string) => void;
  onDeleteTrip: (trip: Trip) => void;
}

interface ProjectsSectionProps {
  title: string;
  trips: Trip[];
  loading: boolean;
  onTripClick: (tripId: string) => void;
  onDeleteTrip: (trip: Trip) => void;
  onCreateNew: () => void;
}

const DashboardView: React.FC = () => {
  const theme = useTheme();
  const { trips, sharedTrips, loading, error: tripsError, addTrip, removeTrip, refreshTrips } = useTrips();
  const [localFiles, setLocalFiles] = useState<Song[]>([]);
  const [localProjectId] = useState<string>('local-songs-project');
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [scanningFiles, setScanningFiles] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderPath, setFolderPath] = useState('');
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Calculate statistics
  const totalProjects = trips.length + (sharedTrips?.length || 0);
  const totalSongs = trips.reduce((acc, trip) => acc + (trip.songs?.length || 0), 0) +
    (sharedTrips?.reduce((acc, trip) => acc + (trip.songs?.length || 0), 0) || 0);
  const activeProjects = trips.filter(trip => trip.status === 'active' as TripStatus).length +
    (sharedTrips?.filter(trip => trip.status === 'active' as TripStatus).length || 0);
  const totalCollaborators = trips.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0) +
    (sharedTrips?.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0) || 0);

  const handleTripClick = (trip: Trip) => {
    setSelectedTripId(trip.id);
    navigate(`/trip/${trip.id}`);
  };

  const handleCreateProject = async (project: Omit<Trip, 'id'>) => {
    if (!user) return;
    
    try {
      setCreating(true);
      const newTrip = await createTrip({
        name: project.name,
        description: project.description || '',
        userId: user.uid,
        songs: project.songs || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: project.tags || [],
        status: 'draft',
        type: 'project',
        isPrivate: true
      });
      
      setOpenDialog(false);
      
      // Navigate to the new project
      navigate(`/trip/${newTrip.id}`);
    } catch (error) {
      console.error('Error handling project creation:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setCreating(false);
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
      const data = await getAnalytics(user?.uid || '');
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
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
        userId: user.uid,
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
              artist: user.email?.split('@')[0] || 'Unknown Artist',
              duration: '0:00', // Default duration, would need audio processing to get actual duration
              filePath,
              userId: user.uid,
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

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      'application/*': ['.flp']
    },
    onDrop
  });

  // Use the dropzone props in the upload dialog
  const uploadDialogProps = {
    ...getRootProps(),
    ...getInputProps()
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
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
        userId: user.uid,
        songs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPrivate: playlistVisibility === 'private',
        collaborators: [],
        tags: [],
        status: 'draft',
        type: 'playlist'
      });
      
      // Add the playlist to the context
      addTrip(newPlaylist);
      
      // Select the newly created playlist
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

  const handleDeleteTrip = (trip: Trip) => {
    setTripToDelete(trip);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete || !user) return;
    
    setDeletingTripId(tripToDelete.id);
    setError(null);
    
    try {
      // Check if user has permission to delete (owner or collaborator)
      const isOwner = tripToDelete.userId === user.uid;
      const isCollaborator = tripToDelete.collaborators?.includes(user.uid);
      
      if (!isOwner && !isCollaborator) {
        throw new Error('You do not have permission to delete this project');
      }
      
      // Delete from Firebase
        await deleteTrip(tripToDelete.id);
      
      // Remove from context
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
    navigate(`/trip/${localProjectId}`);
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
          userId: user?.uid || '',
          metadata: {
            tags: ['local'],
            genre: [],
            localFile: true,
            originalFileName: file.name,
            _fileSize: file.size,
            lastModified: file.lastModified
          }
        })),
        userId: user?.uid || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: ['local'],
        status: 'draft',
        type: 'project'
      };

      const songs = newTrip.songs || [];
      setLocalFiles(prev => [...prev, ...songs]);
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
      localStorage.setItem('localProjectId', savedLocalProjectId);
    } else {
      const newLocalProjectId = 'local-songs-project';
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

  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        // Implement analytics data fetching
        setAnalyticsData({
          totalSongs,
          totalProjects,
          recentActivity: [],
          totalPlaylists: 0,
          totalCollaborators,
          projectsByMonth: {},
          songsByGenre: {},
          topCollaborators: []
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    if (showAnalyticsDialog) {
      fetchAnalytics();
    }
  }, [showAnalyticsDialog, totalSongs, totalProjects, totalCollaborators]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
        </Typography>

      <StatisticsCards
        totalProjects={totalProjects}
        totalSongs={totalSongs}
        activeProjects={activeProjects}
        totalCollaborators={totalCollaborators}
      />

      <QuickActions
        onUploadClick={handleUploadClick}
        onPlaylistClick={handlePlaylistClick}
        onAnalyticsClick={handleAnalyticsClick}
        uploading={uploading}
        creating={creating}
        onCreateProject={() => setOpenDialog(true)}
      />

      <Box sx={{ mt: 4 }}>
        <ProjectsSection
          title="My Projects"
          trips={trips}
          loading={loading}
          onTripClick={(trip: Trip) => handleTripClick(trip)}
          onDeleteTrip={handleDeleteTrip}
          onCreateNew={() => setOpenDialog(true)}
        />
              </Box>

      {sharedTrips && sharedTrips.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <ProjectsSection
            title="Shared Projects"
            trips={sharedTrips}
            loading={loading}
            onTripClick={(trip: Trip) => handleTripClick(trip)}
            onDeleteTrip={handleDeleteTrip}
            onCreateNew={() => setOpenDialog(true)}
          />
            </Box>
          )}

      <LocalFilesSection
        localFiles={localFiles}
        loading={loading}
        onFolderSelect={handleFolderSelect}
        onSongClick={handleLocalSongClick}
        onDeleteSong={handleDeleteLocalFile}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        multiple
        accept="audio/*"
      />

      <DashboardDialogs
        {...uploadDialogProps}
        showUploadDialog={showUploadDialog}
        setShowUploadDialog={setShowUploadDialog}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onDrop={onDrop}
        showPlaylistDialog={showPlaylistDialog}
        setShowPlaylistDialog={setShowPlaylistDialog}
        creating={creating}
        playlistName={playlistName}
        setPlaylistName={setPlaylistName}
        playlistDescription={playlistDescription}
        setPlaylistDescription={setPlaylistDescription}
        playlistVisibility={playlistVisibility}
        handleVisibilityChange={handleVisibilityChange}
        handleCreatePlaylist={handleCreatePlaylist}
        showAnalyticsDialog={showAnalyticsDialog}
        setShowAnalyticsDialog={setShowAnalyticsDialog}
        analyticsData={analyticsData}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        tripToDelete={tripToDelete}
        deletingTripId={deletingTripId}
        confirmDeleteTrip={confirmDeleteTrip}
        cancelDeleteTrip={cancelDeleteTrip}
        showPathDialog={showPathDialog}
        setShowPathDialog={setShowPathDialog}
        scanningFiles={scanningFiles}
        folderPath={folderPath}
        setFolderPath={setFolderPath}
        handlePathSubmit={handlePathSubmit}
      />
    </Container>
  );
};

export default DashboardView; 