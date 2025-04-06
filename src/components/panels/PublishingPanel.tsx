import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, TextField, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { useState } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Trip, Song } from '../../types';

interface PublishingPanelProps {
  trip: Trip;
  songs: Song[];
  platform: 'spotify' | 'soundcloud';
  onClose: () => void;
}

const PublishingPanel = ({ trip, songs, platform, onClose }: PublishingPanelProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishingData, setPublishingData] = useState({
    title: trip.name,
    description: trip.description || '',
    isExplicit: false,
    selectedSongs: songs.map(song => song.id),
    releaseDate: new Date().toISOString().split('T')[0],
  });

  const steps = [
    'Select Content',
    'Basic Information',
    'Platform Settings',
    'Review & Publish'
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePublish = async () => {
    setPublishing(true);
    // Implement publishing logic here
    setTimeout(() => {
      setPublishing(false);
      onClose();
    }, 2000);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Select Songs to Publish</Typography>
            {songs.map((song) => (
              <FormControlLabel
                key={song.id}
                control={
                  <Checkbox
                    checked={publishingData.selectedSongs.includes(song.id)}
                    onChange={(e) => {
                      const newSelected = e.target.checked
                        ? [...publishingData.selectedSongs, song.id]
                        : publishingData.selectedSongs.filter(id => id !== song.id);
                      setPublishingData({ ...publishingData, selectedSongs: newSelected });
                    }}
                  />
                }
                label={`${song.title} - ${song.duration}`}
              />
            ))}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <TextField
              label="Release Title"
              value={publishingData.title}
              onChange={(e) => setPublishingData({ ...publishingData, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={publishingData.description}
              onChange={(e) => setPublishingData({ ...publishingData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Release Date"
              type="date"
              value={publishingData.releaseDate}
              onChange={(e) => setPublishingData({ ...publishingData, releaseDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={publishingData.isExplicit}
                  onChange={(e) => setPublishingData({ ...publishingData, isExplicit: e.target.checked })}
                />
              }
              label="Contains Explicit Content"
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              {platform === 'spotify' ? 'Spotify Settings' : 'SoundCloud Settings'}
            </Typography>
            {/* Add platform-specific settings here */}
            <Typography color="text.secondary">
              Configure your {platform} specific settings here.
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Review Your Release</Typography>
            <Typography><strong>Title:</strong> {publishingData.title}</Typography>
            <Typography><strong>Description:</strong> {publishingData.description}</Typography>
            <Typography><strong>Release Date:</strong> {publishingData.releaseDate}</Typography>
            <Typography><strong>Selected Songs:</strong> {publishingData.selectedSongs.length}</Typography>
            <Typography><strong>Platform:</strong> {platform.charAt(0).toUpperCase() + platform.slice(1)}</Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>
          Publish to {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
          >
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button
              variant="outlined"
              onClick={handleBack}
            >
              Back
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              startIcon={publishing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default PublishingPanel; 