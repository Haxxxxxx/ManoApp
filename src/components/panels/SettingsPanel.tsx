import React, { useState, FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  LinearProgress,
  Slider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, deleteAccount } from '../../services/firebaseService';
import { createTheme, ThemeProvider } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: FC<SettingsPanelProps> = ({ onClose }) => {
  const theme = useTheme();
  const { currentUser, artistProfile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: artistProfile?.name || '',
    bio: artistProfile?.bio || '',
    genre: artistProfile?.genre || '',
    location: artistProfile?.location || '',
    photoURL: artistProfile?.photoURL || currentUser?.photoURL || '',
    socialLinks: artistProfile?.socialLinks || {},
  });
  const [settings, setSettings] = useState({
    primaryColor: '#1DB954', // Default Spotify green
    darkMode: true,
    fontSize: 16,
    animations: true,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (field === 'socialLinks') {
      const [platform, value] = event.target.value.split(':');
      setProfileData({
        ...profileData,
        socialLinks: {
          ...profileData.socialLinks,
          [platform]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [field]: event.target.value,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateUserProfile(currentUser.uid, profileData);
      await updateProfile();
      setSuccess('Profile updated successfully');
      setEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteAccount(currentUser.uid);
      // The AuthContext will handle the sign out
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleSave = () => {
    // Create a new theme with the updated primary color
    const newTheme = createTheme({
      ...theme,
      palette: {
        ...theme.palette,
        primary: {
          main: settings.primaryColor,
          light: `${settings.primaryColor}99`, // Add transparency for light variant
          dark: `${settings.primaryColor}CC`, // Add transparency for dark variant
          contrastText: '#FFFFFF',
        },
      },
    });

    // TODO: Implement theme persistence
    // For now, we'll just log the changes
    console.log('New theme:', newTheme);
    onClose();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>
          Settings
        </Typography>

        {/* Theme Settings */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Theme Settings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography gutterBottom>Primary Color</Typography>
              <TextField
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                sx={{ width: '100%' }}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                />
              }
              label="Dark Mode"
            />
            <Box>
              <Typography gutterBottom>Font Size</Typography>
              <Slider
                value={settings.fontSize}
                onChange={(_, value) => setSettings({ ...settings, fontSize: value as number })}
                min={12}
                max={20}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.animations}
                  onChange={(e) => setSettings({ ...settings, animations: e.target.checked })}
                />
              }
              label="Enable Animations"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPanel; 