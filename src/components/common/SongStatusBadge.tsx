import React from 'react';
import { Chip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { SongStatus } from '../../types/song';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';

const STATUS_CONFIG: Record<SongStatus, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'secondary'; icon: React.ReactElement }> = {
  'draft': { label: 'Draft', color: 'default', icon: <EditNoteIcon fontSize="small" /> },
  'in-review': { label: 'In Review', color: 'warning', icon: <RateReviewIcon fontSize="small" /> },
  'ready': { label: 'Ready', color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  'published': { label: 'Published', color: 'success', icon: <PublishIcon fontSize="small" /> },
  'archived': { label: 'Archived', color: 'secondary', icon: <ArchiveIcon fontSize="small" /> },
};

interface SongStatusBadgeProps {
  status: SongStatus;
  onChange?: (newStatus: SongStatus) => void;
  size?: 'small' | 'medium';
}

const SongStatusBadge: React.FC<SongStatusBadgeProps> = ({ status, onChange, size = 'small' }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['draft'];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onChange) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleSelect = (newStatus: SongStatus) => {
    onChange?.(newStatus);
    setAnchorEl(null);
  };

  return (
    <>
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size={size}
        onClick={onChange ? handleClick : undefined}
        sx={{ cursor: onChange ? 'pointer' : 'default' }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {(Object.entries(STATUS_CONFIG) as [SongStatus, typeof config][]).map(([key, cfg]) => (
          <MenuItem
            key={key}
            selected={key === status}
            onClick={() => handleSelect(key)}
          >
            <ListItemIcon>{cfg.icon}</ListItemIcon>
            <ListItemText>{cfg.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SongStatusBadge;
