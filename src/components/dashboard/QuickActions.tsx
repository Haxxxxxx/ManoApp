import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AlbumIcon from '@mui/icons-material/Album';
import BarChartIcon from '@mui/icons-material/BarChart';

interface QuickActionsProps {
  onUploadClick: () => void;
  onPlaylistClick: () => void;
  onAnalyticsClick: () => void;
  uploading: boolean;
  creating: boolean;
  onCreateProject: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  onUploadClick, 
  onPlaylistClick, 
  onAnalyticsClick, 
  uploading, 
  creating,
  onCreateProject 
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onCreateProject}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 2,
              boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
              }
            }}
          >
            Create Project
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={onUploadClick}
            disabled={uploading}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 2,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              '&:hover': {
                borderColor: 'secondary.dark',
                bgcolor: 'rgba(124, 77, 255, 0.05)',
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Song'}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<PlaylistAddIcon />}
            onClick={onPlaylistClick}
            disabled={creating}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 2,
              borderColor: 'success.main',
              color: 'success.main',
              '&:hover': {
                borderColor: 'success.dark',
                bgcolor: 'rgba(102, 187, 106, 0.05)',
              }
            }}
          >
            {creating ? 'Creating...' : 'Create Playlist'}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<AlbumIcon />}
            onClick={() => navigate('/albums/create')}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 2,
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                bgcolor: 'rgba(255, 167, 38, 0.05)',
              }
            }}
          >
            Customize Album
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={onAnalyticsClick}
            sx={{ 
              py: 1.5,
              px: 3,
              borderRadius: 2,
              borderColor: 'info.main',
              color: 'info.main',
              '&:hover': {
                borderColor: 'info.dark',
                bgcolor: 'rgba(41, 182, 246, 0.05)',
              }
            }}
          >
            View Analytics
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickActions; 