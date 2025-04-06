import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { Song } from '../../types';

interface ProjectAnalyticsPanelProps {
  songs: Song[];
  onClose: () => void;
}

const ProjectAnalyticsPanel = ({ songs, onClose }: ProjectAnalyticsPanelProps) => {
  // Calculate statistics
  const totalSongs = songs.length;
  const totalDuration = songs.reduce((acc, song) => acc + (parseInt(song.duration) || 0), 0);
  const averageBpm = songs.reduce((acc, song) => acc + (song.metadata?.bpm || 0), 0) / totalSongs;
  
  // Mock data for genre distribution
  const genreDistribution = [
    { genre: 'Hip Hop', percentage: 40 },
    { genre: 'R&B', percentage: 30 },
    { genre: 'Pop', percentage: 20 },
    { genre: 'Other', percentage: 10 },
  ];

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
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
                  {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
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