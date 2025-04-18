import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, TextField, FormControlLabel, Checkbox, CircularProgress, Alert, Divider, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Trip } from '../../types/trip';
import { Song } from '../../types/song';
import { exportForSoundCloud, exportMixtapeForSoundCloud } from '../../services/exportService';
import LocalFileBrowser from '../LocalFileBrowser';
import { LocalFile, convertLocalFileToSong } from '../../services/localFileService';

interface PublishingPanelProps {
  trip: Trip;
  songs: Song[];
  platform: 'spotify' | 'soundcloud';
  onClose: () => void;
}

const PublishingPanel = ({ trip, songs, platform, onClose }: PublishingPanelProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishingData, setPublishingData] = useState({
    title: trip.name,
    description: trip.description || '',
    isExplicit: false,
    selectedSongs: songs.map(song => song.id),
    releaseDate: new Date().toISOString().split('T')[0],
    isPrivate: false,
    allowDownloads: true,
    tags: trip.tags?.join(', ') || '',
  });

  // Mixtape export fields
  const [mixtapeTitle, setMixtapeTitle] = useState('');
  const [mixtapeDescription, setMixtapeDescription] = useState('');
  const [mixtapeTags, setMixtapeTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const [showLocalFileBrowser, setShowLocalFileBrowser] = useState(false);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);

  const steps = platform === 'soundcloud' 
    ? ['Select Content', 'Basic Information', 'SoundCloud Settings', 'Export & Publish']
    : ['Select Content', 'Basic Information', 'Platform Settings', 'Review & Publish'];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Implement publishing logic here
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Successfully published to ' + platform);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !mixtapeTags.includes(newTag.trim())) {
      setMixtapeTags([...mixtapeTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMixtapeTags(mixtapeTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleLocalFilesSelected = (files: LocalFile[]) => {
    const newSongs = files.map(convertLocalFileToSong);
    setLocalSongs(prev => [...prev, ...newSongs]);
    setShowLocalFileBrowser(false);
  };

  const handleExportSingle = async () => {
    if (publishingData.selectedSongs.length !== 1) {
      setError('Please select exactly one song to export');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      await exportForSoundCloud(songs.find(song => song.id === publishingData.selectedSongs[0])!);
      setSuccess('Song exported successfully!');
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export song');
    } finally {
      setExporting(false);
    }
  };

  const handleExportMixtape = async () => {
    if (publishingData.selectedSongs.length === 0) {
      setError('Please select at least one song to export');
      return;
    }

    if (!mixtapeTitle.trim()) {
      setError('Please enter a mixtape title');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      await exportMixtapeForSoundCloud(
        songs.filter(song => publishingData.selectedSongs.includes(song.id)),
        mixtapeTitle,
        mixtapeDescription,
        mixtapeTags
      );
      setSuccess('Mixtape exported successfully!');
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export mixtape');
    } finally {
      setExporting(false);
    }
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
        if (platform === 'soundcloud') {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>SoundCloud Settings</Typography>
              <TextField
                label="Tags"
                value={publishingData.tags}
                onChange={(e) => setPublishingData({ ...publishingData, tags: e.target.value })}
                fullWidth
                helperText="Separate tags with commas"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={publishingData.isPrivate}
                    onChange={(e) => setPublishingData({ ...publishingData, isPrivate: e.target.checked })}
                  />
                }
                label="Private Track"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={publishingData.allowDownloads}
                    onChange={(e) => setPublishingData({ ...publishingData, allowDownloads: e.target.checked })}
                  />
                }
                label="Allow Downloads"
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Export for SoundCloud</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Click the button below to download your mixtape in the correct format for SoundCloud.
                This will create a zip file containing all selected songs with proper metadata.
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
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Configure Export
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (publishingData.selectedSongs.length === 1) {
                        handleNext();
                      } else {
                        setError('Please select exactly one song to export individually');
                      }
                    }}
                    disabled={exporting}
                  >
                    Export Single Song
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (publishingData.selectedSongs.length > 0) {
                        handleNext();
                      } else {
                        setError('Please select at least one song to export as a mixtape');
                      }
                    }}
                    disabled={exporting}
                  >
                    Export as Mixtape
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowLocalFileBrowser(true)}
                    disabled={exporting}
                  >
                    Add Local Files
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        } else {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>
                {platform === 'spotify' ? 'Spotify Settings' : 'Platform Settings'}
              </Typography>
              {/* Add platform-specific settings here */}
              <Typography color="text.secondary">
                Configure your {platform} specific settings here.
              </Typography>
            </Box>
          );
        }

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Review Your Release</Typography>
            <Typography><strong>Title:</strong> {publishingData.title}</Typography>
            <Typography><strong>Description:</strong> {publishingData.description}</Typography>
            <Typography><strong>Release Date:</strong> {publishingData.releaseDate}</Typography>
            <Typography><strong>Selected Songs:</strong> {publishingData.selectedSongs.length}</Typography>
            <Typography><strong>Platform:</strong> {platform.charAt(0).toUpperCase() + platform.slice(1)}</Typography>
            
            {platform === 'soundcloud' && (
              <>
                <Typography><strong>Private:</strong> {publishingData.isPrivate ? 'Yes' : 'No'}</Typography>
                <Typography><strong>Allow Downloads:</strong> {publishingData.allowDownloads ? 'Yes' : 'No'}</Typography>
                <Typography><strong>Tags:</strong> {publishingData.tags || 'None'}</Typography>
              </>
            )}
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

      <Dialog
        open={showLocalFileBrowser}
        onClose={() => setShowLocalFileBrowser(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Local Audio Files</DialogTitle>
        <DialogContent>
          <LocalFileBrowser
            onFilesSelected={handleLocalFilesSelected}
            onClose={() => setShowLocalFileBrowser(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PublishingPanel; 