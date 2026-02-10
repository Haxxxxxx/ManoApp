/**
 * Split-Sheet Types
 * 
 * Types for split-sheet generation and signing
 */

/**
 * Split-sheet format
 */
export type SplitSheetFormat = 'pdf' | 'csv';

/**
 * Signature status
 */
export type SignatureStatus = 'pending' | 'signed';

/**
 * Signature record
 */
export interface Signature {
  /** Signature ID */
  id: string;
  
  /** Release ID */
  releaseId: string;
  
  /** Rights splits */
  splits: Array<{
    userId: string;
    userName: string;
    percentage: number;
    role?: string;
  }>;
  
  /** Signature status */
  status: SignatureStatus;
  
  /** Timestamp when signed */
  signedAt?: string;
  
  /** User ID who signed */
  signerId?: string;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

