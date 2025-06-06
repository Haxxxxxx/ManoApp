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
  Zoom
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
import { Song } from '../../types/song';
import { updateSong, getSong } from '../../services/firebaseService';
import { getAudioUrl, uploadCoverArt } from '../../services/storageService';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { audioService } from '../../services/audioService';

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
}

const SongDetailsPanel: React.FC<SongDetailsPanelProps> = ({
  song,
  onClose,
  onSongUpdated
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
      console.error('Error adding tag:', error);
      
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
      console.error('Error removing tag:', error);
      
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
    console.log('Getting file info from localStorage');
    const fileInfo = localStorage.getItem(`fileInfo_${song.id}`);
    if (fileInfo) {
      console.log('Found file info in localStorage');
      return JSON.parse(fileInfo);
    }
    return null;
  };

  // Add a function to store blob URL in localStorage
  const storeBlobUrl = (songId: string, blobUrl: string) => {
    try {
      localStorage.setItem(`blobUrl_${songId}`, blobUrl);
    } catch (error) {
      console.warn('Failed to store blob URL in localStorage:', error);
    }
  };

  // Add a function to get blob URL from localStorage
  const getBlobUrl = (songId: string): string | null => {
    try {
      return localStorage.getItem(`blobUrl_${songId}`);
    } catch (error) {
      console.warn('Failed to get blob URL from localStorage:', error);
      return null;
    }
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
      console.error('Error getting authenticated URL:', error);
      return filePath;
    }
  };

  // Update useEffect for audio initialization
  useEffect(() => {
    const initializeAudio = async () => {
      console.log('Initializing audio source');
      
      if (!song.filePath) {
        console.warn('No file path available');
        return;
      }

      try {
        // Create audio element using audioService
        const audio = await audioService.createAudioElement(song.filePath);
        
        // Add event listeners
        audio.addEventListener('loadstart', () => console.log('Audio loading started'));
        audio.addEventListener('loadedmetadata', () => {
          console.log('Audio metadata loaded, duration:', audio.duration);
          setDuration(audio.duration);
        });
        audio.addEventListener('canplay', () => console.log('Audio can play'));
        audio.addEventListener('canplaythrough', () => console.log('Audio can play through'));
        audio.addEventListener('progress', () => console.log('Audio loading in progress'));
        audio.addEventListener('error', (e) => {
          console.error('Audio error details:', {
            error: audio.error,
            currentSrc: audio.currentSrc,
            networkState: audio.networkState,
            readyState: audio.readyState,
            paused: audio.paused,
          });
          setError('Failed to load audio file. Please try again.');
        });
        
        // Store the audio element
        setAudioElement(audio);
        audioRef.current = audio;

        // Clean up function
        return () => {
          console.log('Cleaning up audio element');
          audio.pause();
          audio.src = '';
          audio.load();
        };
      } catch (error) {
        console.error('Error initializing audio:', error);
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
      console.log('Pausing audio');
      audioElement.pause();
      setIsPlaying(false);
    } else {
      console.log('Playing audio');
      audioElement.play()
        .then(() => {
          console.log('Audio playback started successfully');
          setIsPlaying(true);
          setError(null);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
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
      console.error('Error updating song:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedSong(song);
    setIsEditing(false);
  };

  const formatDuration = (duration: string | number) => {
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }
    return audioService.formatDuration(Number(duration));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      console.error('Error adding tag:', error);
      
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
      console.error('Error adding genre:', error);
      
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
      console.error('Error removing genre:', error);
      
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
      console.error('Error uploading image:', err);
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
        localStorage.setItem(`fileInfo_${song.id}`, JSON.stringify(fileInfo));
      } catch (storageError) {
        console.warn('Could not store file info in localStorage:', storageError);
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
      console.error('Error handling file selection:', err);
      setError('Failed to load selected file');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the latest song data when the panel is opened
  useEffect(() => {
    const fetchLatestSongData = async () => {
      try {
        // Only fetch from Firebase if it's not a local file
        if (song.metadata?.source !== 'local') {
          // Fetch the latest song data from Firebase
          const latestSong = await getSong(song.id);
          if (latestSong) {
            // Update the local state with the latest song data
            setEditedSong(latestSong);
          }
        }
      } catch (error) {
        console.error('Error fetching latest song data:', error);
      }
    };

    fetchLatestSongData();
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

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'background.paper',
        boxShadow: 3,
        maxHeight: '80vh',
        overflow: 'auto',
        transition: 'transform 0.3s ease-in-out',
        transform: 'translateY(0)',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px 16px 0 0',
          background: theme => `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {isEditing ? 'Edit Song' : song.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button
                variant="contained"
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<AddIcon />}
              >
                Select Audio File
              </Button>
            }
          >
            <Typography variant="body1" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a valid audio file to play this song.
            </Typography>
          </Alert>
        )}

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              minWidth: 100
            }
          }}
          variant="fullWidth"
        >
          <Tab label="Details" />
          <Tab label="Lyrics" />
          <Tab label="Media" />
          <Tab label="Metadata" />
        </Tabs>

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
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        Basic Information
                      </Typography>
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
                          <Typography variant="body1">{formatDuration(song.duration)}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        Technical Details
                      </Typography>
                      <Stack spacing={2}>
                        {song.metadata?.bpm && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">BPM</Typography>
                            <Typography variant="body1">{song.metadata.bpm}</Typography>
                          </Box>
                        )}
                        {song.metadata?.key && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Key</Typography>
                            <Typography variant="body1">{song.metadata.key}</Typography>
                          </Box>
                        )}
                        {song.metadata?.releaseDate && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Release Date</Typography>
                            <Typography variant="body1">
                              {new Date(song.metadata.releaseDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
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
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Cover Art
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {editedSong.imagePath ? (
                      <Card 
                        sx={{ 
                          maxWidth: 300,
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'transform 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="300"
                          image={editedSong.imagePath}
                          alt={editedSong.title}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Cover Art
                          </Typography>
                        </CardContent>
                      </Card>
                    ) : (
                      <Box
                        sx={{
                          width: 300,
                          height: 300,
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
                      </Box>
                    )}
                    {isEditing && (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<ImageIcon />}
                        sx={{ 
                          height: 'fit-content',
                          alignSelf: 'center',
                          borderRadius: 2,
                          borderStyle: 'dashed',
                        }}
                      >
                        {editedSong.imagePath ? 'Change Image' : 'Upload Image'}
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

        {/* Add local file indicator */}
        {isLocalFile && (
          <Chip
            label="Local File"
            color="primary"
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        {/* Display metadata */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Source: {isLocalFile ? 'Local File' : 'Firebase'}
          </Typography>
          {isLocalFile && song.metadata?._originalFileName && (
            <Typography variant="subtitle2" color="text.secondary">
              Original File: {song.metadata._originalFileName}
            </Typography>
          )}
          {/* ... rest of metadata display ... */}
        </Box>

        <Box sx={{ 
          mt: 'auto', 
          pt: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1
        }}>
          {isEditing ? (
            <>
              <Button 
                onClick={handleCancel}
                variant="outlined"
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
                Save
              </Button>
            </>
          ) : (
            <Button
              startIcon={<EditIcon />}
              onClick={handleEdit}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Edit
            </Button>
          )}
        </Box>

        {/* Add hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="audio/*"
          onChange={handleFileSelect}
        />

        {/* Audio Player Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={handlePlayPause}
                  disabled={isLoading || !audioUrl || !audioElement}
                  color="primary"
                  sx={{ 
                    width: 56, 
                    height: 56,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" noWrap>
                    {isEditing ? (
                      <TextField
                        value={editedSong.title}
                        onChange={(e) => setEditedSong({ ...editedSong, title: e.target.value })}
                        fullWidth
                        variant="standard"
                        sx={{ 
                          '& .MuiInputBase-input': {
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                          }
                        }}
                      />
                    ) : (
                      song.title
                    )}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" noWrap>
                    {song.artist}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(currentTime)}
                </Typography>
                <Slider
                  value={currentTime / (duration || 1)}
                  onChange={handleProgressChange}
                  sx={{
                    color: 'primary.main',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      transition: '0.2s',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgb(117 117 117 / 16%)',
                      },
                    },
                    '& .MuiSlider-track': {
                      transition: '0.2s',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(duration)}
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    onClick={handleMuteToggle}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </IconButton>
                  <Fade in={showVolumeSlider}>
                    <Box
                      ref={volumeSliderRef}
                      sx={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'background.paper',
                        p: 1,
                        borderRadius: 1,
                        boxShadow: 1,
                        width: 100,
                      }}
                    >
                      <Slider
                        orientation="vertical"
                        value={volume}
                        onChange={handleVolumeChange}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ height: 100 }}
                      />
                    </Box>
                  </Fade>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default SongDetailsPanel; 