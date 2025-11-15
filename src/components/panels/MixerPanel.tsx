/**
 * Mixer Panel Component
 * 
 * Provides a simple in-browser mixer for stems with volume/pan controls,
 * play/pause, and export functionality
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Button,
  IconButton,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAudioMixer } from '../../hooks/useAudioMixer';
import { Stem, MixdownExportSettings } from '../../types/stem';
import { Song } from '../../types/song';
import { formatDuration } from '../../utils/formatters';

interface MixerPanelProps {
  /** Song containing stems */
  song: Song;
  
  /** Callback when panel is closed */
  onClose: () => void;
  
  /** Callback when mixdown is exported */
  onExport?: (blob: Blob, filename: string) => void;
}

const MixerPanel: React.FC<MixerPanelProps> = ({ song, onClose, onExport }) => {
  const theme = useTheme();
  const stems = song.stems || [];
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState<MixdownExportSettings>({
    format: 'wav',
    sampleRate: 44100,
    bitDepth: 24,
    quality: 320,
    normalize: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const mixer = useAudioMixer({
    stems,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mixer.cleanup();
    };
  }, [mixer]);

  const handlePlay = async () => {
    try {
      await mixer.play();
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  const handlePause = () => {
    mixer.pause();
  };

  const handleStop = () => {
    mixer.stop();
  };

  const handleVolumeChange = (stemId: string, volume: number) => {
    mixer.updateSettings(stemId, { volume: volume / 100 });
  };

  const handlePanChange = (stemId: string, pan: number) => {
    mixer.updateSettings(stemId, { pan: pan / 100 });
  };

  const handleMuteToggle = (stemId: string) => {
    const settings = mixer.getSettings(stemId);
    if (settings) {
      mixer.updateSettings(stemId, { muted: !settings.muted });
    }
  };

  const handleSoloToggle = (stemId: string) => {
    const settings = mixer.getSettings(stemId);
    if (settings) {
      mixer.updateSettings(stemId, { solo: !settings.solo });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const mixedBuffer = await mixer.getMixedBuffer();
      if (!mixedBuffer) {
        throw new Error('Failed to create mixed buffer');
      }

      // Convert AudioBuffer to WAV blob
      const wavBlob = audioBufferToWav(mixedBuffer, exportSettings);
      const filename = `${song.title || 'mixdown'}_${Date.now()}.${exportSettings.format}`;
      
      if (onExport) {
        onExport(wavBlob, filename);
      } else {
        // Download directly
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export mixdown:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer, settings: MixdownExportSettings): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = settings.bitDepth ? settings.bitDepth / 8 : 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample));
        
        if (bytesPerSample === 1) {
          view.setInt8(offset, intSample * 0x7F);
        } else if (bytesPerSample === 2) {
          view.setInt16(offset, intSample * 0x7FFF, true);
        } else if (bytesPerSample === 3) {
          const int24 = Math.floor(intSample * 0x7FFFFF);
          view.setUint8(offset, int24 & 0xFF);
          view.setUint8(offset + 1, (int24 >> 8) & 0xFF);
          view.setUint8(offset + 2, (int24 >> 16) & 0xFF);
        } else {
          view.setInt32(offset, intSample * 0x7FFFFFFF, true);
        }
        
        offset += bytesPerSample;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  if (stems.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Stems Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This song doesn't have any stems yet. Upload stems to use the mixer.
        </Typography>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Mixer: {song.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setExportDialogOpen(true)} color="primary">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Transport Controls */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={mixer.isPlaying ? handlePause : handlePlay}
            color="primary"
            size="large"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {mixer.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={handleStop} disabled={!mixer.isPlaying}>
            <StopIcon />
          </IconButton>
          <Box sx={{ flex: 1, ml: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDuration(mixer.currentTime)} / {formatDuration(mixer.duration)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(mixer.currentTime / mixer.duration) * 100}
              sx={{ mt: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <VolumeUpIcon fontSize="small" />
            <Slider
              value={mixer.masterVolume * 100}
              onChange={(_, value) => mixer.setMasterVolume((value as number) / 100)}
              min={0}
              max={100}
              size="small"
            />
            <Typography variant="caption">{Math.round(mixer.masterVolume * 100)}%</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stem Controls */}
      <Grid container spacing={2}>
        {stems.map((stem) => {
          const stemSettings = mixer.getSettings(stem.id);
          if (!stemSettings) return null;

          return (
            <Grid item xs={12} sm={6} md={4} key={stem.id}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  {stem.label}
                </Typography>

                {/* Volume Control */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VolumeUpIcon fontSize="small" color="action" />
                    <Typography variant="caption">Volume</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleMuteToggle(stem.id)}
                      color={stemSettings.muted ? 'error' : 'default'}
                    >
                      {stemSettings.muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                  <Slider
                    value={stemSettings.volume * 100}
                    onChange={(_, value) => handleVolumeChange(stem.id, value as number)}
                    min={0}
                    max={100}
                    disabled={stemSettings.muted}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(stemSettings.volume * 100)}%
                  </Typography>
                </Box>

                {/* Pan Control */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" gutterBottom display="block">
                    Pan
                  </Typography>
                  <Slider
                    value={stemSettings.pan * 100}
                    onChange={(_, value) => handlePanChange(stem.id, value as number)}
                    min={-100}
                    max={100}
                    marks={[
                      { value: -100, label: 'L' },
                      { value: 0, label: 'C' },
                      { value: 100, label: 'R' },
                    ]}
                  />
                </Box>

                {/* Mute/Solo */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={stemSettings.muted}
                        onChange={() => handleMuteToggle(stem.id)}
                      />
                    }
                    label="Mute"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={stemSettings.solo}
                        onChange={() => handleSoloToggle(stem.id)}
                      />
                    }
                    label="Solo"
                  />
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Mixdown</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Format"
                value={exportSettings.format}
                onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value as 'wav' | 'mp3' | 'flac' })}
              >
                <MenuItem value="wav">WAV</MenuItem>
                <MenuItem value="mp3">MP3</MenuItem>
                <MenuItem value="flac">FLAC</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Sample Rate"
                value={exportSettings.sampleRate}
                onChange={(e) => setExportSettings({ ...exportSettings, sampleRate: parseInt(e.target.value) })}
              />
            </Grid>
            {exportSettings.format === 'wav' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bit Depth"
                  value={exportSettings.bitDepth}
                  onChange={(e) => setExportSettings({ ...exportSettings, bitDepth: parseInt(e.target.value) })}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportSettings.normalize}
                    onChange={(e) => setExportSettings({ ...exportSettings, normalize: e.target.checked })}
                  />
                }
                label="Normalize Output"
              />
            </Grid>
          </Grid>
          {isExporting && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Exporting mixdown...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} variant="contained" disabled={isExporting}>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MixerPanel;

