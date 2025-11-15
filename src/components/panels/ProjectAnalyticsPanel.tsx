import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress, Button } from '@mui/material';
import { Song } from '../../types';
import { parseDurationToSeconds, formatDuration } from '../../utils/formatters';

interface ProjectAnalyticsPanelProps {
  songs: Song[];
  onClose: () => void;
}

const ProjectAnalyticsPanel = ({ songs, onClose }: ProjectAnalyticsPanelProps) => {
  // Calculate statistics
  const totalSongs = songs.length;
  const totalDuration = songs.reduce((acc, song) => {
    return acc + parseDurationToSeconds(song.duration);
  }, 0);
  const averageBpm = songs.reduce((acc, song) => acc + (song.metadata?.bpm || 0), 0) / totalSongs || 0;
  
  // Mock data for genre distribution
  const genreDistribution = [
    { genre: 'Pop', percentage: 40 },
    { genre: 'Rock', percentage: 30 },
    { genre: 'Electronic', percentage: 20 },
    { genre: 'Hip Hop', percentage: 10 },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Project Analytics</Typography>
        <Button onClick={onClose}>Close</Button>
      </Box>
      <Paper sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Project Analytics</Typography>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Songs
                </Typography>
                <Typography variant="h4">
                  {totalSongs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Duration
                </Typography>
                <Typography variant="h4">
                  {formatDuration(totalDuration)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average BPM
                </Typography>
                <Typography variant="h4">
                  {Math.round(averageBpm)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Project Status
                </Typography>
                <Typography variant="h4">
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Genre Distribution */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Genre Distribution
          </Typography>
          <Box sx={{ mt: 2 }}>
            {genreDistribution.map((item) => (
              <Box key={item.genre} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item.genre}</Typography>
                  <Typography variant="body2">{item.percentage}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.percentage} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Activity Timeline */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Box sx={{ mt: 2 }}>
            {/* Add timeline component here */}
            <Typography color="textSecondary">
              Timeline visualization coming soon...
            </Typography>
          </Box>
        </Paper>
      </Paper>
    </Box>
  );
};

export default ProjectAnalyticsPanel; 