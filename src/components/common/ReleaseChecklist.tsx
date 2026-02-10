/**
 * Release Checklist Component
 * 
 * Component for displaying and managing release checklist items
 */

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ChecklistItem as ChecklistItemType, Release } from '../../types/release';
import ChecklistItemComponent from './ChecklistItem';
import { calculateChecklistProgress } from '../../services/releaseChecklistService';

interface ReleaseChecklistProps {
  release: Release;
  onToggleItem: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<ChecklistItemType>) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddItem?: () => void;
  collaborators?: Array<{ id: string; name: string }>;
}

const ReleaseChecklist: React.FC<ReleaseChecklistProps> = ({
  release,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  collaborators = [],
}) => {
  const progress = calculateChecklistProgress(release.checklist);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="600">
          Release Checklist
        </Typography>
        {onAddItem && (
          <Button
            startIcon={<AddIcon />}
            onClick={onAddItem}
            variant="outlined"
            size="small"
          >
            Add Item
          </Button>
        )}
      </Box>

      {/* Progress Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Progress</Typography>
          <Typography variant="subtitle2" fontWeight="600">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
      </Paper>

      {/* Checklist Items */}
      <Box>
        {release.checklist.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No checklist items yet. Add items to track your release progress.
            </Typography>
          </Paper>
        ) : (
          release.checklist.map((item) => (
            <ChecklistItemComponent
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              collaborators={collaborators}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ReleaseChecklist;

