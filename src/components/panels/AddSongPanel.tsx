import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  InputAdornment,
  Tooltip,
  Autocomplete,
  Stack,
  useTheme,
  alpha,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { createSong, getSong } from '../../services/firebaseService';
import { getErrorMessage } from '../../utils/storageHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { Song } from '../../types/song';
import { uploadMusicFile } from '../../services/storageService';
import { audioService } from '../../services/audioService';
import type { SongMetadata } from '../../types/song';
import { FILE_SIZE_LIMITS, SUGGESTED_TAGS } from '../../utils/constants';
import { validateAudioFile } from '../../utils/fileValidation';
import { removeFileExtension, formatDuration } from '../../utils/formatters';
import { validateTitle, validateArtist } from '../../utils/validation';
import { isFeatureEnabled } from '../../config/features';
import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../../firebase/config';
import AIMetadataSuggestions from './AIMetadataSuggestions';
import { AIMetadata, ApplyAISuggestionsOptions } from '../../types/ai';
import { updateSong } from '../../services/firebaseService';
import { useToast } from '../../hooks/useToast';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleError, setTitleError] = useState<string>('');
  const [artistError, setArtistError] = useState<string>('');
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [createdSong, setCreatedSong] = useState<Song | null>(null);
  const { showSuccess, showError, ToastComponent } = useToast();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const validateFile = (file: File) => {
    return validateAudioFile(file, FILE_SIZE_LIMITS.AUDIO_UPLOAD);
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
      setTitle(removeFileExtension(file.name));
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
    // Validate form before submission
    const titleValidation = validateTitle(title);
    const artistValidation = validateArtist(artist);
    
    if (titleValidation.error) {
      setTitleError(titleValidation.message);
      return;
    }
    if (artistValidation.error) {
      setArtistError(artistValidation.message);
      return;
    }
    
    setTitleError('');
    setArtistError('');
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
        duration: formatDuration(metadata.duration),
        filePath,
        userId: currentUser.uid,
        metadata: cleanMetadata
      });
      
      setCreatedSong(newSong);
      setSuccess('Song added successfully!');

      if (onSongCreated) {
        onSongCreated(newSong);
      }

      // Generate AI metadata if feature is enabled
      if (isFeatureEnabled('aiMetadata') && newSong.id) {
        setAiLoading(true);
        try {
          if (functions) {
            const aiMetadataFunction = httpsCallable<{ assetId: string; filePath?: string }, { success: boolean; metadata: AIMetadata }>(
              functions as Functions,
              'aiMetadata'
            );
            const result = await aiMetadataFunction({
              assetId: newSong.id,
              filePath: filePath,
            });

            if (result.data.success && result.data.metadata) {
              setAiMetadata(result.data.metadata);
              // Refresh song to get updated metadata
              const updatedSong = await getSong(newSong.id);
              if (updatedSong) {
                setCreatedSong(updatedSong);
              }
            }
          }
        } catch (aiError) {
          // AI metadata generation failed, but song creation succeeded
          console.error('Failed to generate AI metadata:', aiError);
          // Don't show error to user - AI is optional
        } finally {
          setAiLoading(false);
        }
          } else {
            // If AI feature is disabled, close after delay
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
            closeTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 1500);
          }

    } catch (error) {
      setError(getErrorMessage(error, 'Failed to create song. Please try again.'));
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
            onChange={(e) => {
              const value = e.target.value;
              setTitle(value);
              const validation = validateTitle(value);
              setTitleError(validation.error ? validation.message : '');
            }}
            required
            error={!!titleError}
            helperText={titleError || 'Enter the name of your song'}
            placeholder="Enter your song title"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The name of your song. This is required and will be displayed in your library.">
                    <InfoIcon 
                      color="action" 
                      sx={{ 
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                      }} 
                    />
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
            onChange={(e) => {
              const value = e.target.value;
              setArtist(value);
              const validation = validateArtist(value);
              setArtistError(validation.error ? validation.message : '');
            }}
            required
            error={!!artistError}
            helperText={artistError || 'Enter the artist name for this song'}
            placeholder="Enter artist name"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="The artist name for this song. This is required and helps organize your music library.">
                    <InfoIcon 
                      color="action" 
                      sx={{ 
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        },
                      }} 
                    />
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
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0px 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                    '& .MuiChip-deleteIcon': {
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: 'error.main',
                        transform: 'scale(1.2)',
                      },
                    },
                  }}
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

        {/* AI Metadata Suggestions */}
        {createdSong && aiMetadata && (
          <Grid item xs={12}>
            <AIMetadataSuggestions
              aiMetadata={aiMetadata}
              song={createdSong}
              onApply={async (options: ApplyAISuggestionsOptions) => {
                if (!createdSong) return;

                try {
                  const updateData: Partial<Song> = {
                    metadata: {
                      ...createdSong.metadata,
                    },
                  };

                  // Apply selected tags
                  if (options.tagsToApply && options.tagsToApply.length > 0) {
                    const existingTags = createdSong.metadata?.tags || [];
                    const newTags = [...new Set([...existingTags, ...options.tagsToApply])];
                    updateData.metadata!.tags = newTags;
                    updateData.metadata!.suggestedTags = options.tagsToApply;
                  } else if (options.applyAll && aiMetadata.suggestedTags) {
                    const allTags = aiMetadata.suggestedTags.map(t => t.tag);
                    const existingTags = createdSong.metadata?.tags || [];
                    const newTags = [...new Set([...existingTags, ...allTags])];
                    updateData.metadata!.tags = newTags;
                    updateData.metadata!.suggestedTags = allTags;
                  }

                  // Apply BPM
                  if (options.applyBPM && aiMetadata.bpm) {
                    updateData.metadata!.bpm = aiMetadata.bpm.bpm;
                  }

                  // Apply Key
                  if (options.applyKey && aiMetadata.key) {
                    updateData.metadata!.key = aiMetadata.key.key;
                  }

                  // Store AI metadata
                  updateData.metadata!.aiMetadata = aiMetadata;

                  await updateSong(createdSong.id, updateData);
                  
                  // Refresh song
                  const updatedSong = await getSong(createdSong.id);
                  if (updatedSong) {
                    setCreatedSong(updatedSong);
                  }

                  setAiApplied(true);
                  showSuccess('AI suggestions applied successfully!');
                } catch (error) {
                  showError('Failed to apply AI suggestions. Please try again.');
                  throw error;
                }
              }}
              onUndo={async () => {
                if (!createdSong) return;

                try {
                  // Remove AI-applied metadata
                  const updateData: Partial<Song> = {
                    metadata: {
                      ...createdSong.metadata,
                      aiMetadata: undefined,
                      suggestedTags: undefined,
                    },
                  };

                  // Remove AI-suggested tags from tags array
                  if (createdSong.metadata?.suggestedTags) {
                    const existingTags = createdSong.metadata?.tags || [];
                    const suggestedTags = createdSong.metadata.suggestedTags;
                    updateData.metadata!.tags = existingTags.filter(
                      tag => !suggestedTags.includes(tag)
                    );
                  }

                  await updateSong(createdSong.id, updateData);
                  
                  // Refresh song
                  const updatedSong = await getSong(createdSong.id);
                  if (updatedSong) {
                    setCreatedSong(updatedSong);
                  }

                  setAiApplied(false);
                  showSuccess('AI suggestions undone successfully!');
                } catch (error) {
                  showError('Failed to undo AI suggestions. Please try again.');
                  throw error;
                }
              }}
              applied={aiApplied}
              loading={aiLoading}
            />
          </Grid>
        )}
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

      {/* Toast Component */}
      <ToastComponent />
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
        {!aiMetadata && !aiLoading && createdSong && (
          <DialogActions>
            <Button onClick={onClose} variant="contained">
              Done
            </Button>
          </DialogActions>
        )}
      </Dialog>
    );
  }

  return renderContent();
};

export default AddSongPanel; 