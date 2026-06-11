import { Box, Typography, List, ListItem, ListItemText, Paper, IconButton, Button, Dialog, Chip, Grid, Snackbar, Alert, CircularProgress, DialogTitle, DialogContent, DialogActions, LinearProgress, Tooltip } from '@mui/material';
import EmptyState from './common/EmptyState';
import SkeletonLoader from './common/SkeletonLoader';
import SearchBar from './common/SearchBar';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { deleteSong, updateTrip, getAlbums, getSongs } from '../services/firebaseService';
import { getSharedDriveFiles, getNotionTemplate } from '../services/storageService';
import { Song } from '../types/song';
import { Trip } from '../types/trip';
import { useContextMenu } from '../hooks/useContextMenu';
import QuickActionsMenu from './common/QuickActionsMenu';
import type { QuickAction } from './common/QuickActionsMenu';
import { isFeatureEnabled } from '../config/features';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AlbumIcon_ctx from '@mui/icons-material/Album';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TagIcon from '@mui/icons-material/Tag';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardView from './DashboardView';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DynamicPanel from './panels/DynamicPanel';
import Breadcrumbs from './common/Breadcrumbs';
import StatusPipeline from './common/StatusPipeline';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatBytes } from '../utils/formatters';
import { FILE_SIZE_LIMITS } from '../utils/constants';
import CreateAlbumFromProjectPanel from './panels/CreateAlbumFromProjectPanel';
import AlbumIcon from '@mui/icons-material/Album';
import type { Album } from '../types/album';
import SharedDriveDialog from './dialogs/SharedDriveDialog';
import DuplicateAssetDialog from './dialogs/DuplicateAssetDialog';
import type { Release } from '../types/release';
import type { TripStatus } from '../types/trip';
import SongDetailsPanel from './panels/SongDetailsPanel';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import AddSongPanel from './panels/AddSongPanel';

// Hooks
import { usePanelManager, type ActivePanel } from '../hooks/usePanelManager';
import { useSongSearch } from '../hooks/useSongSearch';
import { useUploadManager } from '../hooks/useUploadManager';
import { useProjectData } from '../hooks/useProjectData';

interface MainContentProps {
  selectedTrip?: string | null;
  onSelectTrip: (tripId: string) => void;
  initialPanel?: ActivePanel;
}



interface SharedDriveFile {
  name: string;
  fullPath: string;
  url: string;
}

const LoadingPanel: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

