import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  alpha,
  SvgIconProps
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ArtistProfile } from '../../types/artist';
import { getUserProfile, updateUserProfile } from '../../services/firebaseService';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LinkIcon from '@mui/icons-material/Link';

// Map of platform names to their corresponding icon components
const platformIcons: { [key: string]: React.ComponentType<SvgIconProps> } = {
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  website: LanguageIcon,
  soundcloud: MusicNoteIcon,
  spotify: MusicNoteIcon,
  deezer: MusicNoteIcon,
  tiktok: LinkIcon,
};

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
      } catch (err) {
        // Error fetching profile
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!profile || !currentUser) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create a partial profile with only the fields that have been changed
      const updatedFields: Partial<ArtistProfile> = {};
      
      // Only include fields that have values
      if (profile.name) updatedFields.name = profile.name;
      if (profile.email) updatedFields.email = profile.email;
      if (profile.bio) updatedFields.bio = profile.bio;
      if (profile.genre) updatedFields.genre = profile.genre;
      if (profile.location) updatedFields.location = profile.location;
      if (profile.photoURL) updatedFields.photoURL = profile.photoURL;
      if (profile.coverImage) updatedFields.coverImage = profile.coverImage;
      if (profile.socialLinks) updatedFields.socialLinks = profile.socialLinks;
      
      await updateProfile(updatedFields);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      // Error updating profile
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    if (!profile) return;

    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value
        }
      };
    });
  };

  if (loading && !profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <Alert severity="error">Failed to load profile</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default', display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: '900px', p: 2 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="bold">Profile Settings</Typography>
            <IconButton 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              color={isEditing ? "primary" : "default"}
              aria-label={isEditing ? "Save changes" : "Edit profile"}
            >
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </IconButton>
          </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Basic Info */}
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={profile.photoURL || undefined}
                sx={{ width: 100, height: 100 }}
              />
            </Grid>
            <Grid item xs>
              <TextField
                fullWidth
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile(prev => prev ? {...prev, name: e.target.value} : prev)}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Bio and Location */}
        <Box>
          <Typography variant="h6" gutterBottom>About</Typography>
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : prev)}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={profile.location || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, location: e.target.value} : prev)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Genre"
                value={profile.genre || ''}
                onChange={(e) => setProfile(prev => prev ? {...prev, genre: e.target.value} : prev)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MusicNoteIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Social Links */}
        <Box>
          <Typography variant="h6" gutterBottom>Social Links</Typography>
          <Grid container spacing={2}>
            {Object.entries(platformIcons).map(([platform, IconComponent]) => (
              <Grid item xs={12} sm={6} key={platform}>
                <TextField
                  fullWidth
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={profile.socialLinks?.[platform] || ''}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconComponent />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Save Button (for mobile) */}
        <Box mt={3} display={{ xs: 'block', sm: 'none' }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save Changes
          </Button>
        </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProfilePage; 