import { Box, Typography, Paper, FormControl, FormControlLabel, RadioGroup, Radio, TextField, Button, Divider, Switch } from '@mui/material';
import { useState } from 'react';

interface ExportSettingsPanelProps {
  onClose: () => void;
}

const ExportSettingsPanel = ({ onClose }: ExportSettingsPanelProps) => {
  const [settings, setSettings] = useState({
    format: 'wav',
    sampleRate: '44100',
    bitDepth: '24',
    normalizeAudio: true,
    includeMetadata: true,
    exportSeparately: false,
    outputFolder: '',
  });

  const handleExport = () => {
    // Implement export logic here
    onClose();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Export Settings</Typography>

        {/* Audio Format */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Audio Format</Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
            >
              <FormControlLabel value="wav" control={<Radio />} label="WAV" />
              <FormControlLabel value="mp3" control={<Radio />} label="MP3" />
              <FormControlLabel value="flac" control={<Radio />} label="FLAC" />
              <FormControlLabel value="aiff" control={<Radio />} label="AIFF" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quality Settings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Quality Settings</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <TextField
                select
                label="Sample Rate"
                value={settings.sampleRate}
                onChange={(e) => setSettings({ ...settings, sampleRate: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="96000">96 kHz</option>
                <option value="192000">192 kHz</option>
              </TextField>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <TextField
                select
                label="Bit Depth"
                value={settings.bitDepth}
                onChange={(e) => setSettings({ ...settings, bitDepth: e.target.value })}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="16">16-bit</option>
                <option value="24">24-bit</option>
                <option value="32">32-bit float</option>
              </TextField>
            </FormControl>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Additional Options */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Additional Options</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.normalizeAudio}
                  onChange={(e) => setSettings({ ...settings, normalizeAudio: e.target.checked })}
                />
              }
              label="Normalize Audio"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.includeMetadata}
                  onChange={(e) => setSettings({ ...settings, includeMetadata: e.target.checked })}
                />
              }
              label="Include Metadata"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.exportSeparately}
                  onChange={(e) => setSettings({ ...settings, exportSeparately: e.target.checked })}
                />
              }
              label="Export Songs Separately"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Output Location */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Output Location</Typography>
          <TextField
            fullWidth
            label="Output Folder"
            value={settings.outputFolder}
            onChange={(e) => setSettings({ ...settings, outputFolder: e.target.value })}
            placeholder="Choose output folder..."
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleExport}>
            Export
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ExportSettingsPanel; 