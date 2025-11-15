import React, { useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme,
  Box
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

interface StatisticsCardsProps {
  totalProjects: number;
  totalSongs: number;
  activeProjects: number;
  totalCollaborators: number;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ 
  totalProjects, 
  totalSongs, 
  activeProjects, 
  totalCollaborators 
}) => {
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  const cardData = useMemo(() => [
    {
      id: 'projects',
      icon: <FolderIcon sx={{ fontSize: 40 }} />,
      value: totalProjects,
      label: 'Projects',
      color: 'primary' as const,
    },
    {
      id: 'songs',
      icon: <MusicNoteIcon sx={{ fontSize: 40 }} />,
      value: totalSongs,
      label: 'Songs',
      color: 'secondary' as const,
    },
    {
      id: 'active',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      value: activeProjects,
      label: 'Active Projects',
      color: 'success' as const,
    },
    {
      id: 'collaborators',
      icon: <GroupAddIcon sx={{ fontSize: 40 }} />,
      value: totalCollaborators,
      label: 'Collaborators',
      color: 'info' as const,
    },
  ], [totalProjects, totalSongs, activeProjects, totalCollaborators]);
  
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cardData.map((card) => {
        const isHovered = hoveredCard === card.id;
        const colorValue = theme.palette[card.color].main;
        
        return (
          <Grid item xs={12} sm={6} md={3} key={card.id}>
            <Paper
              elevation={0}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(colorValue, 0.1),
                border: '1px solid',
                borderColor: alpha(colorValue, 0.2),
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered 
                  ? `0px 8px 24px ${alpha(colorValue, 0.2)}`
                  : 'none',
                '&:hover': {
                  bgcolor: alpha(colorValue, 0.15),
                  borderColor: colorValue,
                }
              }}
            >
              <Box
                sx={{
                  mb: 1,
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                }}
              >
                {React.cloneElement(card.icon, { 
                  sx: { 
                    fontSize: 40, 
                    color: colorValue,
                    transition: 'all 0.3s ease',
                  } 
                })}
              </Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{
                  color: colorValue,
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {card.value}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  transition: 'color 0.2s ease',
                  color: isHovered ? 'text.primary' : 'text.secondary',
                }}
              >
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatisticsCards; 