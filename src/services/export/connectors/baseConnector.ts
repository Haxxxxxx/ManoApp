/**
 * Base Connector
 * 
 * Base class with common functionality for provider connectors
 */

import {
  ProviderConnector,
  ReleaseManifest,
  SubmissionPayload,
  SubmissionResult,
  PreflightResult,
  PreflightIssue,
} from '../../../types/export';

/**
 * Base connector implementation
 */
export abstract class BaseConnector implements ProviderConnector {
  abstract readonly name: string;
  abstract readonly id: string;

  /**
   * Authorize user with provider
   * Must be implemented by subclasses
   */
  abstract authorize(userId: string): Promise<string | { redirectUrl: string }>;

  /**
   * Prepare release manifest for submission
   * Must be implemented by subclasses
   */
  abstract prepare(manifest: ReleaseManifest): Promise<SubmissionPayload>;

  /**
   * Submit release to provider
   * Must be implemented by subclasses
   */
  abstract submit(payload: SubmissionPayload): Promise<SubmissionResult>;

  /**
   * Run preflight validation
   * Default implementation checks common issues
   */
  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const errors: PreflightIssue[] = [];
    const warnings: PreflightIssue[] = [];

    // Check for required fields
    if (!manifest.title || manifest.title.trim().length === 0) {
      errors.push({
        code: 'MISSING_TITLE',
        message: 'Release title is required',
        severity: 'error',
        field: 'title',
      });
    }

    // Check for tracks
    if (!manifest.tracks || manifest.tracks.length === 0) {
      errors.push({
        code: 'NO_TRACKS',
        message: 'At least one track is required',
        severity: 'error',
        field: 'tracks',
      });
    }

    // Check rights splits sum to 100%
    if (manifest.rightsSplits && manifest.rightsSplits.length > 0) {
      const total = manifest.rightsSplits.reduce((sum, split) => sum + split.percentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        errors.push({
          code: 'INVALID_SPLITS',
          message: `Rights splits must sum to 100% (currently ${total}%)`,
          severity: 'error',
          field: 'rightsSplits',
          context: { total },
        });
      }
    }

    // Check track files exist
    for (const track of manifest.tracks || []) {
      if (!track.song?.filePath) {
        errors.push({
          code: 'MISSING_TRACK_FILE',
          message: `Track "${track.song?.title || track.trackNumber}" is missing audio file`,
          severity: 'error',
          field: `tracks[${track.trackNumber - 1}].filePath`,
        });
      }
    }

    // Check artwork
    if (!manifest.artworkUrl && !manifest.artworkFile) {
      warnings.push({
        code: 'MISSING_ARTWORK',
        message: 'Artwork is recommended but not required',
        severity: 'warning',
        field: 'artworkUrl',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get submission status
   * Default implementation returns pending status
   */
  async getSubmissionStatus(submissionId: string): Promise<SubmissionResult> {
    // Default: return pending status
    // Subclasses should override to poll provider API
    return {
      submissionId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate file size
   */
  protected validateFileSize(file: File | Blob | Buffer, maxSizeBytes: number): boolean {
    const size = file instanceof Buffer ? file.length : file.size;
    return size <= maxSizeBytes;
  }

  /**
   * Validate file type
   */
  protected validateFileType(
    file: File | Blob,
    allowedTypes: string[]
  ): boolean {
    if (file instanceof Buffer) {
      // Can't check MIME type for Buffer, assume valid
      return true;
    }

    const type = file.type || '';
    return allowedTypes.some((allowed) => type.includes(allowed));
  }
}

