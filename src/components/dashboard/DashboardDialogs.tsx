import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import type { Trip } from '../../types/trip';

interface AnalyticsData {
  totalSongs: number;
  totalProjects: number;
  recentActivity: any[];
  totalPlaylists: number;
  totalCollaborators: number;
  projectsByMonth: { [key: string]: number };
  songsByGenre: { [key: string]: number };
  topCollaborators: { userId: string; count: number }[];
}

interface DashboardDialogsProps {
  showUploadDialog: boolean;
  setShowUploadDialog: (show: boolean) => void;
  uploading: boolean;
  uploadProgress: number;
  onDrop: (files: File[]) => void;
  showPlaylistDialog: boolean;
  setShowPlaylistDialog: (show: boolean) => void;
  creating: boolean;
  playlistName: string;
  setPlaylistName: (name: string) => void;
  playlistDescription: string;
  setPlaylistDescription: (description: string) => void;
  playlistVisibility: 'private' | 'public' | 'unlisted';
  handleVisibilityChange: (event: SelectChangeEvent) => void;
  handleCreatePlaylist: () => void;
  showAnalyticsDialog: boolean;
  setShowAnalyticsDialog: (show: boolean) => void;
  analyticsData: AnalyticsData | null;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  tripToDelete: Trip | null;
  deletingTripId: string | null;
  confirmDeleteTrip: () => void;
  cancelDeleteTrip: () => void;
  showPathDialog: boolean;
  setShowPathDialog: (show: boolean) => void;
  scanningFiles: boolean;
  folderPath: string;
  setFolderPath: (path: string) => void;
  handlePathSubmit: () => void;
}

const DashboardDialogs: React.FC<DashboardDialogsProps> = ({
  showUploadDialog,
  setShowUploadDialog,
  uploading,
  uploadProgress,
  onDrop,
  showPlaylistDialog,
  setShowPlaylistDialog,
  creating,
  playlistName,
  setPlaylistName,
  playlistDescription,
  setPlaylistDescription,
  playlistVisibility,
  handleVisibilityChange,
  handleCreatePlaylist,
  showAnalyticsDialog,
  setShowAnalyticsDialog,
  analyticsData,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  tripToDelete,
  deletingTripId,
  confirmDeleteTrip,
  cancelDeleteTrip,
  showPathDialog,
  setShowPathDialog,
  scanningFiles,
  folderPath,
  setFolderPath,
  handlePathSubmit
}) => {
  const theme = useTheme();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
      'application/*': ['.flp']
    },
    onDrop
  });

  return (
    <>
      {/* Upload Dialog */}
      <Dialog 
        open={showUploadDialog} 
        onClose={() => !uploading && setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Songs</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
              mb: 2
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
          </Box>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress.toFixed(0)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)} disabled={uploading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playlist Dialog */}
      <Dialog 
        open={showPlaylistDialog} 
        onClose={() => !creating && setShowPlaylistDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Playlist Name"
            type="text"
            fullWidth
            variant="outlined"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select
              labelId="visibility-label"
              id="visibility"
              value={playlistVisibility}
              onChange={handleVisibilityChange}
              label="Visibility"
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="unlisted">Unlisted</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlaylistDialog(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreatePlaylist} variant="contained" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog 
        open={showAnalyticsDialog} 
        onClose={() => setShowAnalyticsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Global Analytics</DialogTitle>
        <DialogContent>
          {analyticsData ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
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
                      {analyticsData.totalProjects}
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
                      {analyticsData.totalSongs}
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
                    <PlaylistAddIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {analyticsData.totalPlaylists}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Playlists
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
                      {analyticsData.totalCollaborators}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Collaborators
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                Projects by Month
              </Typography>
              <Box sx={{ height: 200, mb: 4 }}>
                {/* Here you would add a chart component to visualize projects by month */}
                <Typography variant="body2" color="text.secondary">
                  Chart visualization would go here
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Songs by Genre
              </Typography>
              <Box sx={{ height: 200, mb: 4 }}>
                {/* Here you would add a chart component to visualize songs by genre */}
                <Typography variant="body2" color="text.secondary">
                  Chart visualization would go here
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Collaborators
              </Typography>
              <List>
                {analyticsData.topCollaborators.map((collaborator, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>{collaborator.userId.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={collaborator.userId} 
                      secondary={`${collaborator.count} projects`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalyticsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDeleteTrip}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{tripToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteTrip}>Cancel</Button>
          <Button 
            onClick={confirmDeleteTrip} 
            color="error"
            disabled={deletingTripId === tripToDelete?.id}
          >
            {deletingTripId === tripToDelete?.id ? (
              <CircularProgress size={24} />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Folder Path Dialog */}
      <Dialog
        open={showPathDialog}
        onClose={() => !scanningFiles && setShowPathDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Folder Path</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Enter the path to your music folder:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Path"
              type="text"
              fullWidth
              variant="outlined"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="e.g., C:\Music or /home/user/music"
              disabled={scanningFiles}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPathDialog(false)} 
            disabled={scanningFiles}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePathSubmit}
            variant="contained"
            disabled={scanningFiles || !folderPath.trim()}
          >
            {scanningFiles ? 'Scanning...' : 'Scan Folder'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardDialogs; 