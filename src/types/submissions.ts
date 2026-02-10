/**
 * Submission Types
 * 
 * Types for tracking provider submissions and their status
 */

/**
 * Submission status
 */
export type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Submission history entry
 */
export interface SubmissionHistoryEntry {
  /** Timestamp of the status change */
  timestamp: string;
  
  /** Status at this point */
  status: SubmissionStatus;
  
  /** Optional message or error */
  message?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Provider submission record
 */
export interface ProviderSubmission {
  /** Provider ID */
  providerId: string;
  
  /** Provider name */
  providerName: string;
  
  /** Submission status */
  status: SubmissionStatus;
  
  /** Timestamp when submitted */
  submittedAt: string;
  
  /** Timestamp when completed (if completed) */
  completedAt?: string;
  
  /** Submission ID from provider */
  submissionId?: string;
  
  /** Error message if failed */
  error?: string;
  
  /** Provider-specific submission data */
  providerData?: Record<string, unknown>;
  
  /** Provider URL (if available) */
  providerUrl?: string;
  
  /** History of status changes */
  history: SubmissionHistoryEntry[];
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

/**
 * Distribution result
 */
export interface DistributionResult {
  /** Release ID */
  releaseId: string;
  
  /** Per-provider submission results */
  submissions: Record<string, ProviderSubmission>;
  
  /** Overall status */
  overallStatus: SubmissionStatus;
  
  /** Timestamp when distribution started */
  startedAt: string;
}

