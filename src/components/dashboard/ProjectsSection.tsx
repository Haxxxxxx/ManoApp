import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import ProjectCard from './ProjectCard';
import EmptyState from '../common/EmptyState';
import SkeletonLoader from '../common/SkeletonLoader';
import SearchBar from '../common/SearchBar';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) {
      return trips;
    }
    const query = searchQuery.toLowerCase();
    return trips.filter(trip => 
      trip.name.toLowerCase().includes(query) ||
      trip.description?.toLowerCase().includes(query) ||
      trip.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [trips, searchQuery]);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <Button
          variant="text"
          color="primary"
          endIcon={<AddIcon />}
          onClick={onCreateNew}
          aria-label={`Create new ${title.toLowerCase()}`}
        >
          Create New
        </Button>
      </Box>

      {!loading && trips.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <SearchBar
            placeholder={`Search ${title.toLowerCase()}...`}
            onSearch={setSearchQuery}
            aria-label={`Search ${title.toLowerCase()}`}
            size="small"
          />
        </Box>
      )}

      {loading ? (
        <SkeletonLoader variant="card" count={6} />
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          icon={<FolderIcon sx={{ fontSize: 48, color: 'primary.main' }} />}
          title={searchQuery ? `No projects found for "${searchQuery}"` : "No projects yet"}
          description={searchQuery 
            ? "Try adjusting your search terms or create a new project."
            : "Create your first project to get started with music management. Organize your songs, collaborate with others, and bring your musical ideas to life."}
          actionLabel={searchQuery ? undefined : "Create Project"}
          onAction={searchQuery ? undefined : onCreateNew}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredTrips.map((trip) => (
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