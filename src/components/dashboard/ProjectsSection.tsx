import React from 'react';
import { Box, Typography, Grid, Paper, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import ProjectCard from './ProjectCard';
import type { Trip } from '../../types/trip';

interface ProjectsSectionProps {
  title: string;
  trips: Trip[];
  loading: boolean;
  onTripClick: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
  onCreateNew: () => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ 
  title, 
  trips, 
  loading, 
  onTripClick, 
  onDeleteTrip, 
  onCreateNew 
}: ProjectsSectionProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Button
          variant="text"
          color="primary"
          endIcon={<AddIcon />}
          onClick={onCreateNew}
        >
          Create New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : trips.length === 0 ? (
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
          <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create your first project to get started with music management.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0px 4px 12px rgba(29, 185, 84, 0.2)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(29, 185, 84, 0.3)',
              }
            }}
          >
            Create Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} key={trip.id}>
              <ProjectCard
                trip={trip}
                onTripClick={onTripClick}
                onDeleteTrip={onDeleteTrip}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProjectsSection; 