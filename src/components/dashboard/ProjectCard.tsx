import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AlbumIcon from '@mui/icons-material/Album';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Trip } from '../../types/trip';
import { useSongCount } from '../../hooks/useSongCount';
import { formatDate } from '../../utils/formatters';
import { isDevPlaceholder } from '../../utils/devPlaceholder';

interface ProjectCardProps {
  trip: Trip;
  onTripClick: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  trip, 
  onTripClick, 
  onDeleteTrip 
}) => {
  const theme = useTheme();
  const isDev = isDevPlaceholder(trip);
  // Conditionally use hook only for non-dev projects
  const hookSongCount = useSongCount(isDev ? undefined : trip.id);
  const songCount = isDev ? (trip.songs?.length || 0) : hookSongCount;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.15)',
          borderColor: 'primary.main',
        },
        '&:active': {
          transform: 'translateY(-4px) scale(1.01)',
        }
      }}
    >
      <Box 
        onClick={() => onTripClick(trip)}
        sx={{ height: '100%' }}
        role="button"
        tabIndex={0}
        aria-label={`Open project ${trip.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTripClick(trip);
          }
        }}
      >
        <CardMedia
          component="div"
          sx={{
            height: 160,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isHovered 
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                : 'transparent',
              transition: 'all 0.3s ease',
            }
          }}
        >
          <AlbumIcon 
            sx={{ 
              fontSize: 64, 
              color: 'primary.main', 
              opacity: isHovered ? 0.8 : 0.5,
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
              zIndex: 1,
            }} 
          />
          {isDev && (
            <Chip
              label="🧪 DEV"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 2,
                bgcolor: 'error.main',
                color: 'white',
                fontSize: '0.65rem',
                height: 20,
                fontWeight: 'bold',
                border: '1px solid white',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            />
          )}
          {trip.status && (
            <Chip
              label={trip.status}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                textTransform: 'capitalize',
                bgcolor: trip.status === 'published' ? 'success.main' : 'warning.main',
                color: 'white',
                fontSize: '0.7rem',
                height: 24,
              }}
            />
          )}
        </CardMedia>
        <CardContent>
          <Typography 
            variant="h6" 
            gutterBottom 
            noWrap
            sx={{
              fontWeight: 600,
              transition: 'color 0.2s ease',
              color: isHovered ? 'primary.main' : 'text.primary',
            }}
          >
            {trip.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              minHeight: 40,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {trip.description || 'No description'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MusicNoteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {songCount} {songCount === 1 ? 'song' : 'songs'}
              </Typography>
            </Box>
            {trip.updatedAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(trip.updatedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Box>
      {!isDev && (
        <Tooltip title="Delete project" arrow>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTrip(trip);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
              opacity: isHovered ? 1 : 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
                transform: 'scale(1.1)',
                boxShadow: '0px 4px 12px rgba(211, 47, 47, 0.4)',
              },
              zIndex: 3,
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Card>
  );
};

export default ProjectCard; 