/**
 * Submission type mirror for Cloud Functions
 *
 * Structurally identical to src/types/submissions.ts — functions compile
 * as CommonJS and cannot import from the ESM frontend tree (TS1479).
 * Keep in sync with src/types/submissions.ts.
 */

export type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SubmissionHistoryEntry {
  timestamp: string;
  status: SubmissionStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderSubmission {
  providerId: string;
  providerName: string;
  status: SubmissionStatus;
  submittedAt: string;
  completedAt?: string;
  submissionId?: string;
  error?: string;
  providerData?: Record<string, unknown>;
  providerUrl?: string;
  history: SubmissionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DistributionResult {
  releaseId: string;
  submissions: Record<string, ProviderSubmission>;
  overallStatus: SubmissionStatus;
  startedAt: string;
}
