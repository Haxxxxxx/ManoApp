import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Autocomplete,
  Avatar,
  Paper,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { 
  searchArtists, 
  getAllArtists, 
  updateTripCollaborators,
  logTripActivity,
  getTrip
} from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { ArtistProfile } from '../../types/artist';
import type { ActivityItem } from '../../types/activity';
import { inviteCollaborator, removeCollaborator } from '../../services/firebaseService';
import { getErrorMessage } from '../../utils/storageHelpers';

interface CollaboratorsPanelProps {
  tripId: string;
  collaborators?: string[];
  onCollaboratorsChange?: (collaborators: string[]) => void;
}

const CollaboratorsPanel: React.FC<CollaboratorsPanelProps> = ({
  tripId,
  collaborators = [],
  onCollaboratorsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allArtists, setAllArtists] = useState<ArtistProfile[]>([]);
  const [potentialCollaborators, setPotentialCollaborators] = useState<ArtistProfile[]>([]);
  const [currentCollaborators, setCurrentCollaborators] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [localCollaborators, setLocalCollaborators] = useState<string[]>(collaborators);

  // Fetch trip data to get current collaborators
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const trip = await getTrip(tripId);
        if (trip) {
          setLocalCollaborators(trip.collaborators || []);
        }
      } catch (err) {
        // Error fetching trip
        setError('Failed to load trip data');
      }
    };

    fetchTripData();
  }, [tripId]);

  // Fetch all artists and separate them into current and potential collaborators
  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const artists = await getAllArtists();
        
        // Filter out current user and get current collaborators
        const current = artists.filter(artist => 
          artist.id !== currentUser?.uid && localCollaborators.includes(artist.id)
        );
        
        // Get potential collaborators (artists who aren't current collaborators)
        const potential = artists.filter(artist => 
          artist.id !== currentUser?.uid && !localCollaborators.includes(artist.id)
        );
        
        setAllArtists(artists.filter(artist => artist.id !== currentUser?.uid));
        setCurrentCollaborators(current);
        setPotentialCollaborators(potential);
      } catch (err) {
        setError('Failed to load artists');
        // Error fetching artists
      } finally {
        setLoading(false);
      }
    };

    if (localCollaborators) {
      fetchArtists();
    }
  }, [currentUser?.uid, localCollaborators]);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      // If search term is less than 2 characters, show all potential collaborators
      setPotentialCollaborators(allArtists.filter(artist => 
        artist.id !== currentUser?.uid && !currentCollaborators.some(c => c.id === artist.id)
      ));
      return;
    }

    setSearchLoading(true);
    setError(null);
    try {
      const results = await searchArtists(value);
      // Filter out current user and existing collaborators
      const filteredResults = results.filter(
        (result) => result.id !== currentUser?.uid && !currentCollaborators.some(c => c.id === result.id)
      );
      setPotentialCollaborators(filteredResults);
    } catch (err) {
      setError('Failed to search for collaborators');
      // Search error
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddCollaborator = async (collaborator: ArtistProfile) => {
    try {
      // Check if the artist is already a collaborator
      if (localCollaborators.includes(collaborator.id)) {
        // Move the artist from potential to current collaborators
        const artistToMove = allArtists.find(a => a.id === collaborator.id);
        if (artistToMove && !currentCollaborators.some(c => c.id === collaborator.id)) {
          setCurrentCollaborators(prev => [...prev, artistToMove]);
          setPotentialCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
        }
        return;
      }

      // If they're not a collaborator, add them
      await inviteCollaborator(tripId, collaborator.id);
      
      // Update local state
      const updatedCollaborators = [...localCollaborators, collaborator.id];
      setLocalCollaborators(updatedCollaborators);
      setCurrentCollaborators(prev => [...prev, collaborator]);
      setPotentialCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
      
      if (onCollaboratorsChange) {
        onCollaboratorsChange(updatedCollaborators);
      }
      
      setSuccess('Collaborator added successfully');
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to add collaborator');
      if (error instanceof Error && error.message === 'Artist is already a collaborator') {
        // If the artist is already a collaborator, move them to the current list
        const artistToMove = allArtists.find(a => a.id === collaborator.id);
        if (artistToMove && !currentCollaborators.some(c => c.id === collaborator.id)) {
          setCurrentCollaborators(prev => [...prev, artistToMove]);
          setPotentialCollaborators(prev => prev.filter(c => c.id !== collaborator.id));
        }
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRemoveCollaborator = async (collaborator: ArtistProfile) => {
    try {
      await removeCollaborator(tripId, collaborator.id);
      // Update local state
      const updatedCollaborators = localCollaborators.filter(id => id !== collaborator.id);
      setLocalCollaborators(updatedCollaborators);
      setCurrentCollaborators(currentCollaborators.filter(c => c.id !== collaborator.id));
      setPotentialCollaborators([...potentialCollaborators, collaborator]);
      if (onCollaboratorsChange) {
        onCollaboratorsChange(updatedCollaborators);
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to remove collaborator'));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Collaborators
      </Typography>

      <Autocomplete
        freeSolo
        options={potentialCollaborators}
        getOptionLabel={(option) => 
          typeof option === 'string' ? option : option.name || option.email || ''
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search collaborators"
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {searchLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <ListItem {...props}>
            <Avatar sx={{ mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <ListItemText
              primary={option.name || 'Unnamed Artist'}
              secondary={option.email}
            />
          </ListItem>
        )}
        onChange={(_, value) => {
          if (value && typeof value !== 'string') {
            handleAddCollaborator(value);
          }
        }}
        onInputChange={(_, value) => handleSearch(value)}
        value={searchTerm}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Current Collaborators
      </Typography>

      <Paper sx={{ mb: 3, maxHeight: 200, overflow: 'auto' }}>
        <List>
          {currentCollaborators.length > 0 ? (
            currentCollaborators.map((collaborator) => (
              <ListItem key={collaborator.id}>
                <Avatar sx={{ mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <ListItemText
                  primary={collaborator.name || 'Unnamed Artist'}
                  secondary={collaborator.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveCollaborator(collaborator)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No collaborators yet" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ mb: 1 }}>
        Available Artists
      </Typography>

      <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
        <List>
          {potentialCollaborators.length > 0 ? (
            potentialCollaborators.map((artist) => (
              <ListItem 
                key={artist.id}
                button
                onClick={() => handleAddCollaborator(artist)}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <Avatar sx={{ mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <ListItemText
                  primary={artist.name || 'Unnamed Artist'}
                  secondary={artist.email}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No available artists found" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollaboratorsPanel; 