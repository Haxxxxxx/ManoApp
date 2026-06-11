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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  LinearProgress,
  Slider,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Palette as PaletteIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ColorLens as ColorLensIcon,
  TextFields as TextFieldsIcon,
  Animation as AnimationIcon,
  BorderAll as BorderRadiusIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { deleteAccount } from '../../services/firebaseService';
import { useThemeSettings, ThemeSettings, defaultSettings } from '../../contexts/ThemeContext';
import { ChromePicker, ColorResult } from 'react-color';
import { getErrorMessage } from '../../utils/storageHelpers';

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

const SettingsPanel: FC<SettingsPanelProps> = ({ onClose: _onClose }) => {
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
  const { settings, updateSettings } = useThemeSettings();
  const [localSettings, setLocalSettings] = useState<ThemeSettings>(settings);
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await updateProfile(profileData);
      setEditingProfile(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile'));
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
      setDeleteConfirmOpen(false);
      // Redirect will be handled by AuthContext
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete account'));
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof ThemeSettings, value: ThemeSettings[keyof ThemeSettings]) => {
    setLocalSettings({
      ...localSettings,
      [key]: value,
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save settings'));
    }
  };

  const handleCancel = () => {
    setLocalSettings(defaultSettings);
  };

  const fontFamilies = [
    'Roboto, Arial, sans-serif',
    'Open Sans, Arial, sans-serif',
    'Lato, Arial, sans-serif',
    'Montserrat, Arial, sans-serif',
    'Poppins, Arial, sans-serif',
    'Source Sans Pro, Arial, sans-serif',
    'Raleway, Arial, sans-serif',
    'Ubuntu, Arial, sans-serif',
  ];

  const handlePrimaryColorChange = (color: ColorResult) => {
    handleSettingChange('primaryColor', color.hex);
  };

  const handleSecondaryColorChange = (color: ColorResult) => {
    handleSettingChange('secondaryColor', color.hex);
  };

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          maxHeight: '100vh',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<PaletteIcon />} label="Theme" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<StorageIcon />} label="Storage" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ m: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          height: '100%'
        }}>
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h5" gutterBottom>
                Profile Settings
              </Typography>
              
              {loading && <LinearProgress />}
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={profileData.name}
                    onChange={handleProfileChange('name')}
                    disabled={!editingProfile}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Genre"
                    value={profileData.genre}
                    onChange={handleProfileChange('genre')}
                    disabled={!editingProfile}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    value={profileData.bio}
                    onChange={handleProfileChange('bio')}
                    disabled={!editingProfile}
                    multiline
                    rows={4}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profileData.location}
                    onChange={handleProfileChange('location')}
                    disabled={!editingProfile}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                {!editingProfile ? (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingProfile(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileData({
                          name: artistProfile?.name || '',
                          bio: artistProfile?.bio || '',
                          genre: artistProfile?.genre || '',
                          location: artistProfile?.location || '',
                          photoURL: artistProfile?.photoURL || currentUser?.photoURL || '',
                          socialLinks: artistProfile?.socialLinks || {},
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      Save
                    </Button>
                  </>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Danger Zone
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete Account
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" gutterBottom>
                Theme Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <ColorLensIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Colors
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Primary Color
                        </Typography>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: localSettings.primaryColor,
                              border: `1px solid ${theme.palette.divider}`,
                              cursor: 'pointer',
                            }}
                            onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                          />
                          <TextField
                            fullWidth
                            value={localSettings.primaryColor}
                            onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        {showPrimaryColorPicker && (
                          <Box sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
                            <ChromePicker
                              color={localSettings.primaryColor}
                              onChange={handlePrimaryColorChange}
                            />
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Secondary Color
                        </Typography>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: localSettings.secondaryColor,
                              border: `1px solid ${theme.palette.divider}`,
                              cursor: 'pointer',
                            }}
                            onClick={() => setShowSecondaryColorPicker(!showSecondaryColorPicker)}
                          />
                          <TextField
                            fullWidth
                            value={localSettings.secondaryColor}
                            onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        {showSecondaryColorPicker && (
                          <Box sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
                            <ChromePicker
                              color={localSettings.secondaryColor}
                              onChange={handleSecondaryColorChange}
                            />
                          </Box>
                        )}
                      </Box>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.darkMode}
                            onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Dark Mode"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <TextFieldsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Typography
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Font Family
                        </Typography>
                        <FormControl fullWidth variant="outlined" size="small">
                          <InputLabel id="font-family-label">Font Family</InputLabel>
                          <Select
                            labelId="font-family-label"
                            value={localSettings.fontFamily}
                            onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                            label="Font Family"
                          >
                            {fontFamilies.map((font) => (
                              <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                                {font.split(',')[0]}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Font Size: {localSettings.fontSize}px
                        </Typography>
                        <Slider
                          value={localSettings.fontSize}
                          onChange={(_, value) => handleSettingChange('fontSize', typeof value === 'number' ? value : value[0])}
                          min={10}
                          max={20}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <BorderRadiusIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Layout
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Border Radius: {localSettings.borderRadius}px
                        </Typography>
                        <Slider
                          value={localSettings.borderRadius}
                          onChange={(_, value) => handleSettingChange('borderRadius', typeof value === 'number' ? value : value[0])}
                          min={0}
                          max={16}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Spacing: {localSettings.spacing}px
                        </Typography>
                        <Slider
                          value={localSettings.spacing}
                          onChange={(_, value) => handleSettingChange('spacing', typeof value === 'number' ? value : value[0])}
                          min={4}
                          max={16}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AnimationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Effects
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.animations}
                            onChange={(e) => handleSettingChange('animations', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Enable Animations"
                      />
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Animations make the interface feel more responsive and engaging.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                >
                  Apply Theme
                </Button>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Typography variant="h5" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body1" paragraph>
              Security settings will be available in a future update.
            </Typography>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Typography variant="h5" gutterBottom>
              Storage Settings
            </Typography>
            <Typography variant="body1" paragraph>
              Storage settings will be available in a future update.
            </Typography>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPanel; 