import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, IconButton, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Trip } from '../types/trip';
import { Song } from '../types/song';
import ProjectDetails from './ProjectDetails';
import SongDetailsPanel from './panels/SongDetailsPanel';
import TagsAndCategoriesPanel from './panels/TagsAndCategoriesPanel';
import CollaboratorsPanel from './panels/CollaboratorsPanel';
import TripActivityLogs from './TripActivityLogs';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../hooks/useTrip';
import { useSongs } from '../hooks/useSongs';
import { getErrorMessage } from '../utils/storageHelpers';

interface TripDetailsProps {
  trip: Trip;
  onTripUpdated: (trip: Trip) => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip: initialTrip, onTripUpdated }) => {
  const navigate = useNavigate();
  useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [_isEditing, setIsEditing] = useState(false);
  const [_isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use hooks for data management
  const { trip, loading: tripLoading, error: tripError, updateTripData } = useTrip({
    tripId: initialTrip.id,
    autoFetch: true
  });

  const { songs, loading: songsLoading, error: songsError, refresh: refreshSongs, updateSongData } = useSongs({
    tripId: initialTrip.id,
    autoFetch: true
  });

  // Combine loading and error states
  const loading = tripLoading || songsLoading;
  const combinedError = tripError || songsError;

  useEffect(() => {
    if (combinedError) {
      setError(getErrorMessage(combinedError, 'Failed to load project data'));
    }
  }, [combinedError]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSongsUpdated = async (_updatedSongs: Song[]) => {
    // Songs are managed by useSongs hook, just refresh to sync
    await refreshSongs();
    if (trip) {
      onTripUpdated(trip);
    }
  };

  const handleSongUpdate = async (updatedSong: Song) => {
    try {
      await updateSongData(updatedSong.id, updatedSong);
      await refreshSongs();
      if (trip) {
        onTripUpdated(trip);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update song'));
    }
  };

  const handleCollaboratorsUpdated = async (updatedCollaborators: string[]) => {
    if (!trip) return;
    
    try {
      const updatedTrip = await updateTripData({ collaborators: updatedCollaborators });
      onTripUpdated(updatedTrip);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update collaborators'));
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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && trip && (
        <>
          {selectedTab === 0 && (
            <ProjectDetails
              trip={{ ...trip, songs }}
              onSongsUpdated={handleSongsUpdated}
            />
          )}

          {selectedTab === 1 && (
            <TagsAndCategoriesPanel
              songs={songs}
              onClose={() => {}}
              onSongsUpdated={handleSongsUpdated}
            />
          )}

          {selectedTab === 2 && (
            <CollaboratorsPanel
              tripId={trip.id}
              collaborators={trip.collaborators}
              onCollaboratorsChange={handleCollaboratorsUpdated}
            />
          )}

          {selectedTab === 3 && (
            <TripActivityLogs tripId={trip.id} />
          )}
        </>
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