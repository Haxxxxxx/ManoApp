import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { panelRegistry, getPanelProps } from './panelRegistry';
import { Trip } from '../../types/trip';
import { Song } from '../../types/song';

interface DynamicPanelProps {
  panelType: string;
  tripData: Trip | null;
  songs: Song[];
  selectedTrip?: string | null;
  onClose: () => void;
}

const DynamicPanel: React.FC<DynamicPanelProps> = ({
  panelType,
  tripData,
  songs,
  selectedTrip,
  onClose
}) => {
  const panelConfig = panelRegistry[panelType];
  
  if (!panelConfig) {
    console.warn(`No panel configuration found for type: ${panelType}`);
    return null;
  }
  
  // For panels that require tripData, ensure it exists
  if (panelConfig.requiresTrip && !tripData) {
    console.warn(`Panel ${panelType} requires trip data but none was provided`);
    return null;
  }
  
  // Get props for this panel type
  const panelProps = getPanelProps(panelType, tripData, songs, onClose, selectedTrip);
  
  // Get the component to render
  const PanelComponent = panelConfig.component;
  
  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: { 
          width: '95%', 
          height: '90%',
          maxWidth: 'none',
          m: 2
        }
      }}
    >
      <DialogTitle>{panelConfig.title}</DialogTitle>
      <DialogContent>
        <PanelComponent {...panelProps} />
      </DialogContent>
    </Dialog>
  );
};

export default DynamicPanel; 