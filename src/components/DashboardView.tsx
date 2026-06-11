import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  SelectChangeEvent,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createTrip, createPlaylist, getAnalytics, createSong, deleteTrip, getSongCount } from '../services/firebaseService';
import type { Trip, TripStatus } from '../types/trip';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import { useToast } from '../hooks/useToast';
import { createDevPlaceholderProject } from '../utils/devPlaceholder';
import { uploadMusicFile } from '../services/storageService';
import { removeFileExtension } from '../utils/formatters';
import { STORAGE_KEYS, storageHelpers, getErrorMessage } from '../utils/storageHelpers';
import { SPECIAL_PROJECT_IDS } from '../utils/constants';
import type { Song } from '../types/song';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import StatisticsCards from './dashboard/StatisticsCards';
import QuickActions from './dashboard/QuickActions';
import ProjectsSection from './dashboard/ProjectsSection';
import DashboardDialogs from './dashboard/DashboardDialogs';
import LocalFilesSection from './dashboard/LocalFilesSection';
import ActivityFeed from './dashboard/ActivityFeed';
import BulkActionsBar from './dashboard/BulkActionsBar';
import QuickActionsMenu from './common/QuickActionsMenu';
import type { QuickAction } from './common/QuickActionsMenu';
import { isFeatureEnabled } from '../config/features';
import { useContextMenu } from '../hooks/useContextMenu';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { updateTrip as updateTripService } from '../services/firebaseService';
import EditIcon_ctx from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import CloudDownloadIcon_ctx from '@mui/icons-material/CloudDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
// Shared with DashboardDialogs — duplicate local declarations caused
// "two different types with this name" assignability errors
import type { DashboardAnalyticsData as AnalyticsData } from '../types/analytics';

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

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
}

