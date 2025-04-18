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
  Paper
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { Trip } from '../types/trip';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrips } from '../contexts/TripContext';
import { createTrip } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import EmptyProjectPanel from './panels/EmptyProjectPanel';
import SettingsPanel from './panels/SettingsPanel';

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
  const theme = useTheme();

  const handleCreateTrip = async (song: any) => {
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
      console.error('Error creating trip:', error);
    }
  };

  const handleTripClick = (tripId: string) => {
    onSelectTrip(tripId);
    navigate(`/trip/${tripId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        zIndex: 10,
      }}
    >
      {/* User Profile Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            borderColor: 'primary.main',
          }
        }}
        onClick={handleProfileClick}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
          }}
        >
          <Avatar 
            src={artistProfile?.photoURL || undefined} 
            alt={artistProfile?.name || currentUser?.email || 'User'}
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: theme.palette.primary.main,
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {artistProfile?.name || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trips.length} {trips.length === 1 ? 'Project' : 'Projects'}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton 
              onClick={handleLogout}
              size="small"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'error.main' }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Create Project Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          fullWidth
          sx={{ 
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
            '&:hover': {
              boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
            }
          }}
        >
          Create Project
        </Button>
      </Box>

      {/* Projects List */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          px: 1,
          py: 1,
        }}
      >
        {/* Your Projects Section */}
        <Typography 
          variant="subtitle2" 
          color="text.secondary" 
          sx={{ 
            px: 2, 
            py: 1,
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          YOUR PROJECTS
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : trips.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <FolderIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              No projects yet. Create your first project to get started.
            </Typography>
          </Box>
        ) : (
          <List sx={{ px: 1 }}>
            {trips.map((trip) => (
              <ListItem key={trip.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={selectedTrip === trip.id}
                  onClick={() => handleTripClick(trip.id)}
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    },
                  }}
                >
                  <MusicNoteIcon 
                    sx={{ 
                      mr: 2, 
                      color: selectedTrip === trip.id ? 'primary.main' : 'text.secondary',
                      transition: 'color 0.2s',
                    }} 
                  />
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body1" 
                        fontWeight={selectedTrip === trip.id ? 600 : 400}
                        color={selectedTrip === trip.id ? 'primary.main' : 'text.primary'}
                      >
                        {trip.name}
                      </Typography>
                    }
                    secondary={
                      <Box 
                        component="span" 
                        sx={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '180px',
                          color: 'text.secondary',
                          fontSize: 'body2.fontSize'
                        }}
                      >
                        {trip.description || 'No description'}
                      </Box>
                    }
                  />
                  <Badge 
                    badgeContent={trip.songs?.length || 0} 
                    color="primary"
                    sx={{ 
                      '& .MuiBadge-badge': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: 'primary.main',
                        fontWeight: 'bold',
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* Shared Projects Section */}
        {sharedTrips.length > 0 && (
          <>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ 
                px: 2, 
                py: 1,
                mt: 2,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              SHARED WITH YOU
            </Typography>
            <List sx={{ px: 1 }}>
              {sharedTrips.map((trip) => (
                <ListItem
                  key={trip.id}
                  button
                  selected={selectedTrip === trip.id}
                  onClick={() => handleTripClick(trip.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    <FolderIcon color={selectedTrip === trip.id ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={trip.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label="Shared"
                          color="info"
                          sx={{ height: 20 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(trip.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>

      {/* Settings Section */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="text"
          color="inherit"
          startIcon={<SettingsIcon />}
          fullWidth
          onClick={() => setOpenSettings(true)}
          sx={{ 
            justifyContent: 'flex-start',
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: alpha(theme.palette.common.white, 0.05),
            }
          }}
        >
          Settings
        </Button>
      </Box>

      {/* Create Project Dialog */}
      {openDialog && (
        <EmptyProjectPanel
          tripId="new"
          onClose={() => setOpenDialog(false)}
          onProjectCreated={handleCreateTrip}
          isDialog={true}
          mode="project"
        />
      )}

      {/* Settings Dialog */}
      {openSettings && (
        <Dialog
          open={openSettings}
          onClose={() => setOpenSettings(false)}
          maxWidth="md"
          fullWidth
        >
          <SettingsPanel onClose={() => setOpenSettings(false)} />
        </Dialog>
      )}
    </Box>
  );
};

export default Sidebar; 