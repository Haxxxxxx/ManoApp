import React from 'react';
import { Box, Typography, Button, Paper, alpha, useTheme } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Reusable empty state component with consistent styling
 * Provides helpful guidance when there's no data to display
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  sx
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
        textAlign: 'center',
        ...sx
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
              boxShadow: `0px 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              padding: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover::before': {
              opacity: 0.3,
            }
          }}
        >
          <Box
            sx={{
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.05)',
                },
              },
            }}
          >
            {icon}
          </Box>
        </Box>
        
        <Typography 
          variant="h5" 
          fontWeight="bold" 
          gutterBottom
          sx={{ mb: 1 }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
        >
          {description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && onAction && (
            <Button
              variant="contained"
              onClick={onAction}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                boxShadow: `0px 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  boxShadow: `0px 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {actionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outlined"
              onClick={onSecondaryAction}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                }
              }}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default EmptyState;