const DashboardView: React.FC = () => {
  const theme = useTheme();
  const { trips, sharedTrips, loading, addTrip, removeTrip, refreshTrips } = useTrips();

  // Context menu for projects
  const { contextMenuPosition, contextMenuTarget, handleContextMenu: handleProjectContextMenu, closeContextMenu } = useContextMenu<Trip>();

  // Bulk selection for projects
  const { selectedCount, toggle: toggleSelect, deselectAll, isSelected } = useBulkSelection();

  const handleBulkStatusChange = useCallback(async (status: TripStatus) => {
    const selected = [...trips, ...(sharedTrips || [])].filter((t) => isSelected(t.id));
    await Promise.allSettled(
      selected.map((t) => updateTripService(t.id, { status }))
    );
    deselectAll();
    refreshTrips();
  }, [trips, sharedTrips, isSelected, deselectAll, refreshTrips]);

  const projectContextActions: QuickAction[] = contextMenuTarget
    ? [
        { label: 'Open Project', icon: <OpenInNewIcon fontSize="small" />, onClick: () => { navigate(`/trip/${contextMenuTarget.id}`); } },
        { label: 'Edit Details', icon: <EditIcon_ctx fontSize="small" />, onClick: () => { navigate(`/trip/${contextMenuTarget.id}`); } },
        { label: 'Share', icon: <ShareIcon fontSize="small" />, onClick: () => { navigate(`/trip/${contextMenuTarget.id}`); } },
        { label: 'Export', icon: <CloudDownloadIcon_ctx fontSize="small" />, onClick: () => { navigate(`/trip/${contextMenuTarget.id}`); } },
        { label: 'Delete', icon: <DeleteOutlineIcon fontSize="small" />, onClick: () => { handleDeleteTrip(contextMenuTarget); }, dividerBefore: true, color: 'error' },
      ]
    : [];
  
  // Add dev placeholder project in development mode
  const displayTrips = useMemo(() => {
    const allTrips = [...trips];
    if (import.meta.env.DEV) {
      allTrips.unshift(createDevPlaceholderProject());
    }
    return allTrips;
  }, [trips]);
  const [localFiles, setLocalFiles] = useState<Song[]>([]);
  const [_localProjectId] = useState<string>(SPECIAL_PROJECT_IDS.LOCAL_SONGS);
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
  const [_selectedTripId, setSelectedTripId] = useState<string>('');
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [_error, setError] = useState<string | null>(null);
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, ToastComponent } = useToast();
  const [_showFolderDialog, setShowFolderDialog] = useState(false);
  const [scanningFiles, setScanningFiles] = useState(false);
  const [_scannedFiles, setScannedFiles] = useState<File[]>([]);
  const [_scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderPath, setFolderPath] = useState('');
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // State for song counts (fetched asynchronously)
  const [_songCounts, setSongCounts] = useState<Record<string, number>>({});
  const [totalSongsCount, setTotalSongsCount] = useState(0);

  // Fetch song counts for all trips
  useEffect(() => {
    const fetchSongCounts = async () => {
      const allTrips = [...trips, ...(sharedTrips || [])];
      const counts: Record<string, number> = {};
      let total = 0;

      for (const trip of allTrips) {
        try {
          const count = await getSongCount(trip.id);
          counts[trip.id] = count;
          total += count;
        } catch (error) {
          // Silently fail for individual trips
          counts[trip.id] = 0;
        }
      }

      setSongCounts(counts);
      setTotalSongsCount(total);
    };

    if (trips.length > 0 || (sharedTrips && sharedTrips.length > 0)) {
      fetchSongCounts();
    } else {
      setSongCounts({});
      setTotalSongsCount(0);
    }
  }, [trips, sharedTrips]);

  // Calculate statistics with memoization (exclude dev placeholder)
  const totalProjects = useMemo(() => {
    const realTrips = trips.length;
    const realSharedTrips = sharedTrips?.length || 0;
    return realTrips + realSharedTrips;
  }, [trips.length, sharedTrips?.length]);

  const activeProjects = useMemo(() => 
    trips.filter(trip => trip.status === 'active' as TripStatus).length +
    (sharedTrips?.filter(trip => trip.status === 'active' as TripStatus).length || 0),
    [trips, sharedTrips]
  );

  const totalCollaborators = useMemo(() => 
    trips.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0) +
    (sharedTrips?.reduce((acc, trip) => acc + (trip.collaborators?.length || 0), 0) || 0),
    [trips, sharedTrips]
  );

  // totalSongs is already a state variable (totalSongsCount), no need to memoize
  const totalSongs = totalSongsCount;

  const handleTripClick = useCallback((trip: Trip) => {
    // Check if it's a dev placeholder
    if (import.meta.env.DEV && trip.id === 'dev-placeholder-project') {
      navigate(`/trip/${trip.id}`);
      return;
    }
    setSelectedTripId(trip.id);
    navigate(`/trip/${trip.id}`);
  }, [navigate]);

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
      setError(getErrorMessage(err, 'Failed to fetch analytics'));
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
            
            // Uploading audio file
            
            // Upload the audio file
            const filePath = await uploadMusicFile(file, newTrip.id);
            
            // Create a new song entry
            const newSong: Omit<Song, 'id'> = {
              title: removeFileExtension(file.name),
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
            // Unsupported file type - skipping
            setError(`Unsupported file type: ${fileType} for file ${file.name}`);
          }
        } catch (fileError) {
          setError(getErrorMessage(fileError, `Error processing file ${file.name}`));
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
      const errorMsg = getErrorMessage(err, 'Failed to upload files');
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Note: DashboardDialogs will create its own dropzone to avoid ref issues

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
      setError(getErrorMessage(err, 'Failed to create playlist'));
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setPlaylistVisibility(event.target.value as 'private' | 'public' | 'unlisted');
  };

  const handleDeleteTrip = (trip: Trip) => {
    // Prevent deletion of dev placeholder
    if (import.meta.env.DEV && trip.id === 'dev-placeholder-project') {
      showError('Cannot delete dev placeholder project');
      return;
    }
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
      setTripToDelete(null);
      showSuccess('Project deleted successfully');
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Failed to delete project. Please try again.');
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setDeletingTripId(null);
      setTripToDelete(null);
    }
  };

  const cancelDeleteTrip = () => {
    setDeleteConfirmOpen(false);
    setTripToDelete(null);
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
    } catch (error: unknown) {
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
      setError(getErrorMessage(error, 'Failed to select folder'));
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
        title: removeFileExtension(file.name),
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
      storageHelpers.setItem(STORAGE_KEYS.LOCAL_FILES, newLocalFiles);
      setShowFolderDialog(false);
      showSuccess(`Successfully added ${files.length} local file${files.length !== 1 ? 's' : ''}!`);
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Failed to create local trip');
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  // Load local files from localStorage on component mount
  useEffect(() => {
    const savedLocalFiles = storageHelpers.getItem<typeof localFiles>(STORAGE_KEYS.LOCAL_FILES);
    if (savedLocalFiles) {
      setLocalFiles(savedLocalFiles);
    }
    
    // Create a local project ID if it doesn't exist
    const savedLocalProjectId = storageHelpers.getItem<string>(STORAGE_KEYS.LOCAL_PROJECT_ID);
    if (!savedLocalProjectId) {
      const newLocalProjectId = SPECIAL_PROJECT_IDS.LOCAL_SONGS;
      storageHelpers.setItem(STORAGE_KEYS.LOCAL_PROJECT_ID, newLocalProjectId);
    }
  }, []);

  // Cleanup function to handle file URLs
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

  const handleDeleteLocalFile = (songId: string) => {
    const updatedFiles = localFiles.filter(song => song.id !== songId);
    setLocalFiles(updatedFiles);
    storageHelpers.setItem(STORAGE_KEYS.LOCAL_FILES, updatedFiles);
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
        // Error fetching analytics
      }
    };

    if (showAnalyticsDialog) {
      fetchAnalytics();
    }
  }, [showAnalyticsDialog, totalSongs, totalProjects, totalCollaborators]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '60px',
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: 2,
          }
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Dashboard
        </Typography>
      </Box>

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
          trips={displayTrips}
          loading={loading}
          onTripClick={(trip: Trip) => handleTripClick(trip)}
          onDeleteTrip={handleDeleteTrip}
          onCreateNew={() => setOpenDialog(true)}
          onContextMenu={handleProjectContextMenu}
          isSelected={isSelected}
          onToggleSelect={toggleSelect}
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
            onContextMenu={handleProjectContextMenu}
            isSelected={isSelected}
            onToggleSelect={toggleSelect}
          />
            </Box>
          )}

      {isFeatureEnabled('activityFeed') && (trips.length > 0 || (sharedTrips && sharedTrips.length > 0)) && (
        <Box sx={{ mt: 4 }}>
          <ActivityFeed
            tripIds={[...trips, ...(sharedTrips || [])].map((t) => t.id)}
            maxItems={10}
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

      <ToastComponent />

      <DashboardDialogs
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

      {/* Create Project Dialog */}
      {openDialog && (
        <EmptyProjectPanel
          tripId="new"
          onClose={() => setOpenDialog(false)}
          onProjectCreated={(_project) => {
            // EmptyProjectPanel already creates the project and navigates
            // We just need to refresh the trips list and close the dialog
            refreshTrips();
            setOpenDialog(false);
          }}
          isDialog={true}
          mode="project"
        />
      )}

      {/* Quick Actions Context Menu */}
      {isFeatureEnabled('quickActions') && (
        <QuickActionsMenu
          anchorPosition={contextMenuPosition}
          onClose={closeContextMenu}
          actions={projectContextActions}
        />
      )}

      {/* Bulk Status Bar */}
      {isFeatureEnabled('batchOperations') && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onStatusChange={handleBulkStatusChange}
          onDeselectAll={deselectAll}
        />
      )}
    </Container>
  );
};

export default DashboardView; 