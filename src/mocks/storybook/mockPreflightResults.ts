/**
 * Mock Preflight Results
 * 
 * Sample preflight validation results for Storybook stories
 */

import { PreflightResult } from '../../types/export';

export const mockPreflightValid: PreflightResult = {
  valid: true,
  errors: [],
  warnings: [
    {
      code: 'MISSING_ARTWORK',
      message: 'Artwork is recommended but not required',
      severity: 'warning',
      field: 'artworkUrl',
    },
  ],
};

export const mockPreflightWithErrors: PreflightResult = {
  valid: false,
  errors: [
    {
      code: 'MISSING_TITLE',
      message: 'Release title is required',
      severity: 'error',
      field: 'title',
    },
    {
      code: 'NO_TRACKS',
      message: 'At least one track is required',
      severity: 'error',
      field: 'tracks',
    },
    {
      code: 'INVALID_SPLITS',
      message: 'Rights splits must sum to 100% (currently 90%)',
      severity: 'error',
      field: 'rightsSplits',
      context: { total: 90 },
    },
  ],
  warnings: [
    {
      code: 'MISSING_ARTWORK',
      message: 'Artwork is recommended but not required',
      severity: 'warning',
      field: 'artworkUrl',
    },
  ],
};

export const mockPreflightWithWarnings: PreflightResult = {
  valid: true,
  errors: [],
  warnings: [
    {
      code: 'MISSING_ARTWORK',
      message: 'Artwork is recommended but not required',
      severity: 'warning',
      field: 'artworkUrl',
    },
    {
      code: 'DESCRIPTION_TOO_LONG',
      message: 'Description is very long and may be truncated',
      severity: 'warning',
      field: 'description',
      context: { maxLength: 5000, currentLength: 6000 },
    },
    {
      code: 'ALBUM_NOT_SUPPORTED',
      message: 'SoundCloud supports single tracks. Albums will be uploaded as separate tracks.',
      severity: 'warning',
      field: 'type',
    },
  ],
};

