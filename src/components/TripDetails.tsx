import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Stack, Chip, Tabs, Tab, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Trip } from '../types/trip';
import { Song } from '../types/song';
import { deleteTrip, getTrip } from '../services/firebaseService';
import ProjectDetails from './ProjectDetails';
import SongDetailsPanel from './panels/SongDetailsPanel';
import TagsAndCategoriesPanel from './panels/TagsAndCategoriesPanel';
import CollaboratorsPanel from './panels/CollaboratorsPanel';
import TripActivityLogs from './TripActivityLogs';
import { useAuth } from '../contexts/AuthContext';

interface TripDetailsProps {
  trip: Trip;
  onTripUpdated: (trip: Trip) => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip: initialTrip, onTripUpdated }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [localTrip, setLocalTrip] = useState<Trip>(initialTrip);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update local trip when props change
  useEffect(() => {
    setLocalTrip(initialTrip);
  }, [initialTrip]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSongsUpdated = async (updatedSongs: Song[]) => {
    try {
      const updatedTrip = {
        ...localTrip,
        songs: updatedSongs
      };
      
      // Update local state immediately for responsive UI
      setLocalTrip(updatedTrip);
      
      // Notify parent component
      onTripUpdated(updatedTrip);
      
      // Fetch the latest trip data from Firebase to ensure we have the most up-to-date data
      const refreshedTrip = await getTrip(initialTrip.id);
      if (refreshedTrip) {
        setLocalTrip(refreshedTrip);
        onTripUpdated(refreshedTrip);
      }
    } catch (error) {
      console.error('Error updating songs:', error);
      setError('Failed to update songs. Please try again.');
    }
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
  };

  const handleSongUpdate = async (updatedSong: Song) => {
    try {
      const updatedSongs = localTrip.songs.map(song => 
        song.id === updatedSong.id ? updatedSong : song
      );
      
      const updatedTrip = {
        ...localTrip,
        songs: updatedSongs
      };
      
      // Update local state immediately for responsive UI
      setLocalTrip(updatedTrip);
      
      // Notify parent component
      onTripUpdated(updatedTrip);
      
      // Fetch the latest trip data from Firebase to ensure we have the most up-to-date data
      const refreshedTrip = await getTrip(initialTrip.id);
      if (refreshedTrip) {
        setLocalTrip(refreshedTrip);
        onTripUpdated(refreshedTrip);
      }
    } catch (error) {
      console.error('Error updating song:', error);
      setError('Failed to update song. Please try again.');
    }
  };

  const handleCollaboratorsUpdated = async (updatedCollaborators: string[]) => {
    try {
      const updatedTrip = {
        ...localTrip,
        collaborators: updatedCollaborators
      };
      
      // Update local state immediately for responsive UI
      setLocalTrip(updatedTrip);
      
      // Notify parent component
      onTripUpdated(updatedTrip);
      
      // Fetch the latest trip data from Firebase to ensure we have the most up-to-date data
      const refreshedTrip = await getTrip(initialTrip.id);
      if (refreshedTrip) {
        setLocalTrip(refreshedTrip);
        onTripUpdated(refreshedTrip);
      }
    } catch (error) {
      console.error('Error updating collaborators:', error);
      setError('Failed to update collaborators. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Trip Details
        </Typography>
        <IconButton onClick={() => setIsEditing(true)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => setIsDeleting(true)}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Project Details" />
          <Tab label="Tags & Categories" />
          <Tab label="Collaborators" />
          <Tab label="Activity Log" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <ProjectDetails
          trip={localTrip}
          onSongsUpdated={handleSongsUpdated}
        />
      )}

      {selectedTab === 1 && (
        <TagsAndCategoriesPanel
          songs={localTrip.songs}
          onClose={() => {}}
          onSongsUpdated={handleSongsUpdated}
        />
      )}

      {selectedTab === 2 && (
        <CollaboratorsPanel
          tripId={localTrip.id}
          collaborators={localTrip.collaborators}
          onCollaboratorsChange={handleCollaboratorsUpdated}
        />
      )}

      {selectedTab === 3 && (
        <TripActivityLogs tripId={localTrip.id} />
      )}

      {selectedSong && (
        <SongDetailsPanel
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onSongUpdated={handleSongUpdate}
        />
      )}
    </Box>
  );
};

export default TripDetails; 