import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent, alpha, useTheme } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'statistics';
  count?: number;
}

/**
 * Reusable skeleton loader component for better perceived performance
 * Shows placeholder content while data is loading
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'card', 
  count = 6 
}) => {
  const theme = useTheme();
  
  switch (variant) {
    case 'card':
      return (
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                    animation: 'shimmer 1.5s infinite',
                    '@keyframes shimmer': {
                      '0%': { left: '-100%' },
                      '100%': { left: '100%' },
                    },
                  },
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  height={140} 
                  animation="wave"
                  sx={{
                    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                  }}
                />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={32} animation="wave" />
                  <Skeleton variant="text" width="60%" height={24} animation="wave" sx={{ mt: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} animation="wave" />
                    <Skeleton variant="text" width={100} height={20} animation="wave" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );

    case 'list':
      return (
        <Box>
          {Array.from({ length: count }).map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={48} height={48} animation="wave" />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} animation="wave" />
                  <Skeleton variant="text" width="40%" height={20} animation="wave" sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
              </Box>
            </Box>
          ))}
        </Box>
      );

    case 'statistics':
      return (
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={0} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} animation="wave" sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" width={60} height={40} animation="wave" sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width={80} height={20} animation="wave" sx={{ mx: 'auto' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      );

    case 'table':
      return (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="text" width="25%" height={40} animation="wave" />
            ))}
          </Box>
          {Array.from({ length: count }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" width="25%" height={48} animation="wave" />
              ))}
            </Box>
          ))}
        </Box>
      );

    default:
      return null;
  }
};

export default SkeletonLoader;

