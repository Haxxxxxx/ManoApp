import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAIMetadata } from '../../hooks/useAIMetadata';
import type { Song } from '../../types/song';

interface AutoTagPanelProps {
  song: Song;
  tripId: string;
  onSongUpdated: (updatedSong: Song) => void;
  onClose: () => void;
}

const AutoTagPanel: React.FC<AutoTagPanelProps> = ({ song, tripId, onSongUpdated, onClose }) => {
  const { aiMetadata, loading, applied, error, generate, apply, undo } = useAIMetadata(song, tripId);
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());

  const toggleExclude = (key: string) => {
    setExcludedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isExcluded = (key: string) => excludedKeys.has(key);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          AI Tag Suggestions
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {!aiMetadata && !loading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5, mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Let AI analyze your track and suggest metadata like BPM, key, genres, and tags.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={generate}
            fullWidth
          >
            Generate Suggestions
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Analyzing audio...
          </Typography>
          <Typography variant="caption" color="text.secondary">
            This may use mock data in development
          </Typography>
        </Box>
      )}

      {aiMetadata && (
        <Stack spacing={2}>
          {aiMetadata.bpm?.bpm && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                opacity: isExcluded('bpm') ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">BPM</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {aiMetadata.bpm.bpm}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({Math.round((aiMetadata.bpm.confidence || 0) * 100)}% confidence)
                    </Typography>
                  </Typography>
                </Box>
                <Tooltip title={isExcluded('bpm') ? 'Include in apply' : 'Exclude from apply'}>
                  <IconButton size="small" onClick={() => toggleExclude('bpm')}>
                    {isExcluded('bpm') ? <CloseIcon fontSize="small" color="error" /> : <CheckIcon fontSize="small" color="success" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          )}

          {aiMetadata.key?.key && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                opacity: isExcluded('key') ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Key</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {aiMetadata.key.key} {aiMetadata.key.scale}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({Math.round((aiMetadata.key.confidence || 0) * 100)}% confidence)
                    </Typography>
                  </Typography>
                </Box>
                <Tooltip title={isExcluded('key') ? 'Include in apply' : 'Exclude from apply'}>
                  <IconButton size="small" onClick={() => toggleExclude('key')}>
                    {isExcluded('key') ? <CloseIcon fontSize="small" color="error" /> : <CheckIcon fontSize="small" color="success" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          )}

          {aiMetadata.genres && aiMetadata.genres.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                opacity: isExcluded('genres') ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Genres</Typography>
                <Tooltip title={isExcluded('genres') ? 'Include in apply' : 'Exclude from apply'}>
                  <IconButton size="small" onClick={() => toggleExclude('genres')}>
                    {isExcluded('genres') ? <CloseIcon fontSize="small" color="error" /> : <CheckIcon fontSize="small" color="success" />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {aiMetadata.genres.map((g) => (
                  <Chip
                    key={g.tag}
                    label={`${g.tag} (${Math.round((g.confidence || 0) * 100)}%)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          )}

          {aiMetadata.suggestedTags && aiMetadata.suggestedTags.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                opacity: isExcluded('tags') ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Tags</Typography>
                <Tooltip title={isExcluded('tags') ? 'Include in apply' : 'Exclude from apply'}>
                  <IconButton size="small" onClick={() => toggleExclude('tags')}>
                    {isExcluded('tags') ? <CloseIcon fontSize="small" color="error" /> : <CheckIcon fontSize="small" color="success" />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {aiMetadata.suggestedTags.map((t) => {
                  const tag = typeof t === 'string' ? t : t.tag;
                  return <Chip key={tag} label={tag} size="small" variant="outlined" />;
                })}
              </Box>
            </Paper>
          )}

          {applied ? (
            <Alert
              severity="success"
              action={
                <Button size="small" startIcon={<UndoIcon />} onClick={() => undo(onSongUpdated)}>
                  Undo
                </Button>
              }
            >
              Suggestions applied to song metadata
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() => apply(onSongUpdated)}
                fullWidth
                disabled={Object.keys(aiMetadata).length === 0}
              >
                Apply Selected
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={generate}
              >
                Regenerate
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default AutoTagPanel;
