/**
 * Split-sheet type mirror for Cloud Functions
 *
 * Structurally identical to the subset of src/types/splitSheet.ts used by
 * functions — functions compile as CommonJS and cannot import from the ESM
 * frontend tree (TS1479). Keep in sync with src/types/splitSheet.ts.
 */

export type SplitSheetFormat = 'pdf' | 'csv';

export type SignatureStatus = 'pending' | 'signed';

export interface Signature {
  id: string;
  releaseId: string;
  splits: Array<{
    userId: string;
    userName: string;
    percentage: number;
    role?: string;
  }>;
  status: SignatureStatus;
  signedAt?: string;
  signerId?: string;
  createdAt: string;
  updatedAt: string;
}
