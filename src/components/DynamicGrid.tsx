import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  minHeight: 200,
}));

interface DynamicGridProps {
  items: React.ReactNode[];
  columns?: number;
  spacing?: number;
  emptyMessage?: string;
  loading?: boolean;
  sx?: any;
}

const DynamicGrid: React.FC<DynamicGridProps> = ({
  items,
  columns = 3,
  spacing = 2,
  emptyMessage = 'No items to display',
  loading = false,
  sx = {}
}) => {
  if (loading) {
    return (
      <EmptyState>
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </EmptyState>
    );
  }

  if (!items.length) {
    return (
      <EmptyState>
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </EmptyState>
    );
  }

  return (
    <StyledGrid container spacing={spacing} sx={sx}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={12 / columns} key={index}>
          {item}
        </Grid>
      ))}
    </StyledGrid>
  );
};

export default DynamicGrid; 