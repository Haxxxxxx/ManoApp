import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import {
  Folder as FolderIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { getCollaborativeTrips } from '../services/firebaseService';
import { Trip } from '../types/trip';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CollaborativeTrips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      if (!currentUser) return;
      
      try {
        const collaborativeTrips = await getCollaborativeTrips(currentUser.uid);
        setTrips(collaborativeTrips);
      } catch (err) {
        // Error fetching collaborative trips
        setError('Failed to load collaborative trips');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [currentUser]);

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (trips.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>You are not collaborating on any projects yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Collaborative Projects
      </Typography>
      <Paper>
        <List>
          {trips.map((trip) => (
            <ListItem
              key={trip.id}
              button
              onClick={() => handleTripClick(trip.id)}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary={trip.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={trip.type === 'project' ? 'Project' : 'Playlist'}
                      color={trip.type === 'project' ? 'primary' : 'secondary'}
                    />
                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      {new Date(trip.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default CollaborativeTrips; 