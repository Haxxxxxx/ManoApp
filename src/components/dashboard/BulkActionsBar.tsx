import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Slide,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeselectIcon from '@mui/icons-material/Deselect';
import type { TripStatus } from '../../types/trip';

const STATUSES: { value: TripStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#9e9e9e' },
  { value: 'in-progress', label: 'In Progress', color: '#2196f3' },
  { value: 'completed', label: 'Completed', color: '#4caf50' },
  { value: 'published', label: 'Published', color: '#9c27b0' },
  { value: 'archived', label: 'Archived', color: '#795548' },
];

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange: (status: TripStatus) => Promise<void> | void;
  onDeselectAll: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onStatusChange, onDeselectAll }) => {
  const [loading, setLoading] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<TripStatus | null>(null);

  const handleConfirm = async () => {
    if (!confirmStatus) return;
    setLoading(true);
    try {
      await onStatusChange(confirmStatus);
    } finally {
      setLoading(false);
      setConfirmStatus(null);
    }
  };

  return (
    <>
      <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 1.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1300,
            maxWidth: '90vw',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Updating {selectedCount} projects...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                {selectedCount} selected
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {STATUSES.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    size="small"
                    variant="outlined"
                    clickable
                    onClick={() => setConfirmStatus(s.value)}
                    sx={{
                      borderColor: s.color,
                      color: s.color,
                      '&:hover': { bgcolor: `${s.color}15` },
                    }}
                  />
                ))}
              </Box>

              <Button
                size="small"
                variant="text"
                startIcon={<DeselectIcon fontSize="small" />}
                onClick={onDeselectAll}
              >
                Deselect
              </Button>
            </>
          )}
        </Paper>
      </Slide>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmStatus} onClose={() => setConfirmStatus(null)}>
        <DialogTitle>Confirm Bulk Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change the status of {selectedCount} project{selectedCount !== 1 ? 's' : ''} to{' '}
            <strong>{STATUSES.find((s) => s.value === confirmStatus)?.label}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStatus(null)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsBar;
