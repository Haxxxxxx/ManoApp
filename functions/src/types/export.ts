/**
 * Connector type mirror for Cloud Functions
 *
 * The repo-root `src/types/export.ts` is ESM (root package.json has
 * "type": "module") while functions compile as CommonJS, so importing it
 * here raises TS1479. These mirrors are structurally identical to the
 * shared types — connectors typed against them remain assignable to the
 * registry's ProviderConnector. Keep in sync with src/types/export.ts.
 */

export interface RightsSplit {
  userId: string;
  name: string;
  percentage: number;
  role?: string;
}

/**
 * Minimal structural subset of src/types/song.ts Song used by connectors.
 *
 * INTENTIONALLY narrower than the frontend Song: manifests arrive here as
 * plain JSON deserialized from Firestore/queue payloads, so only the fields
 * connectors actually read are declared. Do NOT add required fields that
 * Firestore may not persist — they would type-check but be undefined at
 * runtime.
 */
export interface ReleaseTrackSong {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  userId?: string;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export interface ReleaseTrack {
  trackNumber: number;
  songId: string;
  song: ReleaseTrackSong;
  title?: string;
  metadata?: {
    isrc?: string;
    explicit?: boolean;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface ReleaseManifest {
  releaseId: string;
  title: string;
  description?: string;
  type: 'single' | 'album' | 'ep' | 'mixtape';
  releaseDate?: string;
  genre?: string;
  tags?: string[];
  artworkUrl?: string;
  artworkFile?: unknown;
  tracks: ReleaseTrack[];
  rightsSplits?: RightsSplit[];
  metadata?: Record<string, unknown>;
}

export interface SubmissionPayload {
  data: Record<string, unknown>;
  files?: {
    audio?: File | Blob | Buffer;
    artwork?: File | Blob | Buffer;
    [key: string]: File | Blob | Buffer | undefined;
  };
  metadata?: Record<string, unknown>;
}

export interface SubmissionResult {
  submissionId: string;
  providerData?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  providerUrl?: string;
  submittedAt: string;
  completedAt?: string;
}

export interface PreflightIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  context?: Record<string, unknown>;
}

export interface PreflightResult {
  valid: boolean;
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
}

export interface ProviderConnector {
  readonly name: string;
  readonly id: string;
  authorize(userId: string): Promise<string | { redirectUrl: string }>;
  prepare(manifest: ReleaseManifest): Promise<SubmissionPayload>;
  submit(payload: SubmissionPayload): Promise<SubmissionResult>;
  runPreflight?(manifest: ReleaseManifest): Promise<PreflightResult>;
  getSubmissionStatus?(submissionId: string): Promise<SubmissionResult>;
}
