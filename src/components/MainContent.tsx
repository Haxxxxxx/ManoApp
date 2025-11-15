import { Box, Typography, List, ListItem, ListItemText, Paper, IconButton, Button, Dialog, Chip, Grid, Snackbar, Alert, CircularProgress, DialogTitle, DialogContent, DialogActions, LinearProgress, Tooltip } from '@mui/material';
import EmptyState from './common/EmptyState';
import SkeletonLoader from './common/SkeletonLoader';
import SearchBar from './common/SearchBar';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { getTrip, getSongs, createSong, updateSong, createTrip, deleteSong, updateTrip, getSong, getAlbums } from '../services/firebaseService';
import { getSharedDriveFiles, getNotionTemplate, uploadMusicFile, uploadCoverArt } from '../services/storageService';
import { Song } from '../types/song';
import type { SongMetadata } from '../types/song';
import { Trip } from '../types/trip';
import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { audioService } from '../services/audioService';
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
import { getPanelProps, panelRegistry } from './panels/panelRegistry';
import { formatBytes, removeFileExtension, formatDuration } from '../utils/formatters';
import { FILE_SIZE_LIMITS, STORAGE_KEYS, SPECIAL_PROJECT_IDS } from '../utils/constants';
import { validateAudioFile } from '../utils/fileValidation';
import { storageHelpers } from '../utils/storageHelpers';
import { createDevPlaceholderProject } from '../utils/devPlaceholder';
import CreateAlbumFromProjectPanel from './panels/CreateAlbumFromProjectPanel';
import AlbumIcon from '@mui/icons-material/Album';
import type { Album } from '../types/album';
import SharedDriveDialog from './dialogs/SharedDriveDialog';

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
import AddSongPanel from './panels/AddSongPanel';

