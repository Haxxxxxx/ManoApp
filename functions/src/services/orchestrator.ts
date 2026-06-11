/**
 * Distributor Orchestrator Service
 * 
 * Central service that orchestrates provider submissions, status tracking,
 * retries, scheduling, and audit logs.
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { ReleaseManifest, PreflightResult } from '../types/export';
import { ProviderSubmission, SubmissionStatus } from '../types/submissions';
import { getProviderRegistry } from './providerRegistry';
import { enqueueJob } from '../lib/queue';

const db = admin.firestore();

/**
 * Distribute a release to multiple providers
 */
export async function distributeRelease(
  releaseId: string,
  providerIds: string[],
  userId: string
): Promise<Record<string, ProviderSubmission>> {
  logger.info(`Distributing release ${releaseId} to providers: ${providerIds.join(', ')}`);

  // Validate inputs
  if (!releaseId || !providerIds || providerIds.length === 0) {
    throw new Error('Release ID and at least one provider ID are required');
  }

  // Validate provider IDs against registry
  const registry = getProviderRegistry();
  const invalidProviders = providerIds.filter(id => !registry.hasProvider(id));
  if (invalidProviders.length > 0) {
    throw new Error(`Unknown provider(s): ${invalidProviders.join(', ')}. Registered providers: ${registry.getProviderIds().join(', ') || 'none'}`);
  }

  // Get release document
  const releaseDoc = await db.collection('releases').doc(releaseId).get();
  if (!releaseDoc.exists) {
    throw new Error(`Release ${releaseId} not found`);
  }

  const releaseData = releaseDoc.data();
  if (!releaseData) {
    throw new Error(`Release ${releaseId} has no data`);
  }

  // Verify user has access
  if (releaseData.userId !== userId) {
    // Check if user is a collaborator on the project
    if (releaseData.projectId) {
      const tripDoc = await db.collection('trips').doc(releaseData.projectId).get();
      const tripData = tripDoc.data();
      const collaborators = tripData?.collaborators || [];
      
      if (!collaborators.includes(userId)) {
        throw new Error('User does not have access to this release');
      }
    } else {
      throw new Error('User does not have access to this release');
    }
  }

  // Fetch songs for this release (from the project/trip)
  const tracks: ReleaseManifest['tracks'] = [];
  if (releaseData.projectId) {
    const songsSnapshot = await db
      .collection('songs')
      .where('tripId', '==', releaseData.projectId)
      .orderBy('createdAt', 'asc')
      .get();

    tracks.push(
      ...songsSnapshot.docs.map((doc, index) => {
        const song = doc.data();
        return {
          trackNumber: index + 1,
          songId: doc.id,
          song: {
            id: doc.id,
            title: song.title || '',
            artist: song.artist || '',
            duration: song.duration || '0:00',
            filePath: song.filePath,
            userId: song.userId,
            metadata: song.metadata || {},
          } as any,
          title: song.title,
          metadata: {
            isrc: song.metadata?.isrc,
            explicit: song.metadata?.explicit,
            tags: song.metadata?.tags,
          },
        };
      })
    );
  }

  // Build release manifest from release document
  const manifest: ReleaseManifest = {
    releaseId,
    title: releaseData.title || '',
    description: releaseData.description,
    type: releaseData.type || 'single',
    releaseDate: releaseData.releaseDate,
    genre: releaseData.genre,
    tags: releaseData.tags,
    artworkUrl: releaseData.artworkUrl || releaseData.coverUrl,
    tracks,
    rightsSplits: releaseData.rightsSplits || [],
    metadata: {
      upc: releaseData.upc,
      label: releaseData.label,
      primaryArtist: releaseData.artist,
    },
  };

  // Run preflight validation
  const preflight = await runPreflight(manifest);
  if (!preflight.valid) {
    const errorMessages = preflight.errors.map(e => e.message).join(', ');
    throw new Error(`Preflight validation failed: ${errorMessages}`);
  }

  // Enqueue provider jobs
  const submissions: Record<string, ProviderSubmission> = {};
  const now = new Date().toISOString();

  for (const providerId of providerIds) {
    // Create initial submission record
    const submission: ProviderSubmission = {
      providerId,
      providerName: providerId, // Will be updated when provider is resolved
      status: 'pending',
      submittedAt: now,
      history: [
        {
          timestamp: now,
          status: 'pending',
          message: 'Submission queued',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Persist submission record
    await persistSubmission(releaseId, providerId, submission);

    // Enqueue job
    await enqueueProviderJob(releaseId, providerId, manifest, userId);

    submissions[providerId] = submission;
  }

  logger.info(`Enqueued ${providerIds.length} provider jobs for release ${releaseId}`);
  return submissions;
}

/**
 * Run preflight validation on a release manifest
 */
export async function runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
  const errors: Array<{ code: string; message: string; severity: 'error' | 'warning'; field?: string }> = [];
  const warnings: Array<{ code: string; message: string; severity: 'error' | 'warning'; field?: string }> = [];

  // Basic validation
  if (!manifest.title || manifest.title.trim().length === 0) {
    errors.push({
      code: 'MISSING_TITLE',
      message: 'Release title is required',
      severity: 'error',
      field: 'title',
    });
  }

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

  // Check artwork (warning, not error)
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
    errors: errors.map(e => ({
      code: e.code,
      message: e.message,
      severity: e.severity,
      field: e.field,
    })),
    warnings: warnings.map(w => ({
      code: w.code,
      message: w.message,
      severity: w.severity,
      field: w.field,
    })),
  };
}

/**
 * Enqueue a provider submission job
 */
async function enqueueProviderJob(
  releaseId: string,
  providerId: string,
  manifest: ReleaseManifest,
  userId: string
): Promise<void> {
  await enqueueJob('submitToProvider', {
    releaseId,
    providerId,
    manifest,
    userId,
  });
}

/**
 * Persist submission record to Firestore
 */
export async function persistSubmission(
  releaseId: string,
  providerId: string,
  submission: ProviderSubmission
): Promise<void> {
  const submissionRef = db
    .collection('releases')
    .doc(releaseId)
    .collection('submissions')
    .doc(providerId);

  await submissionRef.set(submission);
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  releaseId: string,
  providerId: string,
  status: SubmissionStatus,
  submissionId?: string,
  error?: string,
  providerData?: Record<string, unknown>,
  providerUrl?: string
): Promise<void> {
  const submissionRef = db
    .collection('releases')
    .doc(releaseId)
    .collection('submissions')
    .doc(providerId);

  const submissionDoc = await submissionRef.get();
  if (!submissionDoc.exists) {
    throw new Error(`Submission ${providerId} not found for release ${releaseId}`);
  }

  const currentSubmission = submissionDoc.data() as ProviderSubmission;
  const now = new Date().toISOString();

  const updatedSubmission: ProviderSubmission = {
    ...currentSubmission,
    status,
    updatedAt: now,
    ...(submissionId && { submissionId }),
    ...(error && { error }),
    ...(providerData && { providerData }),
    ...(providerUrl && { providerUrl }),
    ...(status === 'completed' && { completedAt: now }),
    history: [
      ...currentSubmission.history,
      {
        timestamp: now,
        status,
        message: error || `Status changed to ${status}`,
        ...(providerData && { metadata: providerData }),
      },
    ],
  };

  // set() instead of update(): ProviderSubmission is a plain interface and
  // the Admin SDK's update() signature demands an index signature
  await submissionRef.set(updatedSubmission);
}

/**
 * Get all submissions for a release
 */
export async function getSubmissions(releaseId: string): Promise<Record<string, ProviderSubmission>> {
  const submissionsRef = db
    .collection('releases')
    .doc(releaseId)
    .collection('submissions');

  const snapshot = await submissionsRef.get();
  const submissions: Record<string, ProviderSubmission> = {};

  snapshot.forEach((doc) => {
    submissions[doc.id] = doc.data() as ProviderSubmission;
  });

  return submissions;
}

