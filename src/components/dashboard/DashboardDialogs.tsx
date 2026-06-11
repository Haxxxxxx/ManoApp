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
import type { DashboardAnalyticsData as AnalyticsData } from '../../types/analytics';

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
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.paper} 100%)`,
          }
        }}
        TransitionProps={{
          timeout: { enter: 300, exit: 200 },
        }}
      >
        <DialogTitle>Upload Songs</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              p: 4,
              border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 3,
              bgcolor: isDragActive 
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                : 'background.paper',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                transition: 'left 0.5s ease',
              },
              '&:hover': {
                borderColor: 'primary.main',
                borderWidth: 2,
                bgcolor: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                transform: 'translateY(-2px)',
                boxShadow: `0px 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                '&::before': {
                  left: '100%',
                },
              },
              mb: 2
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon 
              sx={{ 
                fontSize: 64, 
                color: isDragActive ? 'primary.main' : 'text.secondary', 
                mb: 2,
                transition: 'all 0.3s ease',
                transform: isDragActive ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
              }} 
            />
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.paper} 100%)`,
          }
        }}
        TransitionProps={{
          timeout: { enter: 300, exit: 200 },
        }}
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
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
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
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: theme.palette.primary.main,
                  },
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: theme.palette.primary.main,
              },
            }}
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
          <Button 
            onClick={handleCreatePlaylist} 
            variant="contained" 
            disabled={creating}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover:not(:disabled)': {
                transform: 'translateY(-2px)',
                boxShadow: `0px 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              '&:active:not(:disabled)': {
                transform: 'translateY(0)',
              },
            }}
          >
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