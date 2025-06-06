import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Tooltip,
  Autocomplete,
  Stack,
  useTheme,
  alpha,
  DialogTitle,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  MusicNote as MusicNoteIcon, 
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { createSong } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { Song } from '../../types/song';
import { uploadMusicFile } from '../../services/storageService';
import { audioService } from '../../services/audioService';
import type { SongMetadata } from '../../types/song';

// Suggested tags by category
const SUGGESTED_TAGS = {
  genres: ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Classical'],
  moods: ['Happy', 'Energetic', 'Calm', 'Melancholic', 'Dark', 'Upbeat'],
  types: ['Single', 'Album', 'EP', 'Demo', 'Remix', 'Cover'],
  status: ['In Progress', 'Draft', 'Final', 'Released']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
  'audio/aac', 'audio/ogg', 'audio/m4a'
];

interface AddSongPanelProps {
  onClose: () => void;
  tripId: string;
  onSongCreated?: (song: Song) => void;
  isDialog?: boolean;
}

const AddSongPanel: React.FC<AddSongPanelProps> = ({ 
  onClose, 
  tripId, 
  onSongCreated, 
  isDialog = false
}) => {
  const { currentUser, artistProfile } = useAuth();
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(artistProfile?.name || '');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File exceeds the maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    if (!ALLOWED_AUDIO_TYPES.includes(file.type) && 
        !file.name.toLowerCase().match(/\.(mp3|wav|flac|aac|ogg|m4a)$/)) {
      return `File type not supported. Please use MP3, WAV, FLAC, AAC, OGG, or M4A`;
    }
    
    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    }
    setError(null);
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
    },
    maxFiles: 1,
  });

  const handleAddTag = (tagToAdd: string) => {
    if (tagToAdd.trim() && !tags.includes(tagToAdd.trim())) {
      setTags([...tags, tagToAdd.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateSong = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a song');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!selectedFile) {
      setError('Please select an audio file');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Get audio metadata before upload
      const metadata = await audioService.getMetadata(selectedFile);
      
      // Upload the file first
      const filePath = await uploadMusicFile(selectedFile, tripId);
      
      // Create a clean metadata object without undefined values
      const cleanMetadata: Partial<SongMetadata> = {
        tags: tags,
        genre: [],
        source: 'upload' as const,
        _originalFileName: selectedFile.name,
        _fileSize: selectedFile.size,
        _lastModified: selectedFile.lastModified,
        lyrics: description
      };

      // Only add these if they exist
      if (metadata.bpm) cleanMetadata.bpm = metadata.bpm;
      if (metadata.key) cleanMetadata.key = metadata.key;
      
      // Create the song
      const newSong = await createSong(tripId, {
        title: title.trim(),
        artist: artist || artistProfile?.name || currentUser.email?.split('@')[0] || 'Unknown Artist',
        duration: audioService.formatDuration(metadata.duration),
        filePath,
        userId: currentUser.uid,
        metadata: cleanMetadata
      });
      
      setSuccess('Song added successfully!');

      if (onSongCreated) {
        onSongCreated(newSong);
      }

      // Wait a moment to show the success message before closing
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating song:', error);
      setError('Failed to create song. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderContent = () => (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Add New Song
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* File Upload Section */}
        <Grid item xs={12}>
          <Paper
            {...getRootProps()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
              border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            {selectedFile ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Selected file: {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click or drag to replace the file
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Drag & drop an audio file here, or click to select
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: MP3, WAV, FLAC, AAC, OGG, M4A (max 50MB)
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter your song title"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The name of your song">
                    <InfoIcon color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Enter artist name"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The artist name for this song">
                    <InfoIcon color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description/Lyrics"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            placeholder="Add description or lyrics (optional)"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Tags
              <Tooltip title="Add keywords to help organize your songs">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
            <Autocomplete
              freeSolo
              options={Object.values(SUGGESTED_TAGS).flat()}
              inputValue={newTag}
              onInputChange={(_, value) => setNewTag(value)}
              onChange={(_, value) => value && handleAddTag(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Add tag"
                  fullWidth
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                />
              )}
            />
            
            {/* Tag Categories */}
            <Box sx={{ mt: 2 }}>
              {Object.entries(SUGGESTED_TAGS).map(([category, categoryTags]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {categoryTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddTag(tag)}
                        disabled={tags.includes(tag)}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateSong}
          variant="contained"
          disabled={isCreating || !title.trim() || !selectedFile}
          startIcon={
            isCreating ? (
              <CircularProgress
                size={20}
                sx={{ color: 'inherit' }}
              />
            ) : (
              <AddIcon />
            )
          }
          sx={{ 
            minWidth: 150,
            position: 'relative'
          }}
        >
          {isCreating ? 'Adding Song...' : 'Add Song'}
        </Button>
      </Box>
    </Box>
  );

  if (isDialog) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogContent>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return renderContent();
};

export default AddSongPanel; 