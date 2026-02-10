/**
 * Export Preset Types
 * 
 * Types for export presets that save provider-specific export settings
 */

/**
 * Export preset settings
 */
export interface ExportPresetSettings {
  /** Artwork settings */
  artwork?: {
    /** Artwork URL */
    url?: string;
    /** Artwork dimensions */
    dimensions?: {
      width?: number;
      height?: number;
    };
    /** Artwork format */
    format?: 'jpg' | 'png' | 'webp';
  };
  
  /** Metadata overrides */
  metadata?: {
    /** Genre */
    genre?: string;
    /** Tags */
    tags?: string[];
    /** Description */
    description?: string;
    /** Additional metadata */
    [key: string]: unknown;
  };
  
  /** Format settings */
  format?: {
    /** Audio bitrate */
    bitrate?: number;
    /** Audio format */
    audioFormat?: 'mp3' | 'wav' | 'flac' | 'aac';
    /** Sample rate */
    sampleRate?: number;
  };
  
  /** Provider-specific settings */
  [key: string]: unknown;
}

/**
 * Export preset
 */
export interface ExportPreset {
  /** Preset ID */
  id: string;
  
  /** Preset name */
  name: string;
  
  /** Provider ID (e.g., 'soundcloud', 'spotify') */
  provider: string;
  
  /** Preset settings */
  settings: ExportPresetSettings;
  
  /** Whether this is the default preset for the provider */
  isDefault?: boolean;
  
  /** Timestamp when preset was last used */
  lastUsedAt?: string;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

