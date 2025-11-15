import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  LinearProgress,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  MusicNote as MusicNoteIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  CloudUpload as CloudUploadIcon,
  Album as AlbumIcon,
  BarChart as BarChartIcon,
  CalendarToday as CalendarIcon,
  Tag as TagIcon,
  Comment as CommentIcon,
  Checklist as ChecklistIcon,
} from '@mui/icons-material';
import { isFeatureEnabled } from '../../config/features';
import { useNavigate } from 'react-router-dom';
import { Trip, TripStatus } from '../../types/trip';
import { Song } from '../../types/song';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useSongs } from '../../hooks/useSongs';
import { useTrip } from '../../hooks/useTrip';
import { formatDuration, parseDurationToSeconds } from '../../utils/formatters';
import { formatDate } from '../../utils/formatters';
import StatusPipeline from '../common/StatusPipeline';
import { useToast } from '../../hooks/useToast';

interface ProjectOverviewPanelProps {
  trip?: Trip;
  tripId?: string;
  songs?: Song[];
  onClose: () => void;
  onStatusChange?: (newStatus: TripStatus) => void;
  onCreateAlbum?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  setActivePanel?: (panel: string) => void;
}

const ProjectOverviewPanel: React.FC<ProjectOverviewPanelProps> = ({
  trip,
  tripId,
  songs: propSongs,
  onClose,
  onStatusChange,
  onCreateAlbum,
  onExport,
  onShare,
  onEdit,
  setActivePanel,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError, ToastComponent } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { songs: hookSongs, loading: songsLoading } = useSongs(tripId ? { tripId } : {});
  const { trip: hookTrip, updateTripData, loading: tripLoading } = useTrip(tripId ? { tripId } : {});
  const songs = propSongs || hookSongs;
  const currentTrip = trip || hookTrip;
  const isLoading = (tripLoading || songsLoading) && !trip && !propSongs;
  
  const handleStatusChange = async (newStatus: TripStatus) => {
    if (!currentTrip || !tripId) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateTripData({ status: newStatus });
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      showSuccess('Project status updated successfully');
    } catch (error) {
      showError('Failed to update project status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewAnalytics = () => {
    if (setActivePanel) {
      setActivePanel('analytics');
    } else if (currentTrip?.id) {
      navigate(`/project/${currentTrip.id}/analytics`);
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 4 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }
  
  if (!currentTrip) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No project selected
        </Typography>
      </Box>
    );
  }

  // Calculate project statistics
  const stats = useMemo(() => {
    const totalSongs = songs.length;
    const totalDuration = songs.reduce((acc, song) => {
      const duration = typeof song.duration === 'string' 
        ? parseDurationToSeconds(song.duration) 
        : song.duration;
      return acc + (duration || 0);
    }, 0);
    const totalCollaborators = currentTrip.collaborators?.length || 0;
    const genres = new Set<string>();
    const tags = new Set<string>();
    
    songs.forEach(song => {
      if (song.metadata?.genre) {
        if (Array.isArray(song.metadata.genre)) {
          song.metadata.genre.forEach(g => genres.add(g));
        } else {
          genres.add(song.metadata.genre);
        }
      }
      if (song.metadata?.tags) {
        song.metadata.tags.forEach(tag => tags.add(tag));
      }
    });

    return {
      totalSongs,
      totalDuration,
      totalCollaborators,
      uniqueGenres: genres.size,
      uniqueTags: tags.size,
      formattedDuration: formatDuration(totalDuration),
    };
  }, [songs, currentTrip.collaborators]);

  const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({
    icon,
    label,
    value,
    color = 'primary',
  }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0px 8px 16px ${alpha(theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main, 0.2)}`,
          borderColor: theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main, 0.1),
              color: theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const QuickActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    variant?: 'contained' | 'outlined';
  }> = ({ icon, label, onClick, color = 'primary', variant = 'outlined' }) => (
    <Button
      variant={variant}
      startIcon={icon}
      onClick={onClick}
      fullWidth
      sx={{
        borderRadius: 2,
        py: 1.5,
        textTransform: 'none',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: variant === 'contained' ? 4 : 2,
        },
      }}
      color={color}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Project Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTrip.description || 'No description provided'}
          </Typography>
        </Box>
        {onEdit && (
          <Tooltip title="Edit Project" arrow>
            <IconButton
              onClick={onEdit}
              sx={{
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.1)',
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<MusicNoteIcon />}
            label="Songs"
            value={stats.totalSongs}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<AccessTimeIcon />}
            label="Total Duration"
            value={stats.formattedDuration}
            color="secondary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<PeopleIcon />}
            label="Collaborators"
            value={stats.totalCollaborators}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<TagIcon />}
            label="Genres"
            value={stats.uniqueGenres}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Status Pipeline */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
          Project Status
        </Typography>
        {isUpdatingStatus && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        <StatusPipeline
          currentStatus={currentTrip.status || 'draft'}
          onStatusChange={handleStatusChange}
          compact={false}
          showDescriptions={true}
        />
      </Paper>

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {onCreateAlbum && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<AlbumIcon />}
                label="Create Album"
                onClick={onCreateAlbum}
                color="primary"
                variant="contained"
              />
            </Grid>
          )}
          {onExport && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<CloudUploadIcon />}
                label="Export Project"
                onClick={onExport}
                color="secondary"
              />
            </Grid>
          )}
          {onShare && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<ShareIcon />}
                label="Share Project"
                onClick={onShare}
                color="info"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionButton
              icon={<BarChartIcon />}
              label="View Analytics"
              onClick={handleViewAnalytics}
              color="success"
            />
          </Grid>
          {isFeatureEnabled('comments') && setActivePanel && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<CommentIcon />}
                label="Comments"
                onClick={() => setActivePanel('comments')}
                color="info"
              />
            </Grid>
          )}
          {isFeatureEnabled('releaseChecklist') && setActivePanel && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<ChecklistIcon />}
                label="Release Planning"
                onClick={() => setActivePanel('release-planning')}
                color="warning"
              />
            </Grid>
          )}
          {isFeatureEnabled('gdriveImport') && setActivePanel && (
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionButton
                icon={<CloudDownloadIcon />}
                label="Import from Drive"
                onClick={() => setActivePanel('gdrive-import')}
                color="info"
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Project Info */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Project Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Created"
                  secondary={currentTrip.createdAt ? formatDate(currentTrip.createdAt) : 'Unknown'}
                />
              </ListItem>
              {currentTrip.updatedAt && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Updated"
                    secondary={formatDate(currentTrip.updatedAt)}
                  />
                </ListItem>
              )}
              {currentTrip.type && (
                <ListItem>
                  <ListItemIcon>
                    <MusicNoteIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Type"
                    secondary={currentTrip.type.charAt(0).toUpperCase() + currentTrip.type.slice(1)}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Tags & Categories
            </Typography>
            {currentTrip.tags && currentTrip.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {currentTrip.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags added yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Toast Component */}
      <ToastComponent />
    </Box>
  );
};

export default ProjectOverviewPanel;

