import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useActivityFeed } from '../../hooks/useActivityFeed';

const typeIcons: Record<string, React.ReactNode> = {
  create: <AddIcon fontSize="small" color="success" />,
  update: <EditIcon fontSize="small" color="info" />,
  delete: <DeleteIcon fontSize="small" color="error" />,
  upload: <CloudUploadIcon fontSize="small" color="primary" />,
  export: <CloudDownloadIcon fontSize="small" color="secondary" />,
};

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'upload', label: 'Uploaded' },
  { value: 'delete', label: 'Deleted' },
  { value: 'export', label: 'Exported' },
];

function relativeTime(ts: string | Date): string {
  const date = typeof ts === 'string' ? new Date(ts) : ts;
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return date.toLocaleDateString();
}

interface ActivityFeedProps {
  tripIds: string[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ tripIds, maxItems = 10 }) => {
  const { activities, loading, refresh } = useActivityFeed(tripIds, maxItems);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = typeFilter === 'all'
    ? activities
    : activities.filter((a) => a.type === typeFilter);

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" color="action" />
          <Typography variant="h6" fontWeight={600}>
            Recent Activity
          </Typography>
          {activities.length > 0 && (
            <Chip label={activities.length} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={refresh} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Type filter chips */}
      {activities.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              size="small"
              variant={typeFilter === f.value ? 'filled' : 'outlined'}
              color={typeFilter === f.value ? 'primary' : 'default'}
              onClick={() => setTypeFilter(f.value)}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          ))}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No activity yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Activity will appear here as you work on your projects
          </Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <FilterListIcon sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.4, mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            No {typeFilter} activity
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
          {filtered.map((activity) => (
            <ListItem key={activity.id} disablePadding sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {typeIcons[activity.type || 'update'] || typeIcons.update}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {relativeTime(activity.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  activity.tripName ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      in {activity.tripName}
                    </Typography>
                  ) : undefined
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ActivityFeed;
