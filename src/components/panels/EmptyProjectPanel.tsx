import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, MusicNote as MusicNoteIcon } from '@mui/icons-material';
import { storageService } from '../../services/storageService';
import { createSong } from '../../services/firebaseService';
import { Song } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EmptyProjectPanelProps {
  onClose: () => void;
  tripId: string;
}

const EmptyProjectPanel: React.FC<EmptyProjectPanelProps> = ({ onClose, tripId }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState('');
  const [style, setStyle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [feats, setFeats] = useState<string[]>([]);
  const [newFeat, setNewFeat] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    audio?: number;
    image?: number;
    video?: number;
  }>({});

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddFeat = () => {
    if (newFeat.trim() && !feats.includes(newFeat.trim())) {
      setFeats([...feats, newFeat.trim()]);
      setNewFeat('');
    }
  };

  const handleRemoveFeat = (featToRemove: string) => {
    setFeats(feats.filter(feat => feat !== featToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
        setSelectedFile(file);
      } else {
        setError('Please select an MP3 file');
      }
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      } else {
        setError('Please select an image file');
      }
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        setError('Please select a video file');
      }
    }
  };

  const handleCreateProject = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a project');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!tripId) {
      setError('No trip selected');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload files if they exist
      let audioPath = '';
      let imagePath = '';
      let videoPath = '';

      if (selectedFile) {
        const isLargeFile = selectedFile.size > 10 * 1024 * 1024; // 10MB
        audioPath = await storageService.uploadFile(
          selectedFile,
          `projects/${tripId}/audio/${selectedFile.name}`,
          (progress) => setUploadProgress(prev => ({ ...prev, audio: progress }))
        );
      }

      if (imageFile) {
        imagePath = await storageService.uploadFile(
          imageFile,
          `projects/${tripId}/images/${imageFile.name}`,
          (progress) => setUploadProgress(prev => ({ ...prev, image: progress }))
        );
      }

      if (videoFile) {
        const isLargeFile = videoFile.size > 10 * 1024 * 1024; // 10MB
        videoPath = await storageService.uploadFile(
          videoFile,
          `projects/${tripId}/videos/${videoFile.name}`,
          (progress) => setUploadProgress(prev => ({ ...prev, video: progress }))
        );
      }

      const newSong: Omit<Song, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        userId: currentUser.uid,
        tripId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filePath: audioPath,
        imagePath,
        videoPath,
        metadata: {
          lyrics,
          duration,
          style,
          tags,
          feats,
          genre: style ? [style] : [],
          bpm: 0,
          key: '',
          mood: '',
          instruments: [],
          language: '',
          year: new Date().getFullYear().toString(),
          isrc: '',
          upc: '',
          publisher: '',
          copyright: '',
          recordingLocation: '',
          recordingDate: new Date().toISOString(),
          producer: '',
          engineer: '',
          mixer: '',
          masteringEngineer: '',
          notes: description.trim()
        }
      };

      console.log('Creating project with data:', newSong);
      const createdSong = await createSong(tripId, newSong);
      console.log('Project created successfully:', createdSong);

      setSuccess('Project created successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
      setUploadProgress({});
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Create New Project
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            multiline
            rows={6}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Duration (mm:ss)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="00:00"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Style/Genre"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag"
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddTag}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Featured Artists
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {feats.map((feat) => (
                <Chip
                  key={feat}
                  label={feat}
                  onDelete={() => handleRemoveFeat(feat)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                value={newFeat}
                onChange={(e) => setNewFeat(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeat()}
                placeholder="Add featured artist"
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddFeat}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Media Files
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<MusicNoteIcon />}
          >
            Upload MP3
            <input
              type="file"
              hidden
              accept="audio/mpeg,audio/mp3"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
          {selectedFile && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Selected: {selectedFile.name}
              </Typography>
              {uploadProgress.audio !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.audio}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<AddIcon />}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
              ref={imageInputRef}
            />
          </Button>
          {imageFile && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Selected: {imageFile.name}
              </Typography>
              {uploadProgress.image !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.image}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<AddIcon />}
          >
            Upload Video
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={handleVideoChange}
              ref={videoInputRef}
            />
          </Button>
          {videoFile && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Selected: {videoFile.name}
              </Typography>
              {uploadProgress.video !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.video}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateProject}
              disabled={isCreating || !title.trim()}
              startIcon={isCreating ? <CircularProgress size={20} /> : null}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmptyProjectPanel; 