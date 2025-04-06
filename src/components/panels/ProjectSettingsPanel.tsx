import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, Divider } from '@mui/material';
import { useState } from 'react';
import { Trip } from '../../types';

interface ProjectSettingsPanelProps {
  trip: Trip;
  onClose: () => void;
}

const ProjectSettingsPanel = ({ trip, onClose }: ProjectSettingsPanelProps) => {
  const [settings, setSettings] = useState({
    name: trip.name,
    description: trip.description || '',
    isPrivate: true,
    allowComments: true,
    enableVersioning: true,
    autoSave: true
  });

  const handleSave = () => {
    // Save settings
    onClose();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Project Settings</Typography>

        {/* Basic Settings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Basic Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Project Name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Privacy Settings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isPrivate}
                  onChange={(e) => setSettings({ ...settings, isPrivate: e.target.checked })}
                />
              }
              label="Private Project"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowComments}
                  onChange={(e) => setSettings({ ...settings, allowComments: e.target.checked })}
                />
              }
              label="Allow Comments"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Advanced Settings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableVersioning}
                  onChange={(e) => setSettings({ ...settings, enableVersioning: e.target.checked })}
                />
              }
              label="Enable Version Control"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                />
              }
              label="Auto-save Changes"
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectSettingsPanel; 