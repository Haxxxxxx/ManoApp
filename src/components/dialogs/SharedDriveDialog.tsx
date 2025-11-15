import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface SharedDriveFile {
  name: string;
  fullPath: string;
  url: string;
}

interface SharedDriveDialogProps {
  open: boolean;
  onClose: () => void;
  files: SharedDriveFile[];
  loading: boolean;
  error: string | null;
}

const SharedDriveDialog: React.FC<SharedDriveDialogProps> = ({
  open,
  onClose,
  files,
  loading,
  error
}) => {
  const handleDownload = async (file: SharedDriveFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Error downloading file
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Shared Drive</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : files.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No files found in shared drive.
          </Typography>
        ) : (
          <List>
            {files.map((file) => (
              <ListItem key={file.fullPath}>
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={file.name}
                  secondary={file.fullPath}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleDownload(file)}
                    title="Download file"
                  >
                    <DownloadIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SharedDriveDialog; 