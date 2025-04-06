import { Box, List, ListItem, ListItemButton, ListItemText, IconButton, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { Trip } from '../types';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTrips, createTrip } from '../services/firebaseService';

interface SidebarProps {
  selectedTrip: string | null;
  onSelectTrip: (trip: string) => void;
}

const Sidebar = ({ selectedTrip, onSelectTrip }: SidebarProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchTrips = async () => {
      if (currentUser) {
        const userTrips = await getTrips(currentUser.uid);
        setTrips(userTrips);
      }
    };

    fetchTrips();
  }, [currentUser]);

  const handleCreateTrip = async () => {
    if (currentUser && newTripName.trim()) {
      try {
        const newTrip = await createTrip({
          name: newTripName.trim(),
          description: newTripDescription.trim(),
          userId: currentUser.uid,
          songs: [],
          createdAt: new Date().toISOString()
        });
        setTrips([...trips, newTrip]);
        setNewTripName('');
        setNewTripDescription('');
        setOpenDialog(false);
      } catch (error) {
        console.error('Error creating trip:', error);
      }
    }
  };

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: 'background.paper',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          fullWidth
        >
          Create Trip
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {trips.map((trip) => (
            <ListItem key={trip.id} disablePadding>
              <ListItemButton
                selected={selectedTrip === trip.id}
                onClick={() => onSelectTrip(trip.id)}
              >
                <ListItemText 
                  primary={trip.name}
                  secondary={trip.description}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <IconButton
          color="primary"
          aria-label="settings"
          sx={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </IconButton>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Trip</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Trip Name"
            type="text"
            fullWidth
            value={newTripName}
            onChange={(e) => setNewTripName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={newTripDescription}
            onChange={(e) => setNewTripDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTrip} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar; 