import { Box, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, TextField, Button, Chip, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';

interface Collaborator {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatarUrl?: string;
}

interface CollaboratorsPanelProps {
  tripId: string;
  onClose: () => void;
}

const CollaboratorsPanel = ({ tripId, onClose }: CollaboratorsPanelProps) => {
  // Mock data - replace with real data from your backend
  const collaborators: Collaborator[] = [
    { id: '1', email: 'owner@example.com', role: 'owner' },
    { id: '2', email: 'editor@example.com', role: 'editor' },
    { id: '3', email: 'viewer@example.com', role: 'viewer' },
  ];

  const getRoleColor = (role: Collaborator['role']) => {
    switch (role) {
      case 'owner':
        return 'primary';
      case 'editor':
        return 'success';
      case 'viewer':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>Manage Collaborators</Typography>

        {/* Invite Form */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <TextField
            label="Email Address"
            placeholder="Enter collaborator's email"
            fullWidth
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
          >
            Invite
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Collaborators List */}
        <List>
          {collaborators.map((collaborator) => (
            <ListItem
              key={collaborator.id}
              secondaryAction={
                collaborator.role !== 'owner' && (
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemAvatar>
                <Avatar src={collaborator.avatarUrl}>
                  {collaborator.email[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={collaborator.email}
                secondary={
                  <Chip
                    label={collaborator.role.toUpperCase()}
                    size="small"
                    color={getRoleColor(collaborator.role)}
                    sx={{ mt: 1 }}
                  />
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Share Link */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>Share Link</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              value={`https://yourapp.com/trip/${tripId}`}
              InputProps={{
                readOnly: true,
              }}
            />
            <Button variant="outlined">
              Copy Link
            </Button>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CollaboratorsPanel; 