import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

interface StatisticsCardsProps {
  totalProjects: number;
  totalSongs: number;
  activeProjects: number;
  totalCollaborators: number;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ 
  totalProjects, 
  totalSongs, 
  activeProjects, 
  totalCollaborators 
}) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <FolderIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {totalProjects}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Projects
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.secondary.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.secondary.main, 0.2),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <MusicNoteIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color="secondary.main">
            {totalSongs}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Songs
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.success.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.2),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color="success.main">
            {activeProjects}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Active Projects
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.2),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <GroupAddIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color="info.main">
            {totalCollaborators}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Collaborators
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default StatisticsCards; 