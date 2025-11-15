import { Box, Avatar, Typography, Button, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

const RightPanel = () => {
  const { currentUser, artistProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Failed to log out
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: 'background.paper',
        height: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* Artist Profile */}
      {currentUser && artistProfile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{ width: 100, height: 100, mb: 2 }}
            src={artistProfile?.photoURL || currentUser?.photoURL || undefined}
          >
            {artistProfile?.name?.[0] || currentUser?.email?.[0]}
          </Avatar>
          <Typography variant="h6" gutterBottom>
            {artistProfile?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {currentUser?.email}
          </Typography>
          {artistProfile?.bio && (
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 2 }}>
              {artistProfile.bio}
            </Typography>
          )}
          {artistProfile?.genre && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, justifyContent: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {artistProfile.genre}
              </Typography>
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditProfile}
            sx={{ mb: 2 }}
          >
            Edit Profile
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      )}

      {/* Action Buttons */}
      <Stack spacing={2} sx={{ mt: 'auto' }}>
        <Button
          variant="contained"
          fullWidth
        >
          Export to Spotify
        </Button>

        <Button
          variant="outlined"
          fullWidth
        >
          Music Panel
        </Button>

        <Button
          variant="outlined"
          fullWidth
        >
          My Garage
        </Button>

        <Button
          variant="outlined"
          fullWidth
        >
          All Projects
        </Button>
      </Stack>
    </Box>
  );
};

export default RightPanel; 