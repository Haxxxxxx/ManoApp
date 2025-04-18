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

  useEffect(() => {
    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [song]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if this is a local file
      if (song.metadata?.source === 'local') {
        if (song.file) {
          // Create an object URL from the File object
          const url = URL.createObjectURL(song.file);
          setAudioUrl(url);
          audioRef.current = new Audio(url);
          audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.addEventListener('ended', handleEnded);
          setIsLoading(false);
          return;
        }
        
        // If we have a filePath for a local file, try to use it directly
        if (song.filePath && song.filePath.startsWith('blob:')) {
          setAudioUrl(song.filePath);
          audioRef.current = new Audio(song.filePath);
          audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.addEventListener('ended', handleEnded);
          setIsLoading(false);
          return;
        }

        // If we have a filePath that doesn't start with blob:, it might be a local file path
        if (song.filePath && !song.filePath.startsWith('blob:')) {
          try {
            // Try to fetch the file directly
            const response = await fetch(song.filePath);
            if (!response.ok) throw new Error('Failed to load audio file');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            audioRef.current = new Audio(url);
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('ended', handleEnded);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error loading local file:', error);
            setError('Failed to load local audio file');
          }
        }
      }

      // If we get here, we couldn't load the audio file
      setError('No audio file available');
    } catch (error) {
      console.error('Error loading audio:', error);
      setError('Failed to load audio file');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
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
    <Box sx={{ 
      p: 2, 
      height: '100%', 
      marginTop:'20px',
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: 1,
      boxShadow: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        borderBottom: 1,
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Song Details</Typography>
        <IconButton onClick={onClose} color="primary">
          <CloseIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
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
                disabled={isLoading || !audioUrl}
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
    </Box>
  );
};

export default SongDetailsPanel; 