import { Box, Typography, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, TextField, Button } from '@mui/material';

interface ExportSettingsPanelProps {
  onClose: () => void;
}

const ExportSettingsPanel = ({ onClose }: ExportSettingsPanelProps) => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Export Settings</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Audio Format Settings */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Audio Format</FormLabel>
            <RadioGroup defaultValue="wav">
              <FormControlLabel value="wav" control={<Radio />} label="WAV (Uncompressed)" />
              <FormControlLabel value="mp3" control={<Radio />} label="MP3" />
              <FormControlLabel value="flac" control={<Radio />} label="FLAC" />
            </RadioGroup>
          </FormControl>

          {/* Quality Settings */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Quality Settings</FormLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Sample Rate"
                select
                defaultValue="44100"
                SelectProps={{ native: true }}
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="96000">96 kHz</option>
              </TextField>
              
              <TextField
                label="Bit Depth"
                select
                defaultValue="16"
                SelectProps={{ native: true }}
              >
                <option value="16">16-bit</option>
                <option value="24">24-bit</option>
                <option value="32">32-bit float</option>
              </TextField>
            </Box>
          </FormControl>

          {/* Export Options */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Export Options</FormLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Export Directory"
                fullWidth
                defaultValue="C:/Music/Exports"
              />
              <TextField
                label="Filename Template"
                fullWidth
                defaultValue="{artist} - {title}"
                helperText="Available variables: {artist}, {title}, {bpm}, {key}"
              />
            </Box>
          </FormControl>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary">
              Save Settings
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ExportSettingsPanel; 