type ActivePanel = 'export' | 'metadata' | 'collaborators' | 'analytics' | 'tags' | 'settings' | 'publish-spotify' | 'publish-soundcloud' | 'song-management' | 'create-project' | 'upload' | 'create-playlist' | 'add-song' | 'overview' | 'mixer' | 'comments' | 'release-planning' | null;

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
  const [songForMixer, setSongForMixer] = useState<Song | null>(null); // Store song for mixer panel
  const [assetIdForComments, setAssetIdForComments] = useState<string | null>(null); // Store assetId for comments
  const [releaseForExport, setReleaseForExport] = useState<any | null>(null); // Store release for export panel
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const theme = useTheme();

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) {
      return songs;
    }
    const query = songSearchQuery.toLowerCase();
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.metadata?.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      song.metadata?.genre?.toLowerCase().includes(query)
    );
  }, [songs, songSearchQuery]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Array<{file: File; error: string}>>([]);
  const [validFiles, setValidFiles] = useState<File[]>([]);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [projectAlbums, setProjectAlbums] = useState<Album[]>([]);
  const [sharedDriveFiles, setSharedDriveFiles] = useState<SharedDriveFile[]>([]);
  const [showSharedDriveDialog, setShowSharedDriveDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);

  // Default tags for different genres and moods - memoized to prevent recreation
  const defaultTags = useMemo(() => ({
    genres: ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk', 'Metal'],
    moods: ['Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Melancholic', 'Upbeat', 'Dark', 'Peaceful', 'Dramatic'],
    instruments: ['Piano', 'Guitar', 'Drums', 'Bass', 'Strings', 'Synth', 'Vocals', 'Saxophone', 'Trumpet', 'Violin'],
    production: ['Studio', 'Live', 'Demo', 'Remix', 'Cover', 'Original', 'Acoustic', 'Electronic', 'Experimental', 'Traditional']
  }), []);

  const allDefaultTags = useMemo(() => [
    ...defaultTags.genres,
    ...defaultTags.moods,
    ...defaultTags.instruments,
    ...defaultTags.production
  ], [defaultTags]);

  // Filter tags based on input - memoized for performance
  const filteredTags = useMemo(() => {
    if (newTag.trim()) {
      return allDefaultTags.filter(tag => 
        tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !selectedTags.includes(tag)
      );
    }
    return allDefaultTags.filter(tag => !selectedTags.includes(tag));
  }, [newTag, selectedTags, allDefaultTags]);

  // Add effect to handle initialPanel changes
  useEffect(() => {
    if (initialPanel) {
      setActivePanel(initialPanel);
    }
  }, [initialPanel]);

  useEffect(() => {
    let cancelled = false;

    const fetchTripData = async () => {
      if (!selectedTrip) {
        if (!cancelled) {
          setTripData(null);
          setTripName('');
          setSongs([]);
          setSelectedSong(null);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setError(null);
      }
      
      try {
        // Check if this is a dev placeholder project
        if (import.meta.env.DEV && selectedTrip === 'dev-placeholder-project') {
          const devProject = createDevPlaceholderProject();
          
          if (!cancelled) {
            setTripData(devProject);
            setTripName(devProject.name);
            setSongs(devProject.songs || []);
            setIsLoading(false);
          }
          return;
        }
        
        // Check if this is a local songs project
        if (selectedTrip === SPECIAL_PROJECT_IDS.LOCAL_SONGS) {
          // Get local files from localStorage
          const savedLocalFiles = storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES);
          if (savedLocalFiles) {
            const localFiles = savedLocalFiles;
            
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
            
            if (!cancelled) {
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
            }
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
              if (!cancelled) {
                setTripData(project);
                setTripName(project.name);
                // Note: project.songs may be empty - songs are fetched from collection
                // For local projects, we'll fetch from localStorage if needed
                const localSongs = project.songs && project.songs.length > 0 
                  ? project.songs 
                  : storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES) || [];
                setSongs(localSongs);

                // Check if we need to select a specific song
                const songMatch = window.location.pathname.match(/\/song\/([^\/]+)/);
                if (songMatch && songMatch[1]) {
                  const songId = songMatch[1];
                  const song = localSongs.find((s: Song) => s.id === songId);
                  if (song) {
                    setSelectedSong(song);
                    // Ensure the song details panel is visible
                    setActivePanel('song-management');
                  }
                }
                setIsLoading(false);
              }
              return;
            }
          }

          // If we can't find the project in sessionStorage, try localStorage
          const savedLocalFiles = storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES);
          if (savedLocalFiles) {
            const localFiles = savedLocalFiles;
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
              if (!cancelled) {
                setTripData(localProject);
                setTripName(localProject.name);
                setSongs([song]);
                setSelectedSong(song);
                // Store the project in sessionStorage for future access
                sessionStorage.setItem('currentLocalProject', JSON.stringify(localProject));
                setIsLoading(false);
              }
              return;
            }
          }

          if (!cancelled) {
            setError('Local project data not found');
            setTripData(null);
            setTripName('');
            setSongs([]);
            setSelectedSong(null);
            setIsLoading(false);
            navigate('/');
          }
          return;
        }

        // Fetch trip data
        const trip = await getTrip(selectedTrip);
        if (!cancelled) {
          if (trip) {
            setTripData(trip);
            setTripName(trip.name);
            
            // Always fetch songs from the songs collection (source of truth)
            // Do not rely on trip.songs array as it may be out of sync
            const tripSongs = await getSongs(selectedTrip);
            
            if (!cancelled) {
              // Update the songs state with the fetched songs
              setSongs(tripSongs);
              
              // Check if we need to select a specific song
              const songMatch = window.location.pathname.match(/\/song\/([^\/]+)/);
              if (songMatch && songMatch[1]) {
                const songId = songMatch[1];
                const song = tripSongs.find(s => s.id === songId);
                if (song) {
                  setSelectedSong(song);
                  setActivePanel('song-management');
                }
              }
            }
          } else {
            setError('Project not found');
            setTripData(null);
            setTripName('');
            setSongs([]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          // Error fetching trip data
          setError('Failed to load project data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTripData();

    return () => {
      cancelled = true;
    };
  }, [selectedTrip, navigate]);

  // Add this effect to fetch albums when a trip is selected
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

  // Fetch release data when release-export panel is opened
  useEffect(() => {
    const fetchReleaseForExport = async () => {
      if (activePanel === 'release-export' && selectedTrip && !releaseForExport && !loadingRelease) {
        setLoadingRelease(true);
        try {
          const { getReleasesForProject } = await import('../services/firebaseService');
          const releases = await getReleasesForProject(selectedTrip);
          if (releases.length > 0) {
            setReleaseForExport(releases[0]); // Use first release for now
          } else {
            setError('No release found for this project. Please create a release first.');
            setActivePanel(null);
          }
        } catch (error) {
          setError('Failed to load release data');
          console.error('Error loading release:', error);
          setActivePanel(null);
        } finally {
          setLoadingRelease(false);
        }
      }
    };

    fetchReleaseForExport();
  }, [activePanel, selectedTrip, releaseForExport, loadingRelease]);

  // Clear release data when panel closes
  useEffect(() => {
    if (activePanel !== 'release-export') {
      setReleaseForExport(null);
      setLoadingRelease(false);
    }
  }, [activePanel]);

  const validateFile = (file: File) => {
    return validateAudioFile(file, FILE_SIZE_LIMITS.AUDIO_UPLOAD);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentUser || !selectedTrip) {
      setError('Please select a project first');
      return;
    }

    setUploadErrors([]);
    setValidFiles([]);
    setIsUploading(true);
    setUploadProgress(0);

    // Validate all files first
    const errors: Array<{file: File; error: string}> = [];
    const valid: File[] = [];

    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push({ file, error });
      } else {
        valid.push(file);
      }
    });

    setUploadErrors(errors);
    setValidFiles(valid);

    if (valid.length === 0) {
      setIsUploading(false);
      return;
    }

    // Track upload progress across all files
    let completedFiles = 0;
    const totalFiles = valid.length;
    const fileProgress: { [key: number]: number } = {};

    const updateOverallProgress = () => {
      const totalProgress = Object.values(fileProgress).reduce((sum, progress) => sum + progress, 0);
      const overallProgress = (totalProgress / totalFiles);
      setUploadProgress(Math.min(overallProgress, 100));
    };

    try {
      // Process each valid file with proper progress tracking
      await Promise.all(valid.map(async (file, index) => {
        try {
          // Check if it's an audio file
          if (file.type.startsWith('audio/') || file.type === 'application/octet-stream' || 
              file.name.toLowerCase().endsWith('.mp3') || 
              file.name.toLowerCase().endsWith('.wav') || 
              file.name.toLowerCase().endsWith('.flac') || 
              file.name.toLowerCase().endsWith('.aac') || 
              file.name.toLowerCase().endsWith('.ogg') || 
              file.name.toLowerCase().endsWith('.m4a')) {
            
            // Get audio metadata
            const metadata = await audioService.getMetadata(file);
            
            // Upload the audio file with progress tracking
            const filePath = await uploadMusicFile(
              file, 
              selectedTrip, 
              undefined,
              (progress) => {
                // Track individual file progress (0-100)
                fileProgress[index] = progress;
                updateOverallProgress();
              }
            );
            
            // Create a clean metadata object
            const cleanMetadata: Partial<SongMetadata> = {
              tags: ['uploaded'],
              genre: [],
              source: 'upload' as const,
              _originalFileName: file.name,
              _fileSize: file.size,
              _lastModified: file.lastModified
            };

            // Only add these if they exist
            if (metadata.bpm) cleanMetadata.bpm = metadata.bpm;
            if (metadata.key) cleanMetadata.key = metadata.key;
            
            // Create a new song entry
            const newSong: Omit<Song, 'id'> = {
              title: removeFileExtension(file.name),
              artist: artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
              duration: formatDuration(metadata.duration),
              filePath,
              userId: currentUser.uid,
              metadata: cleanMetadata
            };
            
            // Save the song to Firestore
            const createdSong = await createSong(selectedTrip, newSong);
            setSongs(prev => [...prev, createdSong]);
            
            completedFiles++;
            fileProgress[index] = 100;
            updateOverallProgress();
          } 
          // Check if it's an image file
          else if (file.type.startsWith('image/') || 
                  file.name.toLowerCase().endsWith('.jpg') || 
                  file.name.toLowerCase().endsWith('.jpeg') || 
                  file.name.toLowerCase().endsWith('.png') || 
                  file.name.toLowerCase().endsWith('.gif')) {
            
            // Upload the image file
            const imagePath = await uploadCoverArt(file, selectedTrip);
            
            // Get current songs count (use functional update to avoid stale closure)
            setSongs(currentSongs => {
              if (currentSongs.length > 0) {
                const firstSong = currentSongs[0];
                // Update song asynchronously - don't block UI
                updateSong(firstSong.id, { imagePath }).catch((error) => {
                  // Error updating song - log but don't block
                  console.error('Failed to update song with image:', error);
                });
                return currentSongs.map(song => 
                  song.id === firstSong.id ? { ...song, imagePath } : song
                );
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
                
                // Save the song to Firestore asynchronously
                createSong(selectedTrip, newSong)
                  .then(createdSong => {
                    // Use functional update to ensure we have latest state
                    setSongs(prev => {
                      // Check if song already exists (avoid duplicates)
                      if (prev.some(s => s.id === createdSong.id)) {
                        return prev;
                      }
                      return [...prev, createdSong];
                    });
                  })
                  .catch((error) => {
                    // Error creating song - log but don't block
                    console.error('Failed to create song with image:', error);
                  });
                
                return currentSongs;
              }
            });
            
            completedFiles++;
            fileProgress[index] = 100;
            updateOverallProgress();
          } else {
            // Unsupported file type - skipping
            setError(`Unsupported file type: ${file.type} for file ${file.name}`);
            completedFiles++;
            fileProgress[index] = 100;
            updateOverallProgress();
          }
        } catch (fileError) {
          setUploadErrors(prev => [...prev, { 
            file, 
            error: fileError instanceof Error ? fileError.message : 'Upload failed' 
          }]);
          completedFiles++;
          fileProgress[index] = 100;
          updateOverallProgress();
        }
      }));
      
      setUploadProgress(100);
    } catch (err) {
      // Error uploading files
      setError(getErrorMessage(err, 'Failed to upload files'));
    } finally {
      setIsUploading(false);
    }
  }, [selectedTrip, currentUser, artistProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    },
    onDrop,
    noClick: false,
    noKeyboard: false,
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
      // Error fetching latest song data
      // Fallback to using the provided song data if we couldn't fetch the latest
      setSelectedSong(song);
    }
  };

  const handleSongUpdate = async (updatedSong: Song) => {
    if (!selectedTrip) return;
    
    try {
      // Refresh songs from the songs collection (source of truth)
      const refreshedSongs = await getSongs(selectedTrip);
      setSongs(refreshedSongs);
      
      // Update selected song if it's the one that was updated
      if (selectedSong && selectedSong.id === updatedSong.id) {
        const updated = refreshedSongs.find(s => s.id === updatedSong.id);
        if (updated) {
          setSelectedSong(updated);
        }
      }
    } catch (error) {
      // Error updating song
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
        title: removeFileExtension(file.name),
        artist: song.artist,
        metadata: {
          ...song.metadata,
          tags: ['uploaded']
        }
      });
      
      // Update local state
      setSongs(prev => prev.map(s => 
        s.id === song.id ? { ...s, filePath, title: removeFileExtension(file.name) } : s
      ));
      
      setUploadProgress(100);
    } catch (error) {
      // Error replacing song
      setError(getErrorMessage(error, 'Failed to replace song'));
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
      // Error creating project
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddSongClick = () => {
    setActivePanel('add-song');
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

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleProjectCreated = (project: Trip) => {
    // Project created - songs will be fetched automatically when selectedTrip changes
    setIsCreatingProject(false);
    // Navigate to the new project
    if (project.id) {
      onSelectTrip(project.id);
    }
  };

  const handleSongCreated = async (song: Song) => {
    // Add the new song to the songs array
    setSongs(prev => [...prev, song]);
    
    // Close the add song panel
    setActivePanel(null);
  };

  const handleRefreshTrip = async () => {
    if (!selectedTrip) return;
    
    try {
      setIsLoading(true);
      const refreshedTrip = await getTrip(selectedTrip);
      if (refreshedTrip) {
        setTripData(refreshedTrip);
        setTripName(refreshedTrip.name);
        
        // Always fetch songs from the songs collection (source of truth)
        const refreshedSongs = await getSongs(selectedTrip);
        setSongs(refreshedSongs);
        
        // Update selected song if it still exists
        if (selectedSong) {
          const updated = refreshedSongs.find(s => s.id === selectedSong.id);
          if (updated) {
            setSelectedSong(updated);
          } else {
            setSelectedSong(null);
          }
        }
      } else {
        setError('Project not found');
        setTripData(null);
        setTripName('');
        setSongs([]);
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to refresh project'));
    } finally {
      setIsLoading(false);
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

  const handlePublish = () => {
    if (!selectedTrip || !currentUser) return;
    setShowPlatformDialog(true);
  };

  const handlePlatformSelect = (platform: 'spotify' | 'soundcloud') => {
    setShowPlatformDialog(false);
    setActivePanel(`publish-${platform}`);
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
            onSongCreated={handleSongCreated}
            isDialog={true}
          />
        </Suspense>
      );
    }

    // Prepare additional props for specific panels
    const additionalProps: Record<string, any> = {};
    
    // Helper to get collaborators list
    const getCollaboratorsList = (): Array<{ id: string; name: string; email?: string; avatar?: string }> => {
      if (!tripData) return [];
      
      const collaborators: Array<{ id: string; name: string; email?: string; avatar?: string }> = [];
      
      // Add current user as collaborator
      if (currentUser) {
        collaborators.push({
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
          email: currentUser.email || undefined,
        });
      }
      
      // Add other collaborators (would need to fetch user profiles in real implementation)
      if (tripData.collaborators) {
        tripData.collaborators.forEach(collabId => {
          if (collabId !== currentUser?.uid) {
            collaborators.push({
              id: collabId,
              name: collabId, // In real implementation, fetch user profile
              email: undefined,
            });
          }
        });
      }
      
      return collaborators;
    };
    
    if (activePanel === 'overview') {
      additionalProps.onCreateAlbum = () => setShowCreateAlbum(true);
      additionalProps.onExport = () => setActivePanel('export');
      additionalProps.onShare = () => setActivePanel('collaborators');
      additionalProps.onEdit = () => setActivePanel('settings');
      additionalProps.setActivePanel = setActivePanel;
      additionalProps.onStatusChange = async (newStatus: any) => {
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
      additionalProps.onCreateRelease = async (release: any) => {
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
      additionalProps.onFileImported = async (assetId: string) => {
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

  // refreshTripData removed - use handleRefreshTrip instead (no duplicate functions)

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
              onClick={handlePublish}
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
              startIcon={<DashboardIcon />}
              onClick={() => setActivePanel('overview')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Overview
            </Button>
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
        <DashboardView onSelectTrip={onSelectTrip} />
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
    </Box>
  );
};

export default MainContent; 