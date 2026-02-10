/**
 * AI Metadata Suggestions Component
 * 
 * Displays AI-generated metadata suggestions and allows users to accept/ignore them.
 * Shows suggested tags, BPM, key, genres, and moods with confidence scores.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
  Collapse,
  Stack,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Undo as UndoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { AIMetadata, ApplyAISuggestionsOptions } from '../../types/ai';
import { Song } from '../../types/song';

interface AIMetadataSuggestionsProps {
  /** AI metadata suggestions to display */
  aiMetadata: AIMetadata;
  /** Current song data */
  song: Song;
  /** Callback when suggestions are applied */
  onApply: (options: ApplyAISuggestionsOptions) => Promise<void>;
  /** Callback to undo applied suggestions */
  onUndo?: () => Promise<void>;
  /** Whether suggestions have been applied */
  applied?: boolean;
  /** Loading state */
  loading?: boolean;
}

const AIMetadataSuggestions: React.FC<AIMetadataSuggestionsProps> = ({
  aiMetadata,
  song: _song,
  onApply,
  onUndo,
  applied = false,
  loading = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  // Initialize selected tags with high-confidence suggestions
  React.useEffect(() => {
    if (!applied && aiMetadata.suggestedTags) {
      const highConfidenceTags = aiMetadata.suggestedTags
        .filter((tag) => tag.confidence >= 0.7)
        .map((tag) => tag.tag);
      setSelectedTags(new Set(highConfidenceTags));
    }
  }, [aiMetadata, applied]);

  const handleToggleTag = (tag: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const handleApplyAll = async () => {
    setApplying(true);
    try {
      await onApply({
        applyAll: true,
        applyBPM: true,
        applyKey: true,
      });
    } catch (error) {
      // Error handling is done by parent
    } finally {
      setApplying(false);
    }
  };

  const handleApplySelected = async () => {
    setApplying(true);
    try {
      await onApply({
        tagsToApply: Array.from(selectedTags),
        applyBPM: true,
        applyKey: true,
      });
    } catch (error) {
      // Error handling is done by parent
    } finally {
      setApplying(false);
    }
  };

  const handleUndo = async () => {
    if (onUndo) {
      setApplying(true);
      try {
        await onUndo();
      } catch (error) {
        // Error handling is done by parent
      } finally {
        setApplying(false);
      }
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'default';
  };

  if (!aiMetadata || (!applied && aiMetadata.suggestedTags.length === 0)) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: applied ? 'success.main' : 'primary.main',
        bgcolor: applied
          ? alpha(theme.palette.success.main, 0.05)
          : alpha(theme.palette.primary.main, 0.05),
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            AI Suggestions
          </Typography>
          {applied && (
            <Chip
              label="Applied"
              size="small"
              color="success"
              icon={<CheckCircleIcon />}
            />
          )}
          {aiMetadata.overallConfidence && (
            <Chip
              label={`${Math.round(aiMetadata.overallConfidence * 100)}% confidence`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ color: 'text.secondary' }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Collapse in={expanded}>
        {/* Suggested Tags */}
        {aiMetadata.suggestedTags && aiMetadata.suggestedTags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
              Suggested Tags
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {aiMetadata.suggestedTags.map((suggestedTag, index) => {
                const isSelected = selectedTags.has(suggestedTag.tag);
                return (
                  <Chip
                    key={index}
                    label={`${suggestedTag.tag} (${Math.round(suggestedTag.confidence * 100)}%)`}
                    size="small"
                    color={getConfidenceColor(suggestedTag.confidence)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => !applied && handleToggleTag(suggestedTag.tag)}
                    sx={{
                      cursor: applied ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': applied ? {} : {
                        transform: 'scale(1.05)',
                        boxShadow: 2,
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* BPM and Key Suggestions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {aiMetadata.bpm && (
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Suggested BPM
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {aiMetadata.bpm.bpm}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(aiMetadata.bpm.confidence * 100)}% confidence
                </Typography>
              </Paper>
            </Grid>
          )}
          {aiMetadata.key && (
            <Grid item xs={12} sm={6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Suggested Key
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {aiMetadata.key.key}
                  {aiMetadata.key.scale && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({aiMetadata.key.scale})
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(aiMetadata.key.confidence * 100)}% confidence
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Genres and Moods */}
        {(aiMetadata.genres && aiMetadata.genres.length > 0) ||
        (aiMetadata.moods && aiMetadata.moods.length > 0) ? (
          <Box sx={{ mb: 3 }}>
            {aiMetadata.genres && aiMetadata.genres.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                  Genres
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {aiMetadata.genres.map((genre, index) => (
                    <Chip
                      key={index}
                      label={genre.tag}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {aiMetadata.moods && aiMetadata.moods.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                  Moods
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {aiMetadata.moods.map((mood, index) => (
                    <Chip
                      key={index}
                      label={mood.tag}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ) : null}

        {/* Action Buttons */}
        {!applied ? (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleApplySelected}
              disabled={applying || selectedTags.size === 0}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Apply Selected ({selectedTags.size} tags)
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={handleApplyAll}
              disabled={applying}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Apply All
            </Button>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={() => {
                // Ignore suggestions - just close/hide
                setExpanded(false);
              }}
              disabled={applying}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Ignore
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Alert severity="success" sx={{ flex: 1 }}>
              Suggestions have been applied to this song.
            </Alert>
            {onUndo && (
              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={applying}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Undo
              </Button>
            )}
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default AIMetadataSuggestions;

