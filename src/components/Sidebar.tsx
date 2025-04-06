import { Box, List, ListItem, ListItemButton, ListItemText, IconButton, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { Trip } from '../types';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTrips } from '../services/firebaseService';

interface SidebarProps {
  selectedTrip: string | null;
  onSelectTrip: (trip: string) => void;
}

const Sidebar = ({ selectedTrip, onSelectTrip }: SidebarProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
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
    </Box>
  );
};

export default Sidebar; 