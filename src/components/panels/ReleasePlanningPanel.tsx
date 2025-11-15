/**
 * Release Planning Panel Component
 * 
 * Main panel for release planning with checklist management
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  useTheme,
} from '@mui/material';
import { Release, ReleaseType, ChecklistItem } from '../../types/release';
import ReleaseChecklist from '../common/ReleaseChecklist';
import { generateChecklist, calculateChecklistProgress } from '../../services/releaseChecklistService';
import { useToast } from '../../hooks/useToast';
import RightsEditor from '../RightsEditor';
import { RightsSplit } from '../../types/export';
import { isFeatureEnabled } from '../../config/features';

interface ReleasePlanningPanelProps {
  projectId: string;
  onClose: () => void;
  onCreateRelease?: (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  existingRelease?: Release;
  collaborators?: Array<{ id: string; name: string }>;
}

const ReleasePlanningPanel: React.FC<ReleasePlanningPanelProps> = ({
  projectId,
  onClose,
  onCreateRelease,
  existingRelease,
  collaborators = [],
}) => {
  const theme = useTheme();
  const { showSuccess, showError, ToastComponent } = useToast();
  const [title, setTitle] = useState(existingRelease?.title || '');
  const [description, setDescription] = useState(existingRelease?.description || '');
  const [type, setType] = useState<ReleaseType>(existingRelease?.type || 'single');
  const [releaseDate, setReleaseDate] = useState(existingRelease?.releaseDate || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    existingRelease?.checklist || generateChecklist(existingRelease?.type || 'single')
  );
  const [rightsSplits, setRightsSplits] = useState<RightsSplit[]>([]);

  const handleToggleItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        return {
          ...item,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  };

  const handleUpdateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updates, updatedAt: new Date().toISOString() };
      }
      return item;
    }));
  };

  const handleTypeChange = (newType: ReleaseType) => {
    setType(newType);
    if (!existingRelease) {
      setChecklist(generateChecklist(newType));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Please enter a release title');
      return;
    }

    try {
      const releaseData: Omit<Release, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim(),
        type,
        projectId,
        userId: '', // Will be set by service
        checklist,
        progress: calculateChecklistProgress(checklist),
        status: 'draft',
        releaseDate: releaseDate || undefined,
      };

      if (onCreateRelease) {
        await onCreateRelease(releaseData);
        showSuccess('Release saved successfully');
      }
    } catch (error) {
      showError('Failed to save release');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Release Planning
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Release Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Release Type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as ReleaseType)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="single">Single</MenuItem>
            <MenuItem value="album">Album</MenuItem>
            <MenuItem value="ep">EP</MenuItem>
            <MenuItem value="mixtape">Mixtape</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Release Date"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ReleaseChecklist
            release={{
              id: existingRelease?.id || 'new',
              title,
              description,
              type,
              projectId,
              userId: '',
              checklist,
              progress: calculateChecklistProgress(checklist),
              status: 'draft',
              createdAt: existingRelease?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            collaborators={collaborators}
          />
        </Grid>
      </Grid>

      {isFeatureEnabled('soundcloud') && collaborators.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <RightsEditor
            splits={rightsSplits}
            collaborators={collaborators}
            onChange={setRightsSplits}
            showValidation={true}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Release
        </Button>
        {isFeatureEnabled('soundcloud') && existingRelease && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              // Export will be handled by parent component
              // This button can trigger export flow
            }}
          >
            Export Release
          </Button>
        )}
      </Box>

      <ToastComponent />
    </Box>
  );
};

export default ReleasePlanningPanel;

