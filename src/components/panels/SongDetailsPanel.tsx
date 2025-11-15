import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Chip,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
  Card,
  CardMedia,
  CardContent,
  InputAdornment,
  useTheme,
  Slider,
  alpha,
  Fade,
  Zoom,
  Drawer,
  useMediaQuery
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import CommentIcon from '@mui/icons-material/Comment';
import { Song } from '../../types/song';
import { isFeatureEnabled } from '../../config/features';
import { updateSong, getSong } from '../../services/firebaseService';
import { getAudioUrl, uploadCoverArt } from '../../services/storageService';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { audioService } from '../../services/audioService';
import { STORAGE_KEYS, storageHelpers } from '../../utils/storageHelpers';
import { formatDuration, formatDurationFromString } from '../../utils/formatters';

// Add this type definition after the imports and before the TabPanelProps interface
type SongMetadata = {
  bpm?: number;
  key?: string;
  genre?: string[];
  tags?: string[];
  releaseDate?: string;
  source?: 'local' | 'remote' | 'upload';
  featuring?: string[];
  lyrics?: string;
  videoUrl?: string;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface SongDetailsPanelProps {
  song: Song;
  onClose: () => void;
  onSongUpdated: (updatedSong: Song) => void;
  /** Optional callback to open mixer panel */
  onOpenMixer?: (song: Song) => void;
  /** Optional callback to open comments panel */
  onOpenComments?: (songId: string) => void;
  /** Optional project ID for comments */
  projectId?: string;
  /** Optional collaborators for comments */
  collaborators?: Array<{ id: string; name: string; email?: string; avatar?: string }>;
}

const SongDetailsPanel: React.FC<SongDetailsPanelProps> = ({
  song,
  onClose,
  onSongUpdated,
  onOpenMixer,
  onOpenComments,
  projectId,
  collaborators = []
}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSong, setEditedSong] = useState<Song>(song);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newFeat, setNewFeat] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [showGenreSuggestions, setShowGenreSuggestions] = useState(false);
  const [filteredGenres, setFilteredGenres] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLocalFile, setIsLocalFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // Default tags for different genres and moods
  const defaultTags = {
    genres: ['Rock', 'Pop', 'Hip Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country', 'Metal', 'Folk', 'Blues', 'Reggae', 'Latin', 'World', 'Experimental'],
    moods: ['Happy', 'Sad', 'Energetic', 'Calm', 'Aggressive', 'Melancholic', 'Uplifting', 'Dark', 'Romantic', 'Mysterious'],
    instruments: ['Guitar', 'Piano', 'Drums', 'Bass', 'Violin', 'Saxophone', 'Trumpet', 'Flute', 'Synth', 'Vocals'],
    production: ['Live', 'Studio', 'Remix', 'Acoustic', 'Electronic', 'Lo-fi', 'Hi-fi', 'Experimental']
  };

  const defaultGenres = [
    // Popular Genres
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Classical',
    'Metal', 'Folk', 'Blues', 'Reggae', 'Latin', 'World', 'Experimental',
    
    // Rock Subgenres
    'Alternative Rock', 'Indie Rock', 'Punk Rock', 'Progressive Rock', 'Psychedelic Rock',
    'Grunge', 'Post-Rock', 'Math Rock', 'Art Rock', 'Folk Rock',
    
    // Electronic Subgenres
    'House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'IDM', 'Ambient',
    'Synthwave', 'Chillwave', 'Lo-fi', 'Future Bass', 'Trap', 'Drill',
    
    // Hip Hop Subgenres
    'Trap', 'Drill', 'Boom Bap', 'Cloud Rap', 'Alternative Hip Hop',
    'Conscious Hip Hop', 'Gangsta Rap', 'Mumble Rap',
    
    // Jazz Subgenres
    'Bebop', 'Swing', 'Fusion', 'Cool Jazz', 'Free Jazz', 'Smooth Jazz',
    
    // Classical Subgenres
    'Baroque', 'Romantic', 'Contemporary Classical', 'Chamber Music',
    'Symphony', 'Opera', 'Choral',
    
    // World Music
    'African', 'Asian', 'Middle Eastern', 'Latin American', 'Celtic',
    'Indian Classical', 'Traditional Folk',
    
    // Other Genres
    'Soul', 'Funk', 'Disco', 'Gospel', 'Ragtime', 'Blues Rock',
    'Progressive Metal', 'Death Metal', 'Black Metal', 'Doom Metal',
    'Folk Metal', 'Symphonic Metal', 'Industrial', 'Noise', 'Avant-garde'
  ];

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
        !editedSong.metadata?.tags?.includes(tag)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(allDefaultTags.filter(tag => !editedSong.metadata?.tags?.includes(tag)));
    }
  }, [newTag, editedSong.metadata?.tags]);

  // Filter genres based on input
  useEffect(() => {
    if (newGenre.trim()) {
      const filtered = defaultGenres.filter(genre => 
        genre.toLowerCase().includes(newGenre.toLowerCase()) &&
        !editedSong.metadata?.genre?.includes(genre)
      );
      setFilteredGenres(filtered);
    } else {
      setFilteredGenres(defaultGenres.filter(genre => !editedSong.metadata?.genre?.includes(genre)));
    }
  }, [newGenre, editedSong.metadata?.genre]);

  const handleTagSelect = async (tag: string) => {
    if (!tag.trim() || editedSong.metadata?.tags?.includes(tag.trim())) return;
    
    const updatedTags = [...new Set([...(editedSong.metadata?.tags || []), tag.trim()])];
    
    // Create a clean metadata object with proper typing
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      tags: updatedTags
    };

    // Remove any undefined values
    Object.keys(cleanMetadata).forEach(key => {
      if (cleanMetadata[key as keyof SongMetadata] === undefined) {
        delete cleanMetadata[key as keyof SongMetadata];
      }
    });
    
    // Update local state immediately for responsive UI
    const updatedSong = {
      ...editedSong,
      metadata: cleanMetadata
    };
    
    setEditedSong(updatedSong);
    setNewTag('');
    setShowTagSuggestions(false);
    
    try {
      // Update the song in Firebase
      await updateSong(editedSong.id, updatedSong);
      
      // Notify parent component
      onSongUpdated(updatedSong);
    } catch (error) {
      // Error adding tag
      
      // Revert local state if Firebase update fails
      setEditedSong(song);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = (editedSong.metadata?.tags || []).filter(tag => tag !== tagToRemove);
    
    // Update local state immediately for responsive UI
    const updatedSong = {
      ...editedSong,
      metadata: {
        ...editedSong.metadata,
        tags: updatedTags
      }
    };
    
    // Update local state immediately
    setEditedSong(updatedSong);
    
    try {
      // Update the song in Firebase
      await updateSong(editedSong.id, updatedSong);
      
      // Notify parent component
      onSongUpdated(updatedSong);
    } catch (error) {
      // Error removing tag
      
      // Revert local state if Firebase update fails
      setEditedSong(song);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setCurrentTime(currentTime);
      setDuration(duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Function to get MIME type from file extension
  const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'wav':
        return 'audio/wav';
      case 'mp3':
        return 'audio/mpeg';
      case 'ogg':
        return 'audio/ogg';
      case 'm4a':
        return 'audio/mp4';
      default:
        return 'audio/wav'; // Default to WAV if unknown
    }
  };

  // Function to get file info from localStorage
  const getFileDataFromLocalStorage = () => {
    return storageHelpers.getItem(STORAGE_KEYS.FILE_INFO(song.id));
  };

  // Add a function to store blob URL in localStorage
  const storeBlobUrl = (songId: string, blobUrl: string) => {
    storageHelpers.setItem(STORAGE_KEYS.BLOB_URL(songId), blobUrl);
  };

  // Add a function to get blob URL from localStorage
  const getBlobUrl = (songId: string): string | null => {
    return storageHelpers.getItem<string>(STORAGE_KEYS.BLOB_URL(songId));
  };

  // Add function to get authenticated URL
  const getAuthenticatedUrl = async (filePath: string): Promise<string> => {
    try {
      // If it's already a full URL, try to get a fresh authenticated URL
      if (filePath.startsWith('https://')) {
        const storage = getStorage();
        const pathWithoutParams = filePath.split('?')[0];
        const storagePath = decodeURIComponent(pathWithoutParams.split('/o/')[1]);
        const storageRef = ref(storage, storagePath);
        return await getDownloadURL(storageRef);
      }
      return filePath;
    } catch (error) {
      // Error getting authenticated URL
      return filePath;
    }
  };

  // Update useEffect for audio initialization
  useEffect(() => {
    const initializeAudio = async () => {
      if (!song.filePath) {
        return;
      }

      try {
        // Create audio element using audioService
        const audio = await audioService.createAudioElement(song.filePath);
        
        // Add event listeners
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });
        audio.addEventListener('error', () => {
          setError('Failed to load audio file. Please try again.');
        });
        
        // Store the audio element
        setAudioElement(audio);
        audioRef.current = audio;

        // Clean up function
        return () => {
          audio.pause();
          audio.src = '';
          audio.load();
        };
      } catch (error) {
        // Error initializing audio
        setError('Failed to initialize audio. Please try again.');
      }
    };

    initializeAudio();
  }, [song.filePath]);

  const handlePlayPause = () => {
    if (!audioElement) {
      setError('Audio element not initialized');
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch(error => {
          // Error playing audio
          setError(`Failed to play audio file: ${error.message}`);
          setIsPlaying(false);
        });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Only update Firebase if it's not a local file
      if (song.metadata?.source !== 'local') {
        await updateSong(song.id, editedSong);
      }
      
      onSongUpdated(editedSong);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update song');
      // Error updating song
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedSong(song);
    setIsEditing(false);
  };


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Auto-open mixer if stems tab is selected and mixer callback is available
    if (isFeatureEnabled('stemsAndMixer') && 
        song.stems && 
        song.stems.length > 0 && 
        onOpenMixer &&
        newValue === 4) {
      onOpenMixer(editedSong);
    }
    
    // Auto-open comments if comments tab is selected and callback is available
    if (isFeatureEnabled('comments') && 
        projectId && 
        onOpenComments &&
        newValue === (isFeatureEnabled('stemsAndMixer') && song.stems && song.stems.length > 0 ? 5 : 4)) {
      onOpenComments(song.id);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...new Set([...(editedSong.metadata?.tags || []), newTag.trim()])];
    
    // Update local state immediately for responsive UI
    const updatedSong = {
      ...editedSong,
      metadata: {
        ...editedSong.metadata,
        tags: updatedTags
      }
    };
    
    // Update local state immediately
    setEditedSong(updatedSong);
    
    // Clear the input
    setNewTag('');
    
    try {
      // Update the song in Firebase
      await updateSong(editedSong.id, updatedSong);
      
      // Notify parent component
      onSongUpdated(updatedSong);
    } catch (error) {
      // Error adding tag
      
      // Revert local state if Firebase update fails
      setEditedSong(song);
    }
  };

  const handleGenreSelect = async (genre: string) => {
    if (!genre.trim() || editedSong.metadata?.genre?.includes(genre.trim())) return;
    
    const updatedGenres = [...new Set([...(editedSong.metadata?.genre || []), genre.trim()])];
    
    // Create a clean metadata object with only defined values
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      genre: updatedGenres
    };

    // Remove any undefined values
    Object.keys(cleanMetadata).forEach(key => {
      if (cleanMetadata[key as keyof SongMetadata] === undefined) {
        delete cleanMetadata[key as keyof SongMetadata];
      }
    });
    
    // Update local state immediately for responsive UI
    const updatedSong = {
      ...editedSong,
      metadata: cleanMetadata
    };
    
    // Update local state immediately
    setEditedSong(updatedSong);
    
    // Clear the input and close suggestions
    setNewGenre('');
    setShowGenreSuggestions(false);
    
    try {
      // Update the song in Firebase
      await updateSong(editedSong.id, updatedSong);
      
      // Notify parent component
      onSongUpdated(updatedSong);
    } catch (error) {
      // Error adding genre
      
      // Revert local state if Firebase update fails
      setEditedSong(song);
    }
  };

  const handleRemoveGenre = async (genreToRemove: string) => {
    const updatedGenres = editedSong.metadata?.genre?.filter(genre => genre !== genreToRemove) || [];
    
    // Update local state immediately for responsive UI
    const updatedSong = {
      ...editedSong,
      metadata: {
        ...editedSong.metadata,
        genre: updatedGenres
      }
    };
    
    // Update local state immediately
    setEditedSong(updatedSong);
    
    try {
      // Update the song in Firebase
      await updateSong(editedSong.id, updatedSong);
      
      // Notify parent component
      onSongUpdated(updatedSong);
    } catch (error) {
      // Error removing genre
      
      // Revert local state if Firebase update fails
      setEditedSong(song);
    }
  };

  const handleAddFeat = () => {
    if (!newFeat.trim() || editedSong.metadata?.featuring?.includes(newFeat.trim())) return;
    
    const updatedFeats = [...new Set([...(editedSong.metadata?.featuring || []), newFeat.trim()])];
    
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      featuring: updatedFeats
    };
    
    setEditedSong({
      ...editedSong,
      metadata: cleanMetadata
    });
    setNewFeat('');
  };

  const handleRemoveFeat = (featToRemove: string) => {
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      featuring: editedSong.metadata?.featuring?.filter(feat => feat !== featToRemove) || []
    };
    
    setEditedSong({
      ...editedSong,
      metadata: cleanMetadata
    });
  };

  const handleLyricsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      lyrics: event.target.value
    };
    
    setEditedSong({
      ...editedSong,
      metadata: cleanMetadata
    });
  };

  const handleVideoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanMetadata: SongMetadata = {
      ...(editedSong.metadata || {}),
      videoUrl: event.target.value
    };
    
    setEditedSong({
      ...editedSong,
      metadata: cleanMetadata
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      const imagePath = await uploadCoverArt(file, song.id);
      setEditedSong({
        ...editedSong,
        imagePath
      });
      await handleSave();
    } catch (err) {
      setError('Failed to upload image');
      // Error uploading image
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create a blob URL for the selected file
      const mimeType = getMimeType(file.name);
      const blobUrl = URL.createObjectURL(new Blob([file], { type: mimeType }));

      // Store the blob URL in both ref and localStorage
      blobUrlRef.current = blobUrl;
      storeBlobUrl(song.id, blobUrl);

      // Update the song with the new file path
      const updatedSong = {
        ...editedSong,
        filePath: blobUrl,
        metadata: {
          ...editedSong.metadata,
          _originalFileName: file.name,
          source: 'local' as const,
          fileSize: file.size,
          lastModified: file.lastModified
        }
      };

      // Store minimal file information in localStorage
      try {
        const fileInfo = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type
        };
        storageHelpers.setItem(STORAGE_KEYS.FILE_INFO(song.id), fileInfo);
      } catch (storageError) {
        // Silently fail - localStorage may be full or unavailable
      }

      // Update the song state
      setEditedSong(updatedSong);
      onSongUpdated(updatedSong);

      // Set the audio URL state
      setAudioUrl(blobUrl);

      // Initialize audio with the new file
      if (audioElement) {
        audioElement.src = blobUrl;
        audioElement.load();
      }

    } catch (err) {
      // Error handling file selection
      setError('Failed to load selected file');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the latest song data when the panel is opened
  useEffect(() => {
    let cancelled = false;

    const fetchLatestSongData = async () => {
      try {
        // Only fetch from Firebase if it's not a local file
        if (song.metadata?.source !== 'local') {
          // Fetch the latest song data from Firebase
          const latestSong = await getSong(song.id);
          if (!cancelled && latestSong) {
            // Update the local state with the latest song data
            setEditedSong(latestSong);
          }
        }
      } catch (error) {
        // Error fetching latest song data - silently fail
      }
    };

    fetchLatestSongData();

    return () => {
      cancelled = true;
    };
  }, [song.id]);

  // Update editedSong when song prop changes
  useEffect(() => {
    setEditedSong(song);
    setNewTag('');
    setNewGenre('');
    setNewFeat('');
    setShowTagSuggestions(false);
  }, [song]);

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const volumeValue = newValue as number;
    setVolume(volumeValue);
    if (audioElement) {
      audioElement.volume = volumeValue;
    }
  };

  const handleMuteToggle = () => {
    if (audioElement) {
      if (isMuted) {
        audioElement.volume = volume;
        setIsMuted(false);
      } else {
        audioElement.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    if (audioElement) {
      const time = (newValue as number) * audioElement.duration;
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={true}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 640,
          maxWidth: '100%',
          height: isMobile ? '90vh' : '100%',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
          bgcolor: 'background.paper',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.paper} 50%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 50%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 8px 32px rgba(0, 0, 0, 0.5)'
            : '0px 8px 32px rgba(0, 0, 0, 0.15)',
          borderLeft: isMobile ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.1),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: '4px',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            },
          },
        }
      }}
      sx={{
        zIndex: 1200,
        '& .MuiBackdrop-root': {
          backgroundColor: alpha(theme.palette.common.black, 0.6),
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${theme.palette.background.paper} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderBottom: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            borderRadius: 0,
            boxShadow: `0px 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {isEditing ? 'Edit Song' : song.title}
              </Typography>
              {!isEditing && song.artist && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                  }}
                >
                  {song.artist}
                </Typography>
              )}
            </Box>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{
                ml: 1,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.15),
                  color: 'error.main',
                  transform: 'scale(1.1)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ mt: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease-in-out',
                  borderRadius: '8px 8px 0 0',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                },
              }}
            >
              <Tab label="Details" />
              <Tab label="Lyrics" />
              <Tab label="Media" />
              <Tab label="Metadata" />
              {isFeatureEnabled('stemsAndMixer') && song.stems && song.stems.length > 0 && (
                <Tab label="Stems" icon={<GraphicEqIcon />} iconPosition="start" />
              )}
              {isFeatureEnabled('comments') && projectId && (
                <Tab label="Comments" icon={<CommentIcon />} iconPosition="start" />
              )}
            </Tabs>
          </Box>
        </Paper>

        {/* Tab Content - Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 3,
            pt: 3,
            pb: 3,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%)`,
              borderRadius: '4px',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.5)} 0%, ${alpha(theme.palette.secondary.main, 0.5)} 100%)`,
              },
            },
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: 2, mt: 2 }}
              action={
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Select Audio File
                </Button>
              }
            >
              <Typography variant="body2" gutterBottom>
                {error}
              </Typography>
            </Alert>
          )}

          <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Zoom in={true}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                          Basic Information
                        </Typography>
                        {!isEditing && (
                          <IconButton
                            size="small"
                            onClick={() => setIsEditing(true)}
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                          {isEditing ? (
                            <TextField
                              value={editedSong.title}
                              onChange={(e) => setEditedSong({ ...editedSong, title: e.target.value })}
                              fullWidth
                              variant="outlined"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          ) : (
                            <Typography variant="body1">{song.title}</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Artist</Typography>
                          {isEditing ? (
                            <TextField
                              value={editedSong.artist}
                              onChange={(e) => setEditedSong({ ...editedSong, artist: e.target.value })}
                              fullWidth
                              variant="outlined"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          ) : (
                            <Typography variant="body1">{song.artist}</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                          <Typography variant="body1">{formatDurationFromString(song.duration)}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                          Technical Details
                        </Typography>
                        {!isEditing && (
                          <IconButton
                            size="small"
                            onClick={() => setIsEditing(true)}
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">BPM</Typography>
                          {isEditing ? (
                            <TextField
                              type="number"
                              value={editedSong.metadata?.bpm || ''}
                              onChange={(e) => setEditedSong({
                                ...editedSong,
                                metadata: {
                                  ...editedSong.metadata,
                                  bpm: e.target.value ? parseInt(e.target.value) : undefined,
                                }
                              })}
                              fullWidth
                              variant="outlined"
                              size="small"
                              placeholder="Enter BPM"
                              sx={{ mt: 0.5 }}
                            />
                          ) : (
                            <Typography variant="body1">
                              {editedSong.metadata?.bpm || 'Not set'}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Key</Typography>
                          {isEditing ? (
                            <TextField
                              value={editedSong.metadata?.key || ''}
                              onChange={(e) => setEditedSong({
                                ...editedSong,
                                metadata: {
                                  ...editedSong.metadata,
                                  key: e.target.value || undefined,
                                }
                              })}
                              fullWidth
                              variant="outlined"
                              size="small"
                              placeholder="e.g., C Major, A Minor"
                              sx={{ mt: 0.5 }}
                            />
                          ) : (
                            <Typography variant="body1">
                              {editedSong.metadata?.key || 'Not set'}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Release Date</Typography>
                          {isEditing ? (
                            <TextField
                              type="date"
                              value={editedSong.metadata?.releaseDate ? new Date(editedSong.metadata.releaseDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setEditedSong({
                                ...editedSong,
                                metadata: {
                                  ...editedSong.metadata,
                                  releaseDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                }
                              })}
                              fullWidth
                              variant="outlined"
                              size="small"
                              InputLabelProps={{ shrink: true }}
                              sx={{ mt: 0.5 }}
                            />
                          ) : (
                            <Typography variant="body1">
                              {editedSong.metadata?.releaseDate 
                                ? new Date(editedSong.metadata.releaseDate).toLocaleDateString()
                                : 'Not set'}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  {/* Edit Actions */}
                  {isEditing && (
                    <Box sx={{ 
                      mt: 3, 
                      display: 'flex', 
                      gap: 2, 
                      justifyContent: 'flex-end', 
                      pt: 2, 
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` 
                    }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Zoom>
            </Grid>

            <Grid item xs={12}>
              <Fade in={true} timeout={500}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                >
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Genres & Tags
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Genres
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {editedSong.metadata?.genre?.map((genre) => (
                        <Chip
                          key={genre}
                          label={genre}
                          onDelete={isEditing ? () => handleRemoveGenre(genre) : undefined}
                          sx={{
                            borderRadius: 2,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '& .MuiChip-deleteIcon': {
                              color: 'primary.contrastText',
                              '&:hover': {
                                color: 'error.main'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {editedSong.metadata?.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={isEditing ? () => handleRemoveTag(tag) : undefined}
                          sx={{
                            borderRadius: 2,
                            bgcolor: 'secondary.light',
                            color: 'secondary.contrastText',
                            '& .MuiChip-deleteIcon': {
                              color: 'secondary.contrastText',
                              '&:hover': {
                                color: 'error.main'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            </Grid>

            {editedSong.metadata?.featuring && editedSong.metadata.featuring.length > 0 && (
              <Grid item xs={12}>
                <Fade in={true} timeout={700}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'background.default',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                      }
                    }}
                  >
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Featuring Artists
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {editedSong.metadata.featuring.map((feat) => (
                        <Chip
                          key={feat}
                          label={feat}
                          onDelete={isEditing ? () => handleRemoveFeat(feat) : undefined}
                          sx={{
                            borderRadius: 2,
                            bgcolor: 'info.light',
                            color: 'info.contrastText',
                            '& .MuiChip-deleteIcon': {
                              color: 'info.contrastText',
                              '&:hover': {
                                color: 'error.main'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Fade>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Fade in={true} timeout={500}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                bgcolor: 'background.default',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                }
              }}
            >
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Lyrics
              </Typography>
              {isEditing ? (
                <TextField
                  multiline
                  fullWidth
                  rows={10}
                  value={editedSong.metadata?.lyrics || ''}
                  onChange={handleLyricsChange}
                  variant="outlined"
                  placeholder="Enter song lyrics..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    minHeight: 200,
                  }}
                >
                  {editedSong.metadata?.lyrics || 'No lyrics available'}
                </Box>
              )}
            </Paper>
          </Fade>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Zoom in={true}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                >
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                    }}
                  >
                    Cover Art
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        aspectRatio: '1',
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.8)
                          : 'background.paper',
                        border: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                        boxShadow: `0px 4px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0px 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                          borderColor: theme.palette.primary.main,
                          '& .cover-overlay': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      {editedSong.imagePath ? (
                        <>
                          <Box
                            component="img"
                            src={editedSong.imagePath}
                            alt={editedSong.title || 'Cover Art'}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          {/* Gradient overlay on hover */}
                          <Box
                            className="cover-overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 100%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              pointerEvents: 'none',
                            }}
                          />
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.default, 0.5)
                              : alpha(theme.palette.background.default, 0.3),
                            border: `2px dashed ${alpha(theme.palette.divider, 0.5)}`,
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <ImageIcon 
                            sx={{ 
                              fontSize: 64, 
                              color: 'text.secondary', 
                              opacity: 0.4,
                              mb: 1,
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ opacity: 0.6 }}
                          >
                            No cover art
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {isEditing && (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<ImageIcon />}
                        fullWidth
                        sx={{ 
                          borderRadius: 2,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderStyle: 'solid',
                            borderColor: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'translateY(-2px)',
                            boxShadow: `0px 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                          },
                        }}
                      >
                        {editedSong.imagePath ? 'Change Cover Art' : 'Upload Cover Art'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Zoom>
            </Grid>

            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={700}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    bgcolor: 'background.default',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                >
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Video
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editedSong.metadata?.videoUrl || ''}
                      onChange={handleVideoUrlChange}
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  ) : editedSong.metadata?.videoUrl ? (
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <iframe
                        src={editedSong.metadata.videoUrl}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        allowFullScreen
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 4,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <VideoLibraryIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No video available
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Fade>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight="medium">Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {editedSong.metadata?.tags?.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={isEditing ? () => handleRemoveTag(tag) : undefined}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.contrastText'
                        }
                      }}
                    />
                  ))}
                </Box>
                {isEditing && (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="Add Tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onFocus={() => setShowTagSuggestions(true)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTag.trim() && !editedSong.metadata?.tags?.includes(newTag.trim())) {
                              handleTagSelect(newTag.trim());
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowTagSuggestions(false);
                          }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (newTag.trim() && !editedSong.metadata?.tags?.includes(newTag.trim())) {
                            handleTagSelect(newTag.trim());
                          }
                        }} 
                        startIcon={<AddIcon />}
                        variant="contained"
                        sx={{ borderRadius: 2 }}
                      >
                        Add
                      </Button>
                    </Box>

                    {/* Tag Suggestions Dropdown */}
                    {showTagSuggestions && (
                      <Paper
                        elevation={4}
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          mt: 0.5,
                          maxHeight: 300,
                          overflow: 'auto',
                          zIndex: 1000,
                        }}
                      >
                        {Object.entries(defaultTags).map(([category, tags]) => {
                          const filteredCategoryTags = tags.filter(tag => 
                            tag.toLowerCase().includes(newTag.toLowerCase()) &&
                            !editedSong.metadata?.tags?.includes(tag)
                          );
                          
                          if (filteredCategoryTags.length === 0) return null;

                          return (
                            <Box key={category} sx={{ p: 1 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ px: 1, py: 0.5 }}
                              >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </Typography>
                              {filteredCategoryTags.map((tag) => (
                                <Box
                                  key={tag}
                                  onClick={() => handleTagSelect(tag)}
                                  sx={{
                                    px: 2,
                                    py: 1,
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                    },
                                  }}
                                >
                                  {tag}
                                </Box>
                              ))}
                            </Box>
                          );
                        })}
                      </Paper>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight="medium">Genres</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {editedSong.metadata?.genre?.map((genre, index) => (
                    <Chip
                      key={index}
                      label={genre}
                      onDelete={isEditing ? () => handleRemoveGenre(genre) : undefined}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'secondary.light',
                        color: 'secondary.contrastText',
                        '& .MuiChip-deleteIcon': {
                          color: 'secondary.contrastText'
                        }
                      }}
                    />
                  ))}
                </Box>
                {isEditing && (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="Add Genre"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        onFocus={() => setShowGenreSuggestions(true)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newGenre.trim() && !editedSong.metadata?.genre?.includes(newGenre.trim())) {
                              handleGenreSelect(newGenre.trim());
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowGenreSuggestions(false);
                          }
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (newGenre.trim() && !editedSong.metadata?.genre?.includes(newGenre.trim())) {
                            handleGenreSelect(newGenre.trim());
                          }
                        }} 
                        startIcon={<AddIcon />}
                        variant="contained"
                        color="secondary"
                        sx={{ borderRadius: 2 }}
                      >
                        Add
                      </Button>
                    </Box>

                    {/* Genre Suggestions Dropdown */}
                    {showGenreSuggestions && (
                      <Paper
                        elevation={4}
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          mt: 0.5,
                          maxHeight: 300,
                          overflow: 'auto',
                          zIndex: 1000,
                        }}
                      >
                        {filteredGenres.map((genre) => (
                          <Box
                            key={genre}
                            onClick={() => handleGenreSelect(genre)}
                            sx={{
                              px: 2,
                              py: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            {genre}
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom fontWeight="medium">Featuring Artists</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {editedSong.metadata?.featuring?.map((feat, index) => (
                    <Chip
                      key={index}
                      label={feat}
                      onDelete={isEditing ? () => handleRemoveFeat(feat) : undefined}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        '& .MuiChip-deleteIcon': {
                          color: 'info.contrastText'
                        }
                      }}
                    />
                  ))}
                </Box>
                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add Featured Artist"
                      value={newFeat}
                      onChange={(e) => setNewFeat(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeat()}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAddFeat} 
                      startIcon={<AddIcon />}
                      variant="contained"
                      color="info"
                      sx={{ borderRadius: 2 }}
                    >
                      Add
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          </TabPanel>

          {/* Stems Tab */}
          {isFeatureEnabled('stemsAndMixer') && song.stems && song.stems.length > 0 && (
            <TabPanel value={activeTab} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Stems ({song.stems.length})
                      </Typography>
                      {onOpenMixer && (
                        <Button
                          variant="contained"
                          startIcon={<GraphicEqIcon />}
                          onClick={() => onOpenMixer(editedSong)}
                          sx={{ borderRadius: 2 }}
                        >
                          Open Mixer
                        </Button>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      {song.stems.map((stem) => (
                        <Grid item xs={12} sm={6} md={4} key={stem.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="600">
                              {stem.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {typeof stem.duration === 'number' 
                                ? formatDuration(stem.duration) 
                                : stem.duration}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    {!onOpenMixer && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Mixer feature is available. Enable it in settings to access the mixer.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          )}

          {/* Comments Tab */}
          {isFeatureEnabled('comments') && projectId && (
            <TabPanel value={activeTab} index={isFeatureEnabled('stemsAndMixer') && song.stems && song.stems.length > 0 ? 5 : 4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Comments
                      </Typography>
                      {onOpenComments && (
                        <Button
                          variant="outlined"
                          startIcon={<CommentIcon />}
                          onClick={() => onOpenComments(song.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          View All Comments
                        </Button>
                      )}
                    </Box>
                    {onOpenComments ? (
                      <Alert severity="info">
                        Click "View All Comments" to see and manage comments for this song.
                      </Alert>
                    ) : (
                      <Alert severity="info">
                        Comments feature is available. Enable it in settings to access comments.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          )}
        </Box>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="audio/*"
          onChange={handleFileSelect}
        />
      </Box>
    </Drawer>
  );
};

export default SongDetailsPanel; 