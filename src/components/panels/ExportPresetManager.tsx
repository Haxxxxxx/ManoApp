/**
 * Export Preset Manager Component
 * 
 * CRUD UI for managing export presets
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ExportPreset } from '../../types/preset';
import { createPreset, updatePreset, deletePreset, getPresets } from '../../services/presetService';

export interface ExportPresetManagerProps {
  /** Selected provider to filter presets */
  selectedProvider?: string;
  
  /** Callback when preset is selected */
  onSelectPreset?: (preset: ExportPreset) => void;
}

export const ExportPresetManager: React.FC<ExportPresetManagerProps> = ({
  selectedProvider,
  onSelectPreset,
}) => {
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ExportPreset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: selectedProvider || '',
    isDefault: false,
    settings: {} as ExportPreset['settings'],
  });

  useEffect(() => {
    loadPresets();
  }, [selectedProvider]);

  const loadPresets = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedPresets = await getPresets(selectedProvider);
      setPresets(loadedPresets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPreset(null);
    setFormData({
      name: '',
      provider: selectedProvider || '',
      isDefault: false,
      settings: {},
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (preset: ExportPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      provider: preset.provider,
      isDefault: preset.isDefault || false,
      settings: preset.settings,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (presetId: string) => {
    if (!window.confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      await deletePreset(presetId);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    }
  };

  const handleSave = async () => {
    try {
      if (editingPreset) {
        await updatePreset(editingPreset.id, {
          name: formData.name,
          provider: formData.provider,
          isDefault: formData.isDefault,
          settings: formData.settings,
        });
      } else {
        await createPreset({
          name: formData.name,
          provider: formData.provider,
          isDefault: formData.isDefault,
          settings: formData.settings,
        });
      }
      setEditDialogOpen(false);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    }
  };

  const filteredPresets = selectedProvider
    ? presets.filter((p) => p.provider === selectedProvider)
    : presets;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Export Presets</Typography>
        <Button startIcon={<AddIcon />} onClick={handleCreate} variant="contained" size="small">
          Create Preset
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredPresets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No presets found. Create one to get started.
          </Typography>
        </Box>
      ) : (
        <List>
          {filteredPresets.map((preset) => (
            <ListItem
              key={preset.id}
              component="div"
              onClick={onSelectPreset ? () => onSelectPreset(preset) : undefined}
              sx={{ cursor: onSelectPreset ? 'pointer' : 'default' }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{preset.name}</Typography>
                    {preset.isDefault && <Chip label="Default" size="small" color="primary" />}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Provider: {preset.provider}
                    </Typography>
                    {preset.lastUsedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Last used: {new Date(preset.lastUsedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEdit(preset)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDelete(preset.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPreset ? 'Edit Preset' : 'Create Preset'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Preset Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                label="Provider"
                required
              >
                <MenuItem value="soundcloud">SoundCloud</MenuItem>
                <MenuItem value="spotify">Spotify</MenuItem>
                <MenuItem value="apple">Apple Music</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label="Set as default preset for this provider"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name || !formData.provider}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExportPresetManager;

