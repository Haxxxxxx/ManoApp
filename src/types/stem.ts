/**
 * Stem Types
 * 
 * Types for stems and multitrack audio support
 */

/**
 * Stem metadata
 */
export interface StemMetadata {
  /** Original file name */
  originalFileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Last modified timestamp */
  lastModified?: number;
  /** Audio format (mp3, wav, flac, etc.) */
  format?: string;
  /** Sample rate */
  sampleRate?: number;
  /** Bit depth */
  bitDepth?: number;
  /** Channels (mono, stereo, etc.) */
  channels?: number;
}

/**
 * Stem interface
 * Represents a single audio stem (e.g., Kick, Bass, Vocals)
 */
export interface Stem {
  /** Unique identifier for the stem */
  id: string;
  
  /** Human-readable label for the stem (e.g., "Kick", "Bass", "Vocals") */
  label: string;
  
  /** Storage path in Firebase Storage */
  storagePath: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Additional metadata */
  metadata?: StemMetadata;
  
  /** Timestamp when stem was created */
  createdAt?: string;
  
  /** Timestamp when stem was last updated */
  updatedAt?: string;
  
  /** User ID who uploaded the stem */
  userId?: string;
  
  /** Order/index in the stem list */
  order?: number;
}

/**
 * Stem upload progress
 */
export interface StemUploadProgress {
  /** Stem ID */
  stemId: string;
  
  /** Upload progress (0-100) */
  progress: number;
  
  /** Whether upload is complete */
  complete: boolean;
  
  /** Error message if upload failed */
  error?: string;
}

/**
 * Stem mixer settings
 */
export interface StemMixerSettings {
  /** Stem ID */
  stemId: string;
  
  /** Volume level (0-1, where 1 is full volume) */
  volume: number;
  
  /** Pan position (-1 to 1, where -1 is left, 0 is center, 1 is right) */
  pan: number;
  
  /** Whether stem is muted */
  muted: boolean;
  
  /** Whether stem is soloed */
  solo: boolean;
}

/**
 * Mixdown export settings
 */
export interface MixdownExportSettings {
  /** Export format */
  format: 'wav' | 'mp3' | 'flac';
  
  /** Sample rate */
  sampleRate: number;
  
  /** Bit depth (for uncompressed formats) */
  bitDepth?: number;
  
  /** Quality/bitrate (for compressed formats) */
  quality?: number;
  
  /** Normalize output */
  normalize: boolean;
}

