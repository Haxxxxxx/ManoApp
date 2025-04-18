import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Song } from '../types';

export interface CardTag {
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export interface DynamicCardProps {
  song: Song;
  onClick?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isPlaying?: boolean;
  tags?: CardTag[];
  children?: React.ReactNode;
}

const DynamicCard: React.FC<DynamicCardProps> = ({
  song,
  onClick,
  onPlay,
  onPause,
  onEdit,
  onDelete,
  isPlaying = false,
  tags = [],
  children,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePlayClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (isPlaying && onPause) {
      onPause();
    } else if (onPlay) {
      onPlay();
    }
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit();
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete();
  };

  const formatDuration = (duration: string) => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Fade in={true} timeout={500}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
            borderColor: 'primary.main',
          },
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="div"
            sx={{
              height: 200,
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <MusicNoteIcon 
              sx={{ 
                fontSize: 80, 
                color: 'text.secondary', 
                opacity: 0.5,
                transition: 'all 0.3s',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }} 
            />
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={handlePlayClick}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.9),
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.main,
                  },
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: theme.palette.background.paper,
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </CardMedia>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleEdit}>Edit</MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              Delete
            </MenuItem>
          </Menu>
        </Box>
        <CardContent>
          <Typography variant="h6" gutterBottom noWrap>
            {song.title}
          </Typography>
          {song.subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
              {song.subtitle}
            </Typography>
          )}
          {song.description && (
            <Typography variant="body1" color="text.primary" sx={{ mb: 2 }} noWrap>
              {song.description}
            </Typography>
          )}
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag.label}
                  size="small"
                  sx={{ 
                    height: 24,
                    bgcolor: `${tag.color}.dark`,
                    color: 'white',
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
        {children}
      </Card>
    </Fade>
  );
};

export default DynamicCard; 