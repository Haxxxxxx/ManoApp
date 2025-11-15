import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton, 
  Divider, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress,
  Typography,
  Avatar,
  Badge,
  Tooltip,
  Fade,
  useTheme,
  alpha,
  ListItemIcon,
  Chip,
  Paper,
  Collapse,
  Drawer,
  useMediaQuery,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { Trip } from '../types/trip';
import { Song } from '../types/song';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/storageHelpers';
import { useTrips } from '../contexts/TripContext';
import { createTrip } from '../services/firebaseService';
import { useNavigate, useLocation } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import SettingsPanel from './panels/SettingsPanel';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import AlbumIcon from '@mui/icons-material/Album';

interface SidebarProps {
  selectedTrip: string | null;
  onSelectTrip: (trip: string) => void;
}

const Sidebar = ({ selectedTrip, onSelectTrip }: SidebarProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const { currentUser, artistProfile } = useAuth();
  const { trips, sharedTrips, loading, addTrip } = useTrips();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tripsExpanded, setTripsExpanded] = useState(true);
  const [sharedTripsExpanded, setSharedTripsExpanded] = useState(true);

  const handleCreateTrip = async (song: Song) => {
    if (!currentUser) return;
    
    try {
      const newTrip = await createTrip({
        name: song.title,
        description: song.metadata?.lyrics || '',
        userId: currentUser.uid,
        songs: [song],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaborators: [],
        tags: song.metadata?.tags || [],
        status: 'draft',
        type: 'project'
      });
      
      // Add the trip to the context
      addTrip(newTrip);
      
      setOpenDialog(false);
      
      // Select the newly created trip
      onSelectTrip(newTrip.id);
      navigate(`/trip/${newTrip.id}`);
    } catch (error) {
      // Error creating trip
    }
  };

  const handleTripClick = (tripId: string) => {
    onSelectTrip(tripId);
    navigate(`/trip/${tripId}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      // Error signing out
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const renderSidebarContent = () => (
    <>
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 16,
            right: 16,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
          }
        }}
      >
        <Box
          component="img"
          src="/pigicon.png"
          alt="ManoApp"
          sx={{
            width: 48,
            height: 48,
            marginRight: 1.5,
            borderRadius: 2,
            objectFit: 'contain',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
              filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
            },
          }}
        />
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          sx={{ 
            color: 'primary.main',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        >
          ManoApp
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/'}
            onClick={() => navigate('/')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/albums'}
            onClick={() => navigate('/albums')}
          >
            <ListItemIcon>
              <AlbumIcon />
            </ListItemIcon>
            <ListItemText primary="Albums" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={location.pathname === '/profile'}
            onClick={() => navigate('/profile')}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenSettings(true)}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setTripsExpanded(!tripsExpanded)}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="My Projects" />
            {tripsExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={tripsExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {loading ? (
              <ListItem>
                <CircularProgress size={24} />
              </ListItem>
            ) : trips.length === 0 ? (
              <ListItem>
                <ListItemText primary="No projects yet" />
              </ListItem>
            ) : (
              trips.map((trip) => (
                <ListItem key={trip.id} disablePadding>
                  <ListItemButton 
                    selected={selectedTrip === trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary={trip.name} />
                  </ListItemButton>
                </ListItem>
              ))
            )}
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => setOpenDialog(true)}
                sx={{ pl: 4 }}
              >
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="New Project" />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton onClick={() => setSharedTripsExpanded(!sharedTripsExpanded)}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Shared Projects" />
            {sharedTripsExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={sharedTripsExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {loading ? (
              <ListItem>
                <CircularProgress size={24} />
              </ListItem>
            ) : sharedTrips.length === 0 ? (
              <ListItem>
                <ListItemText primary="No shared projects" />
              </ListItem>
            ) : (
              sharedTrips.map((trip) => (
                <ListItem key={trip.id} disablePadding>
                  <ListItemButton 
                    selected={selectedTrip === trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary={trip.name} />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Collapse>
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderSidebarContent()}
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 250,
              minWidth: 250,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: 250,
            minWidth: 250,
            height: '100%',
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
        >
          {drawer}
        </Paper>
      )}
      
      {openDialog && (
        <EmptyProjectPanel 
          onProjectCreated={handleCreateTrip} 
          onClose={() => setOpenDialog(false)}
          tripId="new"
          isDialog={true}
          mode="project"
        />
      )}
      
      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle>Settings</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <SettingsPanel onClose={() => setOpenSettings(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar; 