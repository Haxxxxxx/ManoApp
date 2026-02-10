/**
 * Feature Consent Dialog
 * 
 * Dialog for user consent to provider data sharing
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
} from '@mui/material';

export interface FeatureConsentDialogProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Provider name */
  provider: string;
  
  /** Callback when consent is given */
  onConsent: (consent: boolean) => void;
  
  /** Callback to close dialog */
  onClose: () => void;
}

export const FeatureConsentDialog: React.FC<FeatureConsentDialogProps> = ({
  open,
  provider,
  onConsent,
  onClose,
}) => {
  const [agreed, setAgreed] = useState(false);

  const handleConsent = () => {
    onConsent(agreed);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Data Sharing Consent</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          To use {provider}, we need to share your release data with their platform.
        </Alert>

        <Typography variant="body2" paragraph>
          By connecting to {provider}, you agree to:
        </Typography>

        <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
          <li>Share your release metadata (title, artist, tracks, artwork) with {provider}</li>
          <li>Allow {provider} to process and store your content</li>
          <li>Comply with {provider}'s terms of service</li>
        </Typography>

        <FormControlLabel
          control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
          label="I understand and agree to share my data with this provider"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConsent} variant="contained" disabled={!agreed}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureConsentDialog;

