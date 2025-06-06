import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AlbumIcon from '@mui/icons-material/Album';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { Trip } from '../../types/trip';

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

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
          borderColor: 'primary.main',
        },
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <Box 
        onClick={() => onTripClick(trip)}
        sx={{ height: '100%' }}
      >
        <CardMedia
          component="div"
          sx={{
            height: 140,
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlbumIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
        </CardMedia>
        <CardContent>
          <Typography variant="h6" gutterBottom noWrap>
            {trip.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
            {trip.description || 'No description'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MusicNoteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {trip.songs?.length || 0} songs
            </Typography>
          </Box>
        </CardContent>
      </Box>
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
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            bgcolor: 'error.light',
            color: 'white',
          },
          zIndex: 1,
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Card>
  );
};

export default ProjectCard; 