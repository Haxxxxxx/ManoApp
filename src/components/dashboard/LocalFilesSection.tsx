import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Song } from '../../types/song';

interface LocalFilesSectionProps {
  localFiles: Song[];
  loading: boolean;
  onFolderSelect: () => void;
  onSongClick: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
}

const LocalFilesSection: React.FC<LocalFilesSectionProps> = ({
  localFiles,
  loading,
  onFolderSelect,
  onSongClick,
  onDeleteSong
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (localFiles.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Local Files
          </Typography>
          <Button
            variant="text"
            color="primary"
            startIcon={<FolderOpenIcon />}
            onClick={onFolderSelect}
          >
            Add Folder
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
            mb: 4
          }}
        >
          <AudioFileIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No local files yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your local music files to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FolderOpenIcon />}
            onClick={onFolderSelect}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
              }
            }}
          >
            Add Folder
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Local Files
        </Typography>
        <Button
          variant="text"
          color="primary"
          startIcon={<FolderOpenIcon />}
          onClick={onFolderSelect}
        >
          Add Folder
        </Button>
      </Box>
      <Grid container spacing={3}>
        {localFiles.map((song) => (
          <Grid item xs={12} sm={6} md={4} key={song.id}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
                  borderColor: 'primary.main',
                },
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Box onClick={() => onSongClick(song)}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AudioFileIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
                </CardMedia>
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {song.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                    {song.artist}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MusicNoteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {song.metadata?._fileSize ? `${(song.metadata._fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </Typography>
                  </Box>
                </CardContent>
              </Box>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSong(song.id);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    bgcolor: 'error.light',
                    color: 'white',
                  },
                  zIndex: 1,
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LocalFilesSection; 