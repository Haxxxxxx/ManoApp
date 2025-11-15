import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Tooltip,
  alpha,
  useTheme
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
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Tooltip title="Create a new project (Ctrl+N)" arrow>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onCreateProject}
              sx={{ 
                py: 1.5,
                px: 3,
                borderRadius: 2,
                boxShadow: `0px 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: `0px 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              Create Project
            </Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="Upload audio files (Ctrl+U)" arrow>
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
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'secondary.dark',
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.6,
                }
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Song'}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="Create a new playlist" arrow>
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
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.6,
                }
              }}
            >
              {creating ? 'Creating...' : 'Create Playlist'}
            </Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="Customize and create albums" arrow>
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
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'warning.dark',
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Customize Album
            </Button>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="View analytics and statistics" arrow>
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
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'info.dark',
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  transform: 'translateY(-2px)',
                }
              }}
            >
              View Analytics
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickActions; 