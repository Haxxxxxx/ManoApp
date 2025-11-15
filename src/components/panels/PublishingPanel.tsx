import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, TextField, FormControlLabel, Checkbox, CircularProgress, Alert, Divider, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, Radio, FormControl, FormLabel } from '@mui/material';
import { useState } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Trip } from '../../types/trip';
import { Song } from '../../types/song';
import { exportForSoundCloud, exportMixtapeForSoundCloud, exportAlbum } from '../../services/exportService';
import { publishToSoundCloud } from '../../services/soundcloudService';
import { getErrorMessage } from '../../utils/storageHelpers';
import { publishToSpotify } from '../../services/spotifyService';
import LocalFileBrowser from '../LocalFileBrowser';
import { LocalFile, convertLocalFileToSong } from '../../services/localFileService';
import AlbumIcon from '@mui/icons-material/Album';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { AlbumSong } from '../../types/album';
import { useAuth } from '../../contexts/AuthContext';

interface PublishingPanelProps {
  trip: Trip;
  songs: Song[];
  platform: 'spotify' | 'soundcloud';
  onClose: () => void;
}

const PublishingPanel = ({ trip, songs, platform, onClose }: PublishingPanelProps) => {
  const { currentUser } = useAuth();
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
    publishType: 'album' as 'album' | 'single' | 'mixtape',
    selectedPlatforms: [platform],
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
      const selectedSongs = songs.filter(song => publishingData.selectedSongs.includes(song.id));
      
      if (platform === 'soundcloud') {
        if (publishingData.publishType === 'album') {
          await publishToSoundCloud({
            title: publishingData.title,
            description: publishingData.description,
            genre: selectedSongs[0]?.metadata?.genre?.[0] || '',
            tags: publishingData.tags.split(',').map(tag => tag.trim()),
            fileUrl: selectedSongs[0].filePath || '',
            isPrivate: publishingData.isPrivate,
            downloadable: publishingData.allowDownloads
          });
        } else {
          // Handle mixtape publishing
          await exportMixtapeForSoundCloud(
            selectedSongs.map(song => ({
              ...song,
              duration: typeof song.duration === 'number' ? song.duration.toString() : song.duration
            })),
            publishingData.title,
            publishingData.description,
            publishingData.tags.split(',').map(tag => tag.trim())
          );
        }
      } else if (platform === 'spotify') {
        await publishToSpotify({
          name: publishingData.title,
          description: publishingData.description,
          releaseDate: publishingData.releaseDate,
          isExplicit: publishingData.isExplicit,
          songs: selectedSongs.map(song => ({
            title: song.title,
            artist: song.artist,
            duration: typeof song.duration === 'number' ? song.duration.toString() : song.duration,
            fileUrl: song.filePath || ''
          }))
        });
      }
      
      setSuccess(`Successfully published to ${platform}`);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to publish'));
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedSongs = songs.filter(song => publishingData.selectedSongs.includes(song.id));
      
      if (publishingData.publishType === 'album') {
        const albumSongs: AlbumSong[] = selectedSongs.map(song => {
          // Convert duration to number using utility function
          const durationInSeconds = parseDurationToSeconds(song.duration);

          return {
            id: song.id,
            title: song.title,
            artist: song.artist,
            duration: durationInSeconds,
            filePath: song.filePath,
            metadata: {
              source: song.metadata?.source === 'local' ? 'local' : 
                     song.metadata?.source === 'remote' ? 'firebase' : 'project',
              projectName: trip.name,
              bpm: song.metadata?.bpm,
              key: song.metadata?.key,
              genre: song.metadata?.genre,
              tags: song.metadata?.tags,
              releaseDate: song.metadata?.releaseDate,
              featuring: song.metadata?.featuring,
              lyrics: song.metadata?.lyrics,
              videoUrl: song.metadata?.videoUrl,
              filePath: song.filePath
            }
          };
        });

        const now = new Date().toISOString();
        await exportAlbum({
          id: `album-${Date.now()}`,
          userId: currentUser?.uid || 'anonymous',
          title: publishingData.title,
          artist: selectedSongs[0]?.artist || '',
          releaseDate: publishingData.releaseDate,
          genre: selectedSongs[0]?.metadata?.genre?.[0] || '',
          description: publishingData.description,
          songs: albumSongs,
          selectedPlatforms: publishingData.selectedPlatforms,
          coverImage: selectedSongs[0]?.imagePath || null,
          createdAt: now,
          updatedAt: now
        });
      } else if (publishingData.publishType === 'mixtape') {
        await exportMixtapeForSoundCloud(
          selectedSongs.map(song => ({
            ...song,
            duration: typeof song.duration === 'number' ? song.duration.toString() : song.duration
          })),
          publishingData.title,
          publishingData.description,
          publishingData.tags.split(',').map(tag => tag.trim())
        );
      } else {
        // Single song export
        if (selectedSongs.length === 1) {
          await exportForSoundCloud({
            ...selectedSongs[0],
            duration: typeof selectedSongs[0].duration === 'number' ? selectedSongs[0].duration.toString() : selectedSongs[0].duration
          });
        } else {
          throw new Error('Please select exactly one song for single export');
        }
      }
      
      setSuccess('Export completed successfully');
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to export'));
    } finally {
      setExporting(false);
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
      setError(getErrorMessage(err, 'Failed to export song'));
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
      setError(getErrorMessage(err, 'Failed to export mixtape'));
    } finally {
      setExporting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Select Content Type</Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend">Publish as</FormLabel>
              <RadioGroup
                value={publishingData.publishType}
                onChange={(e) => setPublishingData({ ...publishingData, publishType: e.target.value as 'album' | 'single' | 'mixtape' })}
              >
                <FormControlLabel 
                  value="album" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AlbumIcon />
                      <Typography>Album</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="single" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MusicNoteIcon />
                      <Typography>Single</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="mixtape" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MusicNoteIcon />
                      <Typography>Mixtape</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Select Songs</Typography>
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
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Spotify Settings</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={publishingData.isExplicit}
                  onChange={(e) => setPublishingData({ ...publishingData, isExplicit: e.target.checked })}
                />
              }
              label="Explicit Content"
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>Review Your Release</Typography>
            <Typography><strong>Title:</strong> {publishingData.title}</Typography>
            <Typography><strong>Description:</strong> {publishingData.description}</Typography>
            <Typography><strong>Release Date:</strong> {publishingData.releaseDate}</Typography>
            <Typography><strong>Type:</strong> {publishingData.publishType}</Typography>
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                onClick={handleExport}
                disabled={exporting || publishing}
              >
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                variant="contained"
                startIcon={publishing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={handlePublish}
                disabled={publishing || exporting}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </Button>
            </Box>
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