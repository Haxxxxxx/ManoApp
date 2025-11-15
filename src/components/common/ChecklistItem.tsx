/**
 * Checklist Item Component
 * 
 * Component for displaying and managing individual checklist items
 */

import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { ChecklistItem as ChecklistItemType, ChecklistItemStatus, ChecklistItemPriority } from '../../types/release';
import { formatDate } from '../../utils/formatters';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (itemId: string) => void;
  onUpdate?: (itemId: string, updates: Partial<ChecklistItemType>) => void;
  onDelete?: (itemId: string) => void;
  collaborators?: Array<{ id: string; name: string }>;
}

const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onUpdate,
  onDelete,
  collaborators = [],
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const getPriorityColor = (priority?: ChecklistItemPriority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: ChecklistItemStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 2,
        border: '1px solid',
        borderColor: item.status === 'completed' ? 'success.main' : 'divider',
        bgcolor: item.status === 'completed' ? alpha(theme.palette.success.main, 0.05) : 'background.paper',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Checkbox
        checked={item.status === 'completed'}
        onChange={() => onToggle(item.id)}
        color="success"
      />

      <Box sx={{ flex: 1 }}>
        {isEditing ? (
          <TextField
            fullWidth
            value={item.title}
            onChange={(e) => onUpdate?.(item.id, { title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            autoFocus
            size="small"
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              textDecoration: item.status === 'completed' ? 'line-through' : 'none',
              color: item.status === 'completed' ? 'text.secondary' : 'text.primary',
            }}
            onClick={() => setIsEditing(true)}
          >
            {item.title}
          </Typography>
        )}

        {item.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {item.priority && (
            <Chip
              label={item.priority}
              size="small"
              color={getPriorityColor(item.priority)}
              variant="outlined"
            />
          )}
          <Chip
            label={item.status}
            size="small"
            color={getStatusColor(item.status)}
            variant="outlined"
          />
          {item.category && (
            <Chip label={item.category} size="small" variant="outlined" />
          )}
          {item.assigneeId && (
            <Chip
              icon={<AssignmentIcon />}
              label={collaborators.find(c => c.id === item.assigneeId)?.name || 'Assigned'}
              size="small"
              variant="outlined"
            />
          )}
          {item.dueDate && (
            <Chip
              label={`Due: ${formatDate(item.dueDate)}`}
              size="small"
              variant="outlined"
              color={new Date(item.dueDate) < new Date() ? 'error' : 'default'}
            />
          )}
        </Box>
      </Box>

      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setIsEditing(true); setAnchorEl(null); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {onDelete && (
          <MenuItem onClick={() => { onDelete(item.id); setAnchorEl(null); }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ChecklistItemComponent;

