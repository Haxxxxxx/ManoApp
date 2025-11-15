/**
 * Rights Editor Component
 * 
 * Component for managing rights splits for collaborators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { RightsSplit } from '../types/export';

export interface RightsEditorProps {
  /** Initial rights splits */
  splits?: RightsSplit[];
  
  /** Collaborators available for assignment */
  collaborators?: Array<{ id: string; name: string; email?: string; avatar?: string }>;
  
  /** Callback when splits change */
  onChange?: (splits: RightsSplit[]) => void;
  
  /** Whether component is read-only */
  readOnly?: boolean;
  
  /** Show validation errors */
  showValidation?: boolean;
}

export const RightsEditor: React.FC<RightsEditorProps> = ({
  splits: initialSplits = [],
  collaborators = [],
  onChange,
  readOnly = false,
  showValidation = true,
}) => {
  const [splits, setSplits] = useState<RightsSplit[]>(initialSplits);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setSplits(initialSplits);
  }, [initialSplits]);

  const calculateTotal = () => {
    return splits.reduce((sum, split) => sum + split.percentage, 0);
  };

  const validateSplits = (): boolean => {
    const newErrors: Record<string, string> = {};
    const total = calculateTotal();

    // Check total equals 100%
    if (Math.abs(total - 100) > 0.01) {
      newErrors.total = `Total must equal 100% (currently ${total.toFixed(2)}%)`;
    }

    // Validate individual splits
    splits.forEach((split, index) => {
      if (split.percentage < 0 || split.percentage > 100) {
        newErrors[`split-${index}`] = 'Percentage must be between 0 and 100';
      }
      if (!split.userId) {
        newErrors[`split-${index}`] = 'Collaborator is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (showValidation) {
      validateSplits();
    }
    onChange?.(splits);
  }, [splits, showValidation]);

  const handleAddSplit = () => {
    const availableCollaborators = collaborators.filter(
      (collab) => !splits.some((split) => split.userId === collab.id)
    );

    if (availableCollaborators.length === 0) {
      return;
    }

    const newSplit: RightsSplit = {
      userId: availableCollaborators[0].id,
      name: availableCollaborators[0].name,
      percentage: 0,
    };

    setSplits([...splits, newSplit]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index: number, field: keyof RightsSplit, value: string | number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      [field]: value,
    };
    setSplits(newSplits);
  };

  const handleCollaboratorChange = (index: number, userId: string) => {
    const collaborator = collaborators.find((c) => c.id === userId);
    if (collaborator) {
      handleSplitChange(index, 'userId', userId);
      handleSplitChange(index, 'name', collaborator.name);
    }
  };

  const total = calculateTotal();
  const isValid = Math.abs(total - 100) < 0.01;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Rights & Splits
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assign percentage splits to collaborators. Total must equal 100%.
        </Typography>
      </Box>

      {splits.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No rights splits defined
          </Typography>
          {!readOnly && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSplit}
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
            >
              Add Collaborator
            </Button>
          )}
        </Box>
      )}

      {splits.length > 0 && (
        <Stack spacing={2}>
          {splits.map((split, index) => {
            const availableCollaborators = collaborators.filter(
              (collab) =>
                collab.id === split.userId ||
                !splits.some((s) => s.userId === collab.id && s !== split)
            );

            return (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  select
                  label="Collaborator"
                  value={split.userId || ''}
                  onChange={(e) => handleCollaboratorChange(index, e.target.value)}
                  disabled={readOnly}
                  error={!!errors[`split-${index}`]}
                  helperText={errors[`split-${index}`]}
                  sx={{ flex: 1 }}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select collaborator</option>
                  {availableCollaborators.map((collab) => (
                    <option key={collab.id} value={collab.id}>
                      {collab.name}
                    </option>
                  ))}
                </TextField>

                <TextField
                  label="Percentage"
                  type="number"
                  value={split.percentage}
                  onChange={(e) =>
                    handleSplitChange(index, 'percentage', parseFloat(e.target.value) || 0)
                  }
                  disabled={readOnly}
                  error={!!errors[`split-${index}`]}
                  helperText={errors[`split-${index}`]}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.01,
                  }}
                  sx={{ width: 150 }}
                />

                <TextField
                  label="Role (optional)"
                  value={split.role || ''}
                  onChange={(e) => handleSplitChange(index, 'role', e.target.value)}
                  disabled={readOnly}
                  sx={{ flex: 1 }}
                />

                {!readOnly && (
                  <IconButton
                    onClick={() => handleRemoveSplit(index)}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            );
          })}

          {!readOnly && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSplit}
              variant="outlined"
              disabled={collaborators.length === splits.length}
              size="small"
            >
              Add Collaborator
            </Button>
          )}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" fontWeight="medium">
          Total:
        </Typography>
        <Chip
          label={`${total.toFixed(2)}%`}
          color={isValid ? 'success' : 'error'}
          variant={isValid ? 'filled' : 'outlined'}
        />
      </Box>

      {showValidation && hasErrors && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.total || 'Please fix the errors above'}
        </Alert>
      )}

      {showValidation && isValid && splits.length > 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Rights splits are valid
        </Alert>
      )}
    </Paper>
  );
};

export default RightsEditor;

