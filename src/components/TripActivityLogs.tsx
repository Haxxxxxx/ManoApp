import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  MusicNote as MusicNoteIcon,
  PlaylistAdd as PlaylistAddIcon,
  PlaylistRemove as PlaylistRemoveIcon,
} from '@mui/icons-material';
import { getTripLogs } from '../services/firebaseService';
import { formatDistanceToNow } from 'date-fns';

interface TripActivityLogsProps {
  tripId: string;
}

const TripActivityLogs: React.FC<TripActivityLogsProps> = ({ tripId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const activityLogs = await getTripLogs(tripId);
        setLogs(activityLogs);
      } catch (err) {
        console.error('Error fetching trip logs:', err);
        setError('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [tripId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add_collaborator':
        return <AddIcon color="success" />;
      case 'remove_collaborator':
        return <RemoveIcon color="error" />;
      case 'edit_trip':
        return <EditIcon color="primary" />;
      case 'add_song':
        return <MusicNoteIcon color="primary" />;
      case 'remove_song':
        return <MusicNoteIcon color="error" />;
      case 'add_to_playlist':
        return <PlaylistAddIcon color="success" />;
      case 'remove_from_playlist':
        return <PlaylistRemoveIcon color="error" />;
      default:
        return <EditIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (logs.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No activity logs yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Activity Log
      </Typography>
      <Paper>
        <List>
          {logs.map((log, index) => (
            <React.Fragment key={log.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    {getActionIcon(log.action)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={log.details}
                  secondary={formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                />
              </ListItem>
              {index < logs.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default TripActivityLogs; 