const MainContent = ({ selectedTrip, onSelectTrip, initialPanel }: MainContentProps) => {
  const navigate = useNavigate();
  const { currentUser, artistProfile } = useAuth();
  const theme = useTheme();

  // --- Extracted hooks ---
  const {
    tripData, setTripData, tripName, songs, setSongs,
    isLoading, setIsLoading, error, setError,
    selectedSong, setSelectedSong,
    handleSongUpdate, handleSongCreated, handleSongClick,
  } = useProjectData(selectedTrip);

  const {
    activePanel, setActivePanel, isCreatingProject, setIsCreatingProject,
    showCreateAlbum, setShowCreateAlbum,
    showPlatformDialog, setShowPlatformDialog, handleClosePanel, handleAddSongClick,
    handleSettingsClick, handlePublish, handlePlatformSelect,
  } = usePanelManager(initialPanel);

  const { songSearchQuery, setSongSearchQuery, filteredSongs } = useSongSearch(songs);

  // Context menu for songs
  const { contextMenuPosition: songMenuPos, contextMenuTarget: songMenuTarget, handleContextMenu: handleSongContextMenu, closeContextMenu: closeSongContextMenu } = useContextMenu<Song>();

  const songContextActions: QuickAction[] = songMenuTarget
    ? [
        { label: 'Open Details', icon: <InfoIcon fontSize="small" />, onClick: () => { setSelectedSong(songMenuTarget); } },
        { label: 'Edit Metadata', icon: <EditIcon fontSize="small" />, onClick: () => { setSelectedSong(songMenuTarget); } },
        { label: 'Add to Album', icon: <AlbumIcon_ctx fontSize="small" />, onClick: () => { setShowCreateAlbum(true); } },
        { label: 'Duplicate', icon: <ContentCopyIcon fontSize="small" />, onClick: async () => { /* future: implement song duplicate */ } },
        { label: 'Delete', icon: <DeleteOutlineIcon fontSize="small" />, onClick: () => { if (songMenuTarget) deleteSong(songMenuTarget.id).then(() => setSongs(songs.filter((s) => s.id !== songMenuTarget.id))); }, dividerBefore: true, color: 'error' },
      ]
    : [];

  const {
    isUploading, uploadProgress, uploadErrors, validFiles,
    duplicateDialogOpen, setDuplicateDialogOpen,
    duplicateAsset, setDuplicateAsset,
    pendingFile, setPendingFile,
    onDrop: uploadOnDrop,
  } = useUploadManager({ selectedTrip, currentUser, artistProfile });

  // --- Remaining local state ---
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [songForMixer, setSongForMixer] = useState<Song | null>(null);
  const [assetIdForComments, setAssetIdForComments] = useState<string | null>(null);
  const [releaseForExport, setReleaseForExport] = useState<Release | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [deletingSongId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [projectAlbums, setProjectAlbums] = useState<Album[]>([]);
  const [sharedDriveFiles, setSharedDriveFiles] = useState<SharedDriveFile[]>([]);
  const [showSharedDriveDialog, setShowSharedDriveDialog] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch albums when a trip is selected
  useEffect(() => {
    let cancelled = false;

    const fetchProjectAlbums = async () => {
      if (!selectedTrip || !currentUser) return;
      
      try {
        const albums = await getAlbums(currentUser.uid);
        if (!cancelled) {
          // Filter albums that contain songs from this project
          const projectAlbums = albums.filter(album => 
            album.songs.some(song => 
              songs.some(projectSong => projectSong.id === song.id)
            )
          );
          setProjectAlbums(projectAlbums);
        }
      } catch (error) {
        // Error fetching project albums - silently fail
      }
    };

    if (songs.length > 0) {
      fetchProjectAlbums();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedTrip, currentUser, songs]);

  // Fetch release data when release-export or release-planning panel is opened
  useEffect(() => {
    const fetchReleaseForExport = async () => {
      const needsRelease = activePanel === 'release-export' || activePanel === 'release-planning';
      if (needsRelease && selectedTrip && !releaseForExport && !loadingRelease) {
        setLoadingRelease(true);
        try {
          const { getReleasesForProject } = await import('../services/firebaseService');
          const releases = await getReleasesForProject(selectedTrip);
          if (releases.length > 0) {
            setReleaseForExport(releases[0]); // Use first release for now
          } else if (activePanel === 'release-export') {
            setError('No release found for this project. Please create a release first.');
            setActivePanel(null);
          }
          // For release-planning, no release is fine (user can create one)
        } catch (error) {
          setError('Failed to load release data');
          console.error('Error loading release:', error);
          if (activePanel === 'release-export') {
            setActivePanel(null);
          }
        } finally {
          setLoadingRelease(false);
        }
      }
    };

    fetchReleaseForExport();
  }, [activePanel, selectedTrip, releaseForExport, loadingRelease]);

  // Clear release data when panel closes
  useEffect(() => {
    if (activePanel !== 'release-export' && activePanel !== 'release-planning') {
      setReleaseForExport(null);
      setLoadingRelease(false);
    }
  }, [activePanel]);

  // Wire dropzone to the upload hook
  const onDrop = useCallback(
    (acceptedFiles: File[]) => uploadOnDrop(acceptedFiles, setSongs, setError),
    [uploadOnDrop, setSongs, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    },
    onDrop,
    noClick: false,
    noKeyboard: false,
  });

  const handleOpenSharedDrive = async () => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await getSharedDriveFiles();
      // Open a dialog to display the files
      setSharedDriveFiles(files);
      setShowSharedDriveDialog(true);
    } catch (error) {
        // Error accessing shared drive
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
      // Open the template in a new window
      window.open(templateUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        // Error accessing Notion template
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
      // Error deleting song
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

  const handleProjectCreated = (project: Trip) => {
    setIsCreatingProject(false);
    if (project.id) {
      onSelectTrip(project.id);
    }
  };

  const handleCreateAlbum = async (albumId: string) => {
    // Refresh the project albums list
    if (currentUser) {
      try {
        const albums = await getAlbums(currentUser.uid);
        const projectAlbums = albums.filter(album => 
          album.songs.some(song => 
            songs.some(projectSong => projectSong.id === song.id)
          )
        );
        setProjectAlbums(projectAlbums);
      } catch (error) {
        // Error refreshing project albums
      }
    }
    
    // Navigate to the new album
    navigate(`/albums/${albumId}`);
  };

  // Helper to get collaborators list (used in renderActivePanel and SongDetailsPanel)
  const getCollaboratorsList = useCallback((): Array<{ id: string; name: string; email?: string; avatar?: string }> => {
    if (!tripData) return [];

    const collaborators: Array<{ id: string; name: string; email?: string; avatar?: string }> = [];

    if (currentUser) {
      collaborators.push({
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
        email: currentUser.email || undefined,
      });
    }

    if (tripData.collaborators) {
      tripData.collaborators.forEach(collabId => {
        if (collabId !== currentUser?.uid) {
          collaborators.push({
            id: collabId,
            name: collabId,
            email: undefined,
          });
        }
      });
    }

    return collaborators;
  }, [tripData, currentUser]);

  const renderActivePanel = () => {
    if (isCreatingProject) {
      return (
        <Suspense fallback={<LoadingPanel />}>
          <EmptyProjectPanel
            tripId="new"
            onClose={() => setIsCreatingProject(false)}
            onProjectCreated={handleProjectCreated}
            isDialog={true}
            mode="project"
          />
        </Suspense>
      );
    }

    if (!activePanel) {
      return null;
    }

    if (activePanel === 'add-song') {
      return (
        <Suspense fallback={<LoadingPanel />}>
          <AddSongPanel
            tripId={selectedTrip || ''}
            onClose={() => setActivePanel(null)}
            onSongCreated={(song: Song) => { handleSongCreated(song); setActivePanel(null); }}
            isDialog={true}
          />
        </Suspense>
      );
    }

    // Prepare additional props for specific panels
    const additionalProps: Record<string, unknown> = {};

    if (activePanel === 'overview') {
      additionalProps.onCreateAlbum = () => setShowCreateAlbum(true);
      additionalProps.onExport = () => setActivePanel('export');
      additionalProps.onShare = () => setActivePanel('collaborators');
      additionalProps.onEdit = () => setActivePanel('settings');
      additionalProps.setActivePanel = setActivePanel;
      additionalProps.onStatusChange = async (newStatus: TripStatus) => {
        if (tripData && selectedTrip) {
          try {
            await updateTrip(selectedTrip, { status: newStatus });
            setTripData({ ...tripData, status: newStatus });
          } catch (error) {
            setError('Failed to update project status');
          }
        }
      };
    }
    
    if (activePanel === 'comments') {
      additionalProps.collaborators = getCollaboratorsList();
      // If assetIdForComments is set (from opening comments from a song), pass it
      if (assetIdForComments) {
        additionalProps.assetId = assetIdForComments;
      } else if (selectedSong) {
        // If a song is selected, pass its ID as assetId for song-specific comments
        additionalProps.assetId = selectedSong.id;
      }
    }
    
    if (activePanel === 'release-planning') {
      additionalProps.collaborators = getCollaboratorsList();
      additionalProps.setActivePanel = setActivePanel;
      additionalProps.songs = songs;
      additionalProps.onCreateRelease = async (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => {
        // Handle release creation
        try {
          const { createRelease } = await import('../services/firebaseService');
          await createRelease({
            ...release,
            userId: currentUser?.uid || '',
          });
          setSuccess('Release created successfully');
        } catch (error) {
          setError('Failed to create release');
          console.error('Error creating release:', error);
        }
      };
      additionalProps.onUpdateRelease = async (releaseId: string, updates: Partial<Release>) => {
        try {
          const { updateRelease } = await import('../services/firebaseService');
          await updateRelease(releaseId, updates);
          setSuccess('Release updated successfully');
        } catch (error) {
          setError('Failed to update release');
          console.error('Error updating release:', error);
        }
      };
      // Pass existing release if available
      if (selectedTrip && releaseForExport) {
        additionalProps.existingRelease = releaseForExport;
      }
    }

    if (activePanel === 'release-export') {
      // Release data is fetched in useEffect, use state variable
      if (releaseForExport) {
        additionalProps.release = releaseForExport;
        additionalProps.songs = songs;
        additionalProps.collaborators = getCollaboratorsList();
        additionalProps.onExportComplete = () => {
          setSuccess('Release exported successfully');
          // Optionally refresh data
        };
      }
    }

    if (activePanel === 'gdrive-import') {
      additionalProps.projectId = selectedTrip || undefined;
      additionalProps.onFileImported = async (_assetId: string) => {
        setSuccess('File imported successfully');
        // Refresh songs list if needed
        if (selectedTrip) {
          try {
            const updatedSongs = await getSongs(selectedTrip);
            setSongs(updatedSongs);
          } catch (error) {
            // Silently fail - user can manually refresh if needed
          }
        }
      };
    }
    
    if (activePanel === 'mixer') {
      // Mixer panel needs a song with stems
      // Use songForMixer if set, otherwise try selectedSong or find first song with stems
      const songWithStems = songForMixer && songForMixer.stems && songForMixer.stems.length > 0
        ? songForMixer
        : selectedSong && selectedSong.stems && selectedSong.stems.length > 0
        ? selectedSong
        : songs.find(s => s.stems && s.stems.length > 0);
      
      if (songWithStems) {
        additionalProps.song = songWithStems;
      }
    }

    return (
      <Suspense fallback={<LoadingPanel />}>
        <DynamicPanel
          panelType={activePanel}
          tripData={tripData}
          songs={songs}
          selectedTrip={selectedTrip}
          onClose={handleClosePanel}
          additionalProps={additionalProps}
        />
      </Suspense>
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
      {/* Breadcrumbs */}
      {selectedTrip && tripData && (
        <Breadcrumbs
          items={[
            {
              label: tripData.name || tripName,
              path: `/trip/${selectedTrip}`,
              icon: <FolderIcon fontSize="small" />
            }
          ]}
        />
      )}

      {/* Header Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
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
          {/* Status Pipeline - Compact Version */}
          {selectedTrip && tripData && tripData.status && (
            <Box sx={{ ml: 7 }}>
              <StatusPipeline
                currentStatus={tripData.status}
                onStatusChange={async (newStatus) => {
                  if (tripData && selectedTrip) {
                    try {
                      await updateTrip(selectedTrip, { status: newStatus });
                      setTripData({ ...tripData, status: newStatus });
                    } catch (error) {
                      setError('Failed to update project status');
                    }
                  }
                }}
                compact={true}
                showDescriptions={false}
              />
            </Box>
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
              onClick={() => handlePublish(selectedTrip, currentUser)}
              disabled={!songs.length}
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
          {/* Project tabs — uniform, theme-driven (no per-button color) */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 3,
              flexWrap: 'wrap',
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: 2,
            }}
          >
            <Button
              variant={activePanel === 'overview' ? 'contained' : 'text'}
              startIcon={<DashboardIcon />}
              onClick={() => setActivePanel('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activePanel === 'metadata' ? 'contained' : 'text'}
              startIcon={<EditIcon />}
              onClick={() => setActivePanel('metadata')}
            >
              Metadata
            </Button>
            <Button
              variant={activePanel === 'collaborators' ? 'contained' : 'text'}
              startIcon={<GroupAddIcon />}
              onClick={() => setActivePanel('collaborators')}
            >
              Collaborators
            </Button>
            <Button
              variant={activePanel === 'analytics' ? 'contained' : 'text'}
              startIcon={<BarChartIcon />}
              onClick={() => setActivePanel('analytics')}
            >
              Analytics
            </Button>
            <Button
              variant={activePanel === 'tags' ? 'contained' : 'text'}
              startIcon={<TagIcon />}
              onClick={() => setActivePanel('tags')}
            >
              Tags
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="text"
              startIcon={<FolderSharedIcon />}
              onClick={handleOpenSharedDrive}
              disabled={isLoadingDrive}
            >
              {isLoadingDrive ? 'Loading…' : 'Shared Drive'}
            </Button>
            <Button
              variant="text"
              startIcon={<DescriptionIcon />}
              onClick={handleOpenNotionTemplate}
              disabled={isLoadingTemplate}
            >
              {isLoadingTemplate ? 'Loading…' : 'Notion'}
            </Button>
            <Button variant="text" startIcon={<SettingsIcon />} onClick={handleSettingsClick}>
              Settings
            </Button>
            {songs.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<AlbumIcon />}
                onClick={() => setShowCreateAlbum(true)}
              >
                Create Album
              </Button>
            )}
          </Box>

          {/* Search Bar for Songs */}
          {!isLoading && songs.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <SearchBar
                placeholder="Search songs by title, artist, or tags..."
                onSearch={setSongSearchQuery}
                aria-label="Search songs"
                size="small"
              />
            </Box>
          )}

          {/* Songs List */}
          {isLoading ? (
            <SkeletonLoader variant="card" count={8} />
          ) : songs.length === 0 ? (
            <>
              <EmptyState
                icon={<MusicNoteIcon sx={{ fontSize: 64, color: 'primary.main' }} />}
                title="No songs yet"
                description="Add songs to your project by uploading files, importing from shared drive, or creating an empty project. Start building your musical collection today."
                actionLabel="Add Song"
                onAction={handleAddSongClick}
                secondaryActionLabel="Import from Drive"
                onSecondaryAction={handleOpenSharedDrive}
                sx={{ my: 4 }}
              />
              
              {/* Add drop zone for file uploads */}
              <Box sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
                <Box
                  {...getRootProps()}
                  sx={{
                    p: 4,
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                    '&:focus': {
                      outline: 'none',
                      borderColor: 'primary.main',
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
                    },
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <input {...getInputProps()} />
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop your audio files here' : 'Drag & drop audio files here'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to select files
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Supported formats: MP3, WAV, FLAC, AAC, OGG, M4A (up to {formatBytes(FILE_SIZE_LIMITS.AUDIO_UPLOAD)})
                  </Typography>
                </Box>
              </Box>
            </>
          ) : filteredSongs.length === 0 ? (
            <EmptyState
              icon={<MusicNoteIcon sx={{ fontSize: 64, color: 'primary.main' }} />}
              title={`No songs found for "${songSearchQuery}"`}
              description="Try adjusting your search terms or add a new song to this project."
              actionLabel="Add Song"
              onAction={handleAddSongClick}
              sx={{ my: 4 }}
            />
          ) : (
            <Grid container spacing={2}>
              {filteredSongs.map((song) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={song.id}>
                  <Paper
                    elevation={0}
                    onContextMenu={(e) => handleSongContextMenu(e, song)}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: `0px 12px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderColor: 'primary.main',
                        '&::before': {
                          transform: 'scaleX(1)',
                        },
                      },
                    }}
                  >
                    {/* Delete Button */}
                    <Tooltip title="Delete song" arrow>
                      <IconButton
                        onClick={() => handleDeleteSong(song.id)}
                        disabled={isLoading && deletingSongId === song.id}
                        aria-label={`Delete ${song.title}`}
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
                    </Tooltip>

                    <Box 
                      sx={{ 
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 2,
                        aspectRatio: '1/1',
                        bgcolor: 'background.default',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: `0px 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '& .play-overlay': {
                            opacity: 1,
                          },
                        },
                      }}
                      onClick={() => handleSongClick(song)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${song.title} by ${song.artist}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSongClick(song);
                        }
                      }}
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
                        className="play-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      >
                        <Tooltip title="Play song" arrow>
                          <IconButton
                            size="large" 
                            aria-label={`Play ${song.title}`}
                            sx={{
                              color: 'white',
                              bgcolor: alpha(theme.palette.common.black, 0.5),
                              width: 64,
                              height: 64,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.9),
                                transform: 'scale(1.1)',
                                boxShadow: `0px 4px 16px ${alpha(theme.palette.primary.main, 0.5)}`,
                              },
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 32 }} />
                          </IconButton>
                        </Tooltip>
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

          {/* Project Albums */}
          {projectAlbums.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Albums Using Project Songs
              </Typography>
              <Grid container spacing={2}>
                {projectAlbums.map((album) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
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
                          cursor: 'pointer'
                        },
                      }}
                      onClick={() => navigate(`/albums/${album.id}`)}
                    >
                      <Box 
                        sx={{ 
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          mb: 2,
                          aspectRatio: '1/1',
                          bgcolor: 'background.default',
                        }}
                      >
                        {album.coverImage ? (
                          <Box
                            component="img"
                            src={album.coverImage}
                            alt={album.title}
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
                            <AlbumIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                          </Box>
                        )}
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
                        {album.title}
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
                        {album.artist}
                      </Typography>
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {album.songs.length} songs
                        </Typography>
                        {album.genre && (
                          <Chip
                            label={album.genre}
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
            </>
          )}
        </>
      ) : (
        <DashboardView />
      )}

      {/* Feature Panels */}
      {renderActivePanel()}

      {/* Song Details Panel */}
      {selectedSong && (
        <SongDetailsPanel
          song={selectedSong}
          onClose={() => {
            setSelectedSong(null);
            setSongForMixer(null); // Clear mixer song when closing
            setAssetIdForComments(null); // Clear assetId when closing
          }}
          onSongUpdated={handleSongUpdate}
          onOpenMixer={(song) => {
            // Store song for mixer and open panel
            setSongForMixer(song);
            setActivePanel('mixer');
          }}
          onOpenComments={(songId) => {
            // Store assetId for comments and open panel
            setAssetIdForComments(songId);
            setActivePanel('comments');
          }}
          projectId={selectedTrip || undefined}
          collaborators={tripData ? getCollaboratorsList() : []}
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

      {/* Upload Progress */}
      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading {validFiles.length} file{validFiles.length !== 1 ? 's' : ''}...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {Math.round(uploadProgress)}% complete
          </Typography>
        </Box>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Some files couldn't be uploaded:
          </Typography>
          <List dense>
            {uploadErrors.map(({ file, error }, index) => (
              <ListItem key={`${file.name}-${index}`}>
                <ListItemText
                  primary={file.name}
                  secondary={error}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

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

      {/* Create Album Panel */}
      {showCreateAlbum && tripData && (
        <CreateAlbumFromProjectPanel
          trip={{
            ...tripData,
            songs: songs // Explicitly pass the current songs array
          }}
          onClose={() => setShowCreateAlbum(false)}
          onAlbumCreated={handleCreateAlbum}
        />
      )}

      {/* Shared Drive Dialog */}
      <SharedDriveDialog
        open={showSharedDriveDialog}
        onClose={() => setShowSharedDriveDialog(false)}
        files={sharedDriveFiles}
        loading={isLoadingDrive}
        error={driveError}
      />

      {/* Duplicate Asset Dialog */}
      {duplicateAsset && pendingFile && (
        <DuplicateAssetDialog
          open={duplicateDialogOpen}
          existingAsset={duplicateAsset}
          newAssetFilename={pendingFile.name}
          onChoose={async (option) => {
            if (!pendingFile || !currentUser || !selectedTrip) return;

            try {
              if (option === 'link') {
                // Link to existing - skip upload
                setDuplicateDialogOpen(false);
                setDuplicateAsset(null);
                setPendingFile(null);
              } else if (option === 'merge') {
                // Merge metadata - update existing asset
                // TODO: Implement merge logic
                setDuplicateDialogOpen(false);
                setDuplicateAsset(null);
                setPendingFile(null);
              } else if (option === 'force') {
                // Force create - continue with upload
                setDuplicateDialogOpen(false);
                setDuplicateAsset(null);
                setPendingFile(null);
              }
            } catch (error) {
              console.error('Error handling duplicate choice:', error);
            }
          }}
          onClose={() => {
            setDuplicateDialogOpen(false);
            setDuplicateAsset(null);
            setPendingFile(null);
          }}
        />
      )}

      {/* Success Snackbar */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!publishError} 
        autoHideDuration={6000} 
        onClose={() => setPublishError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setPublishError(null)} severity="error">
          {publishError}
        </Alert>
      </Snackbar>

      {/* Platform Selection Dialog */}
      <Dialog
        open={showPlatformDialog}
        onClose={() => setShowPlatformDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2
          }
        }}
      >
        <DialogTitle>
          Choose Platform
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" paragraph>
            Select the platform where you want to publish your project:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handlePlatformSelect('spotify')}
              sx={{
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                borderRadius: 2,
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: 'rgba(29, 185, 84, 0.05)',
                }
              }}
            >
              <img 
                src="/spotify-logo.png" 
                alt="Spotify" 
                style={{ width: 48, height: 48 }}
              />
              <Typography variant="subtitle1">Spotify</Typography>
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handlePlatformSelect('soundcloud')}
              sx={{
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                borderRadius: 2,
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  borderColor: 'warning.dark',
                  bgcolor: 'rgba(255, 152, 0, 0.05)',
                }
              }}
            >
              <img 
                src="/soundcloud-logo.png" 
                alt="SoundCloud" 
                style={{ width: 48, height: 48 }}
              />
              <Typography variant="subtitle1">SoundCloud</Typography>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPlatformDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Song Context Menu */}
      {isFeatureEnabled('quickActions') && (
        <QuickActionsMenu
          anchorPosition={songMenuPos}
          onClose={closeSongContextMenu}
          actions={songContextActions}
        />
      )}
    </Box>
  );
};

export default MainContent; 