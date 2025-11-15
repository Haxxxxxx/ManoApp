import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSong } from '../../services/firebaseService';
import { useEffect, useState } from 'react';
import { Song } from '../../types';

const SongDetail = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    const fetchSong = async () => {
      if (songId) {
        const songData = await getSong(songId);
        setSong(songData);
      }
    };

    fetchSong();
  }, [songId]);

  if (!song) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Song not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Trip
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {song.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {song.artist}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Duration: {song.duration}
            </Typography>

            {song.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1">{song.notes}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }}>
            {song.metadata && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Metadata
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {song.metadata.bpm && (
                    <Chip label={`BPM: ${song.metadata.bpm}`} />
                  )}
                  {song.metadata.key && (
                    <Chip label={`Key: ${song.metadata.key}`} />
                  )}
                </Box>
                {song.metadata.genre && song.metadata.genre.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Genres:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {song.metadata.genre.map((genre) => (
                        <Chip key={genre} label={genre} />
                      ))}
                    </Box>
                  </Box>
                )}
                {song.metadata.tags && song.metadata.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Tags:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {song.metadata.tags.map((tag) => (
                        <Chip key={tag} label={tag} variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SongDetail; 