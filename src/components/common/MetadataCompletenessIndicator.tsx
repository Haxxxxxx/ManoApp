import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Song } from '../../types/song';
import { calculateMetadataCompleteness } from '../../utils/metadataCompleteness';

interface MetadataCompletenessIndicatorProps {
  song: Song;
  compact?: boolean;
  showDetails?: boolean;
  onFieldClick?: (tabIndex: number) => void;
}

const colorMap = {
  error: 'error' as const,
  warning: 'warning' as const,
  info: 'info' as const,
  success: 'success' as const,
};

const MetadataCompletenessIndicator: React.FC<MetadataCompletenessIndicatorProps> = ({
  song,
  compact = false,
  showDetails = false,
  onFieldClick,
}) => {
  const result = calculateMetadataCompleteness(song);

  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
        {result.label} — {result.score}%
      </Typography>
      {result.missingFields.length > 0 && (
        <>
          <Typography variant="caption" color="warning.light" sx={{ display: 'block', mb: 0.25 }}>
            Missing:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {result.missingFields.map((f) => f.label).join(', ')}
          </Typography>
        </>
      )}
      {result.filledFields.length > 0 && (
        <>
          <Typography variant="caption" color="success.light" sx={{ display: 'block', mt: 0.5, mb: 0.25 }}>
            Filled:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {result.filledFields.join(', ')}
          </Typography>
        </>
      )}
    </Box>
  );

  if (compact) {
    return (
      <Tooltip title={tooltipContent}>
        <Box sx={{ position: 'relative', display: 'inline-flex', ml: 1 }}>
          <CircularProgress
            variant="determinate"
            value={result.score}
            size={28}
            thickness={4}
            color={colorMap[result.color]}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
              {result.score}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {result.color === 'success' ? (
          <CheckCircleIcon fontSize="small" color="success" />
        ) : (
          <WarningAmberIcon fontSize="small" color={colorMap[result.color]} />
        )}
        <Chip label={result.label} size="small" color={colorMap[result.color]} variant="outlined" />
        <Typography variant="caption" color="text.secondary">
          {result.score}% ({result.filledFields.length}/{result.filledFields.length + result.missingFields.length} fields)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={result.score}
        color={colorMap[result.color]}
        sx={{ height: 6, borderRadius: 3 }}
      />
      {showDetails && result.missingFields.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Missing fields:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {result.missingFields.map((field) => (
              <Chip
                key={field.key}
                label={field.label}
                size="small"
                variant="outlined"
                color="warning"
                sx={{ fontSize: '0.7rem', cursor: onFieldClick ? 'pointer' : 'default' }}
                onClick={onFieldClick ? () => onFieldClick(field.tabIndex) : undefined}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MetadataCompletenessIndicator;
