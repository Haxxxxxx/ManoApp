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
  useTheme
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
import { Song } from '../../types/song';
import { updateSong, getSong } from '../../services/firebaseService';
import { getAudioUrl, uploadCoverArt } from '../../services/storageService';

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

  useEffect(() => {
    // Create new audio element
    const newAudio = new Audio();
    
    // Function to set audio source
    const initializeAudioSource = async () => {
      console.log('Initializing audio source');
      
      // First check if we have a stored blob URL
      const storedBlobUrl = getBlobUrl(song.id);
      if (storedBlobUrl) {
        console.log('Using stored blob URL:', storedBlobUrl);
        newAudio.src = storedBlobUrl;
        newAudio.load();
        setAudioUrl(storedBlobUrl);
        blobUrlRef.current = storedBlobUrl;
        return;
      }
      
      // Check if we have a valid file path
      if (song.filePath) {
        if (song.filePath.startsWith('blob:')) {
          console.log('Using existing blob URL:', song.filePath);
          newAudio.src = song.filePath;
          newAudio.load();
          setAudioUrl(song.filePath);
          blobUrlRef.current = song.filePath;
          return;
        } else {
          console.log('Using file path:', song.filePath);
          newAudio.src = song.filePath;
          newAudio.load();
          setAudioUrl(song.filePath);
          return;
        }
      }
      
      // Try to get file info from localStorage
      const fileInfo = getFileDataFromLocalStorage();
      if (fileInfo) {
        console.log('Found file info in localStorage:', fileInfo);
        setError('Please select the audio file again to play this song');
        return;
      }
      
      // If we have a download URL, use that
      if (song.downloadUrl) {
        console.log('Using download URL:', song.downloadUrl);
        newAudio.src = song.downloadUrl;
        newAudio.load();
        setAudioUrl(song.downloadUrl);
        return;
      }
      
      console.error('No valid audio source found');
      setError('No valid audio source found');
    };

    // Add error handling
    const handleAudioError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      console.error('Audio error details:', {
        error: audioElement.error,
        currentSrc: audioElement.currentSrc,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState,
        paused: audioElement.paused,
        ended: audioElement.ended,
        duration: audioElement.duration,
        volume: audioElement.volume,
        muted: audioElement.muted,
        playbackRate: audioElement.playbackRate,
        defaultMuted: audioElement.defaultMuted,
        defaultPlaybackRate: audioElement.defaultPlaybackRate,
        errorCode: audioElement.error?.code,
        errorMessage: audioElement.error?.message
      });

      // Clear the current source before trying to reinitialize
      audioElement.removeAttribute('src');
      audioElement.load();

      let errorMessage = 'Failed to load audio file';
      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error occurred while loading the audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'The audio file is corrupted or uses an unsupported format';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'The audio format is not supported by your browser';
            break;
          default:
            errorMessage = `Audio error: ${audioElement.error.message || 'Unknown error'}`;
        }
      }
      
      setError(errorMessage);
      setIsPlaying(false);
    };

    // Set up audio event listeners
    newAudio.addEventListener('timeupdate', () => setCurrentTime(newAudio.currentTime));
    newAudio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded, duration:', newAudio.duration);
      setDuration(newAudio.duration);
      setError(null); // Clear any previous errors
    });
    newAudio.addEventListener('ended', () => {
      console.log('Audio playback ended');
      setIsPlaying(false);
    });
    newAudio.addEventListener('error', handleAudioError);
    newAudio.addEventListener('loadstart', () => console.log('Audio loading started'));
    newAudio.addEventListener('progress', () => console.log('Audio loading in progress'));
    newAudio.addEventListener('canplay', () => {
      console.log('Audio can play');
      setError(null); // Clear any previous errors
    });
    newAudio.addEventListener('canplaythrough', () => console.log('Audio can play through'));

    // Initialize the audio source
    initializeAudioSource();

    // Set the audio element
    setAudioElement(newAudio);

    // Clean up function
    return () => {
      console.log('Cleaning up audio element');
      if (newAudio) {
        newAudio.pause();
        newAudio.src = '';
        newAudio.load();
        newAudio.remove();
      }
      // Only revoke the blob URL when the component is unmounted
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        localStorage.removeItem(`blobUrl_${song.id}`);
      }
    };
  }, [song]);

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
    // Convert duration to string if it's a number
    const durationStr = duration?.toString() || '0';
    
    // If duration is already formatted (e.g., "3:45"), return as is
    if (durationStr.includes(':')) {
      return durationStr;
    }
    
    // Convert to number and format
    const seconds = Math.floor(parseFloat(durationStr));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: '16px 16px 0 0',
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
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
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
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h5" fontWeight="bold">
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
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>Artist</Typography>
                {isEditing ? (
                  <TextField
                    value={editedSong.artist}
                    onChange={(e) => setEditedSong({ ...editedSong, artist: e.target.value })}
                    fullWidth
                    variant="standard"
                    sx={{ 
                      '& .MuiInputBase-input': {
                        fontSize: '1.1rem'
                      }
                    }}
                  />
                ) : (
                  <Typography variant="h6">{song.artist}</Typography>
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
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>Duration</Typography>
                <Typography variant="h6">{formatDuration(song.duration)}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: 2
            }}
          >
            <TextField
              label="Lyrics"
              multiline
              rows={15}
              fullWidth
              value={editedSong.metadata?.lyrics || ''}
              onChange={handleLyricsChange}
              disabled={!isEditing}
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
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
                <Typography variant="h6" gutterBottom fontWeight="bold">Images</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {editedSong.imagePath && (
                    <Card sx={{ maxWidth: 345, borderRadius: 2, overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={editedSong.imagePath}
                        alt={editedSong.title}
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Cover Art</Typography>
                      </CardContent>
                    </Card>
                  )}
                  {isEditing && (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<ImageIcon />}
                      sx={{ 
                        height: 200, 
                        width: 200, 
                        borderStyle: 'dashed',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 40 }} />
                      <Typography>Upload Image</Typography>
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
                <Typography variant="h6" gutterBottom fontWeight="bold">Videos</Typography>
                <TextField
                  label="Video URL"
                  fullWidth
                  value={editedSong.metadata?.videoUrl || ''}
                  onChange={handleVideoUrlChange}
                  disabled={!isEditing}
                  placeholder="Enter YouTube or Vimeo URL"
                  variant="outlined"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Paper>
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
      </Paper>
    </Box>
  );
};

export default SongDetailsPanel; 