import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepContent, Chip, useTheme, alpha } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Schedule, Archive, Publish } from '@mui/icons-material';
import { TripStatus } from '../../types/trip';

interface StatusPipelineProps {
  currentStatus: TripStatus;
  onStatusChange?: (newStatus: TripStatus) => void;
  showDescriptions?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<TripStatus, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  'draft': {
    label: 'Draft',
    icon: <RadioButtonUnchecked />,
    description: 'Project is in early stages, not yet started',
    color: 'grey'
  },
  'in-progress': {
    label: 'In Progress',
    icon: <Schedule />,
    description: 'Active work on the project',
    color: 'primary'
  },
  'completed': {
    label: 'Completed',
    icon: <CheckCircle />,
    description: 'Project work is finished',
    color: 'success'
  },
  'archived': {
    label: 'Archived',
    icon: <Archive />,
    description: 'Project is archived for reference',
    color: 'default'
  },
  'published': {
    label: 'Published',
    icon: <Publish />,
    description: 'Project has been published/released',
    color: 'info'
  }
};

const STATUS_ORDER: TripStatus[] = ['draft', 'in-progress', 'completed', 'published', 'archived'];

const StatusPipeline: React.FC<StatusPipelineProps> = ({
  currentStatus,
  onStatusChange,
  showDescriptions = false,
  compact = false
}) => {
  const theme = useTheme();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStatusColor = (status: TripStatus, index: number) => {
    if (index < currentIndex) {
      return theme.palette.success.main; // Completed
    }
    if (index === currentIndex) {
      return theme.palette.primary.main; // Current
    }
    return theme.palette.action.disabled; // Future
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {STATUS_ORDER.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const isActive = status === currentStatus;
          const isCompleted = index < currentIndex;
          
          return (
            <Chip
              key={status}
              icon={isCompleted ? <CheckCircle /> : config.icon}
              label={config.label}
              onClick={onStatusChange ? () => onStatusChange(status) : undefined}
              color={isActive ? 'primary' : isCompleted ? 'success' : 'default'}
              variant={isActive ? 'filled' : 'outlined'}
              sx={{
                cursor: onStatusChange ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': onStatusChange ? {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                } : {},
                fontWeight: isActive ? 600 : 400,
              }}
            />
          );
        })}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={currentIndex} orientation="vertical" sx={{ '& .MuiStepContent-root': { borderLeft: '2px solid', borderColor: 'divider' } }}>
        {STATUS_ORDER.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const isActive = status === currentStatus;
          const isCompleted = index < currentIndex;
          const statusColor = getStatusColor(status, index);

          return (
            <Step key={status} completed={isCompleted} active={isActive}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isCompleted 
                        ? theme.palette.success.main 
                        : isActive 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.action.disabled, 0.1),
                      color: isCompleted || isActive ? 'white' : theme.palette.action.disabled,
                      border: `2px solid ${statusColor}`,
                      transition: 'all 0.3s ease',
                      cursor: onStatusChange ? 'pointer' : 'default',
                      '&:hover': onStatusChange ? {
                        transform: 'scale(1.1)',
                        boxShadow: `0px 4px 12px ${alpha(statusColor, 0.4)}`,
                      } : {},
                    }}
                    onClick={onStatusChange ? () => onStatusChange(status) : undefined}
                  >
                    {isCompleted ? <CheckCircle /> : config.icon}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={isActive ? 600 : 400}>
                    {config.label}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="Current"
                      size="small"
                      color="primary"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
              </StepLabel>
              {showDescriptions && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    {config.description}
                  </Typography>
                </StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default StatusPipeline;

