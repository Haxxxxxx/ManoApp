/**
 * Duplicate Asset Dialog
 * 
 * Dialog shown when a duplicate asset is detected during import/upload
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import { Asset } from '../../types/asset';

export interface DuplicateAssetDialogProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Existing duplicate asset */
  existingAsset: Asset;
  
  /** New asset filename */
  newAssetFilename: string;
  
  /** Callback when user chooses an option */
  onChoose: (option: 'link' | 'merge' | 'force') => void;
  
  /** Callback to close dialog */
  onClose: () => void;
}

export const DuplicateAssetDialog: React.FC<DuplicateAssetDialogProps> = ({
  open,
  existingAsset,
  newAssetFilename,
  onChoose,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<'link' | 'merge' | 'force'>('link');

  const handleConfirm = () => {
    onChoose(selectedOption);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Duplicate Asset Detected</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          A file with the same content already exists in your library.
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Existing asset:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {existingAsset.filename}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Size: {(existingAsset.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            New file:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {newAssetFilename}
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Choose an action:</FormLabel>
          <RadioGroup
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value as 'link' | 'merge' | 'force')}
          >
            <FormControlLabel
              value="link"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1">Link to existing asset</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skip import and use the existing asset
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="merge"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1">Merge metadata</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update existing asset with metadata from new file
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="force"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1">Create new asset anyway</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Import as a new asset despite duplicate
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateAssetDialog;

