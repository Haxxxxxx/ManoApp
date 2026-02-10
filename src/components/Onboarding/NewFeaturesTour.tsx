/**
 * New Features Tour Component
 * 
 * Guided tour for new features
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
} from '@mui/material';
import { FeatureFlags } from '../../config/features';

export interface NewFeaturesTourProps {
  /** Feature flags */
  flags: FeatureFlags;
  
  /** Callback when tour is completed */
  onComplete?: () => void;
}

export const NewFeaturesTour: React.FC<NewFeaturesTourProps> = ({ flags, onComplete }) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('newFeaturesTourCompleted');
    if (!hasSeenTour && hasNewFeatures(flags)) {
      setOpen(true);
    }
  }, [flags]);

  const hasNewFeatures = (flags: FeatureFlags): boolean => {
    return flags.distributor || flags.fingerprint || flags.exportPresets || flags.splitSheet;
  };

  const steps = [
    {
      label: 'Distributor Orchestrator',
      description: 'Easily distribute your releases to multiple platforms with a single click.',
      enabled: flags.distributor,
    },
    {
      label: 'Fingerprinting',
      description: 'Automatically detect duplicate files to prevent accidental re-uploads.',
      enabled: flags.fingerprint,
    },
    {
      label: 'Export Presets',
      description: 'Save and reuse export settings for faster distribution workflows.',
      enabled: flags.exportPresets,
    },
    {
      label: 'Split-Sheet Generation',
      description: 'Generate professional split-sheets for rights management and signatures.',
      enabled: flags.splitSheet,
    },
  ].filter((step) => step.enabled);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('newFeaturesTourCompleted', 'true');
    setOpen(false);
    onComplete?.();
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleComplete} maxWidth="sm" fullWidth>
      <DialogTitle>Welcome to New Features!</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ minHeight: 100 }}>
          <Typography variant="h6" gutterBottom>
            {steps[activeStep]?.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {steps[activeStep]?.description}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleComplete}>Skip Tour</Button>
        <Button onClick={handleNext} variant="contained">
          {activeStep < steps.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewFeaturesTour;

