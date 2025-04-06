import { Box, Avatar, Typography, Button, Stack } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GarageIcon from '@mui/icons-material/Garage';
import FolderIcon from '@mui/icons-material/Folder';

const RightPanel = () => {
  return (
    <Box
      sx={{
        width: 300,
        bgcolor: 'background.paper',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* User Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{ width: 64, height: 64 }}
          src="https://via.placeholder.com/64"
        />
        <Box>
          <Typography variant="h6">John Doe</Typography>
          <Typography variant="body2" color="text.secondary">
            Music Producer & DJ
          </Typography>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Stack spacing={2}>
        <Button
          variant="contained"
          startIcon={<PublishIcon />}
          fullWidth
        >
          Export to Spotify
        </Button>

        <Button
          variant="outlined"
          startIcon={<MusicNoteIcon />}
          fullWidth
        >
          Music Panel
        </Button>

        <Button
          variant="outlined"
          startIcon={<GarageIcon />}
          fullWidth
        >
          My Garage
        </Button>

        <Button
          variant="outlined"
          startIcon={<FolderIcon />}
          fullWidth
        >
          All Projects
        </Button>
      </Stack>
    </Box>
  );
};

export default RightPanel; 