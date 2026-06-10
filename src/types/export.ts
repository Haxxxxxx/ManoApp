/**
 * Export Types
 * 
 * Types for exporting releases to external platforms (SoundCloud, Spotify, etc.)
 */

import { Song } from './song';

/**
 * Rights split for a collaborator
 */
export interface RightsSplit {
  /** Collaborator user ID */
  userId: string;
  
  /** Collaborator name */
  name: string;
  
  /** Percentage split (0-100) */
  percentage: number;
  
  /** Role (e.g., "Producer", "Artist", "Writer") */
  role?: string;
}

/**
 * Release manifest containing all data needed for export
 */
export interface ReleaseManifest {
  /** Release ID */
  releaseId: string;
  
  /** Release title */
  title: string;
  
  /** Release description */
  description?: string;
  
  /** Release type */
  type: 'single' | 'album' | 'ep' | 'mixtape';
  
  /** Release date (ISO string) */
  releaseDate?: string;
  
  /** Genre */
  genre?: string;
  
  /** Tags */
  tags?: string[];
  
  /** Artwork URL or path */
  artworkUrl?: string;
  
  /** Artwork file (for upload) */
  artworkFile?: File | Blob;
  
  /** Tracks/songs to export */
  tracks: ReleaseTrack[];
  
  /** Rights splits */
  rightsSplits?: RightsSplit[];
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Track in a release manifest
 */
export interface ReleaseTrack {
  /** Track number */
  trackNumber: number;
  
  /** Song ID */
  songId: string;
  
  /** Song data */
  song: Song;
  
  /** Track title (defaults to song title) */
  title?: string;
  
  /** Track-specific metadata */
  metadata?: {
    /** ISRC code */
    isrc?: string;
    /** Explicit content flag */
    explicit?: boolean;
    /** Track-specific tags */
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Submission payload for a provider
 */
export interface SubmissionPayload {
  /** Provider-specific payload data */
  data: Record<string, unknown>;
  
  /** Files to upload (keyed by type) */
  files?: {
    /** Audio file */
    audio?: File | Blob | Buffer;
    /** Artwork file */
    artwork?: File | Blob | Buffer;
    /** Additional files */
    [key: string]: File | Blob | Buffer | undefined;
  };
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Submission result from a provider
 */
export interface SubmissionResult {
  /** Submission ID from provider */
  submissionId: string;
  
  /** Provider-specific submission data */
  providerData?: Record<string, unknown>;
  
  /** Submission status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Error message if failed */
  error?: string;
  
  /** Provider URL (if available) */
  providerUrl?: string;
  
  /** Timestamp when submitted */
  submittedAt: string;
  
  /** Timestamp when completed */
  completedAt?: string;
}

/**
 * Preflight validation result
 */
export interface PreflightResult {
  /** Whether preflight passed */
  valid: boolean;
  
  /** Errors (blocking issues) */
  errors: PreflightIssue[];
  
  /** Warnings (non-blocking issues) */
  warnings: PreflightIssue[];
}

/**
 * Preflight issue
 */
export interface PreflightIssue {
  /** Issue code */
  code: string;
  
  /** Issue message */
  message: string;
  
  /** Severity */
  severity: 'error' | 'warning';
  
  /** Field or path where issue occurs */
  field?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Provider connector interface
 */
export interface ProviderConnector {
  /** Provider name */
  readonly name: string;
  
  /** Provider ID */
  readonly id: string;
  
  /**
   * Authorize user with provider
   * Returns existing token if available, or redirect URL for OAuth
   */
  authorize(userId: string): Promise<string | { redirectUrl: string }>;
  
  /**
   * Prepare release manifest for submission
   * Fetches files, validates, and builds provider-specific payload
   */
  prepare(manifest: ReleaseManifest): Promise<SubmissionPayload>;
  
  /**
   * Submit release to provider
   * Returns submission result with provider-specific data
   */
  submit(payload: SubmissionPayload): Promise<SubmissionResult>;
  
  /**
   * Run preflight validation
   * Checks for errors and warnings before submission
   */
  runPreflight?(manifest: ReleaseManifest): Promise<PreflightResult>;
  
  /**
   * Get submission status
   * Polls provider for async submission status
   */
  getSubmissionStatus?(submissionId: string): Promise<SubmissionResult>;
}

/**
 * Supported platform identifiers
 */
export type PlatformId = 'soundcloud' | 'spotify' | 'apple' | 'amazon' | 'youtube' | 'revelator';

/**
 * Platform configuration
 */
export interface PlatformConfig {
  id: PlatformId;
  name: string;
  icon: string;
  audioFormat: 'mp3' | 'wav' | 'flac' | 'aiff';
  requiresAuth: boolean;
  exportOnly: boolean;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
}

