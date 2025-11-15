/**
 * Asset Types
 * 
 * Types for imported assets from external sources (Google Drive, etc.)
 */

/**
 * Asset source type
 */
export type AssetSource = 'google-drive' | 'local' | 'firebase' | 's3';

/**
 * Asset interface
 */
export interface Asset {
  /** Unique identifier */
  id: string;
  
  /** Original filename */
  filename: string;
  
  /** MIME type */
  mimeType: string;
  
  /** File size in bytes */
  size: number;
  
  /** SHA256 hash for deduplication */
  hash: string;
  
  /** Source of the asset */
  source: AssetSource;
  
  /** Original URL from source (e.g., Google Drive file URL) */
  originUrl?: string;
  
  /** Firebase Storage path */
  storagePath: string;
  
  /** Firebase Storage download URL */
  downloadUrl: string;
  
  /** Associated project/trip ID */
  projectId?: string;
  
  /** User ID who imported the asset */
  userId: string;
  
  /** Additional metadata */
  metadata?: {
    /** Original file ID from source (e.g., Google Drive file ID) */
    sourceFileId?: string;
    /** Import timestamp from source */
    sourceModifiedTime?: string;
    /** Custom metadata */
    [key: string]: unknown;
  };
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

