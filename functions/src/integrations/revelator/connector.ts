/**
 * Revelator Provider Connector (server-side)
 *
 * Implements ProviderConnector for the orchestrator job pipeline.
 * Unlike SoundCloud, Revelator uses platform-level credentials (our
 * enterprise account), so no per-user OAuth is required — `authorize`
 * succeeds whenever the client is configured.
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import type {
  PreflightIssue,
  PreflightResult,
  ProviderConnector,
  ReleaseManifest,
  SubmissionPayload,
  SubmissionResult,
} from '../../types/export';
import { RevelatorClient } from './client';
import { RevelatorReleasePayload } from './types';

/** ISRC: 2-letter country, 3-char registrant, 2-digit year, 5-digit designation */
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
/** UPC/EAN: 12 or 13 digits */
const UPC_RE = /^\d{12,13}$/;
/** Minimum lead time DSPs want between submission and release date */
const RELEASE_LEAD_DAYS = 7;

export class RevelatorConnector implements ProviderConnector {
  readonly name = 'Revelator';
  readonly id = 'revelator';

  private client: RevelatorClient;

  constructor(client: RevelatorClient = new RevelatorClient()) {
    this.client = client;
  }

  async authorize(_userId: string): Promise<string | { redirectUrl: string }> {
    if (!this.client.isConfigured()) {
      throw new Error(
        'Revelator is not configured. Set REVELATOR_CLIENT_ID / REVELATOR_CLIENT_SECRET or REVELATOR_MODE=mock.'
      );
    }
    return 'authorized';
  }

  /**
   * DSP-grade preflight: stricter than the generic orchestrator checks
   * because content delivered through a distributor reaches Spotify/Apple
   * ingestion, which rejects incomplete metadata.
   */
  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const errors: PreflightIssue[] = [];
    const warnings: PreflightIssue[] = [];

    if (!manifest.title?.trim()) {
      errors.push({ code: 'MISSING_TITLE', message: 'Release title is required', severity: 'error', field: 'title' });
    }

    if (!manifest.tracks?.length) {
      errors.push({ code: 'NO_TRACKS', message: 'At least one track is required', severity: 'error', field: 'tracks' });
    }

    if (!manifest.artworkUrl && !manifest.artworkFile) {
      errors.push({
        code: 'MISSING_ARTWORK',
        message: 'Cover artwork is required for DSP delivery (3000×3000 px recommended)',
        severity: 'error',
        field: 'artworkUrl',
      });
    }

    if (!manifest.genre) {
      warnings.push({
        code: 'MISSING_GENRE',
        message: 'Genre is missing — DSPs require a primary genre, it will need to be set before live delivery',
        severity: 'warning',
        field: 'genre',
      });
    }

    if (!manifest.releaseDate) {
      warnings.push({
        code: 'MISSING_RELEASE_DATE',
        message: 'No release date set — distributor will assign the earliest available date',
        severity: 'warning',
        field: 'releaseDate',
      });
    } else {
      const lead = (new Date(manifest.releaseDate).getTime() - Date.now()) / 86_400_000;
      if (Number.isFinite(lead) && lead < RELEASE_LEAD_DAYS) {
        warnings.push({
          code: 'SHORT_RELEASE_LEAD',
          message: `Release date is less than ${RELEASE_LEAD_DAYS} days out — editorial playlist pitching will not be possible`,
          severity: 'warning',
          field: 'releaseDate',
        });
      }
    }

    const upc = manifest.metadata?.upc;
    if (typeof upc === 'string' && upc.length > 0 && !UPC_RE.test(upc)) {
      errors.push({
        code: 'INVALID_UPC',
        message: `UPC "${upc}" is not a valid 12–13 digit barcode`,
        severity: 'error',
        field: 'metadata.upc',
      });
    } else if (!upc) {
      warnings.push({
        code: 'MISSING_UPC',
        message: 'No UPC provided — the distributor will assign one automatically',
        severity: 'warning',
        field: 'metadata.upc',
      });
    }

    for (const track of manifest.tracks ?? []) {
      const label = track.title || track.song?.title || `#${track.trackNumber}`;

      if (!track.song?.filePath) {
        errors.push({
          code: 'MISSING_TRACK_FILE',
          message: `Track "${label}" is missing its audio file`,
          severity: 'error',
          field: `tracks[${track.trackNumber - 1}].filePath`,
        });
      }

      const isrc = track.metadata?.isrc;
      if (isrc && !ISRC_RE.test(isrc.replace(/-/g, '').toUpperCase())) {
        errors.push({
          code: 'INVALID_ISRC',
          message: `Track "${label}" has an invalid ISRC "${isrc}" (expected e.g. USABC2400001)`,
          severity: 'error',
          field: `tracks[${track.trackNumber - 1}].metadata.isrc`,
        });
      } else if (!isrc) {
        warnings.push({
          code: 'MISSING_ISRC',
          message: `Track "${label}" has no ISRC — the distributor will assign one automatically`,
          severity: 'warning',
          field: `tracks[${track.trackNumber - 1}].metadata.isrc`,
        });
      }
    }

    if (manifest.rightsSplits?.length) {
      const total = manifest.rightsSplits.reduce((sum, s) => sum + s.percentage, 0);
      if (Math.abs(total - 100) > 0.01) {
        errors.push({
          code: 'INVALID_SPLITS',
          message: `Rights splits must sum to 100% (currently ${total}%)`,
          severity: 'error',
          field: 'rightsSplits',
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Map the release manifest to the Revelator payload and resolve
   * Storage paths to signed download URLs the provider can ingest from.
   */
  async prepare(manifest: ReleaseManifest): Promise<SubmissionPayload> {
    const preflight = await this.runPreflight(manifest);
    if (!preflight.valid) {
      throw new Error(
        `Revelator preflight failed: ${preflight.errors.map((e) => e.message).join('; ')}`
      );
    }

    const primaryArtist =
      (manifest.metadata?.primaryArtist as string | undefined) ||
      manifest.tracks[0]?.song?.artist ||
      'Unknown Artist';

    const payload: RevelatorReleasePayload = {
      externalId: manifest.releaseId,
      title: manifest.title,
      releaseType: manifest.type,
      primaryArtist,
      label: manifest.metadata?.label as string | undefined,
      genre: manifest.genre,
      releaseDate: manifest.releaseDate,
      upc: manifest.metadata?.upc as string | undefined,
      artworkUrl: manifest.artworkUrl,
      tracks: await Promise.all(
        manifest.tracks.map(async (track) => ({
          trackNumber: track.trackNumber,
          title: track.title || track.song?.title || `Track ${track.trackNumber}`,
          primaryArtist: track.song?.artist || primaryArtist,
          isrc: track.metadata?.isrc?.replace(/-/g, '').toUpperCase(),
          explicit: Boolean(track.metadata?.explicit),
          ...(await this.resolveAudioUrl(track.song?.filePath)),
        }))
      ),
      splits: manifest.rightsSplits?.map((s) => ({
        name: s.name,
        role: s.role,
        percentage: s.percentage,
      })),
    };

    return { data: payload as unknown as Record<string, unknown> };
  }

  /**
   * Submit with retry checkpointing: Cloud Tasks redelivers the job on
   * failure (up to 5 attempts), so each provider side effect is persisted
   * to the submission doc the moment it succeeds and skipped on subsequent
   * attempts. Without this, a transient failure after distributeRelease
   * would trigger duplicate DSP deliveries on retry.
   */
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const releasePayload = payload.data as unknown as RevelatorReleasePayload;

    // externalId is the ManoApp releaseId (set in prepare())
    const checkpointRef = admin
      .firestore()
      .collection('releases')
      .doc(releasePayload.externalId)
      .collection('submissions')
      .doc(this.id);

    const checkpoint = (await checkpointRef.get()).data() ?? {};
    const checkpointData = (checkpoint.providerData ?? {}) as Record<string, unknown>;

    // Distribution already triggered by a prior attempt — never re-distribute;
    // report the provider's current status instead
    const existingDistributionId = checkpoint.submissionId as string | undefined;
    if (existingDistributionId) {
      logger.info(
        `Revelator distribution ${existingDistributionId} already triggered for ${releasePayload.externalId}; refreshing status instead of re-submitting`
      );
      return this.getSubmissionStatus(existingDistributionId);
    }

    let revelatorReleaseId = checkpointData.revelatorReleaseId as string | undefined;
    if (!revelatorReleaseId) {
      const release = await this.client.createRelease(releasePayload);
      revelatorReleaseId = release.releaseId;
      await checkpointRef.set(
        { providerData: { revelatorReleaseId, mode: this.client.mode } },
        { merge: true }
      );
    }

    const distribution = await this.client.distributeRelease(revelatorReleaseId);
    await checkpointRef.set(
      { submissionId: distribution.distributionId },
      { merge: true }
    );

    return {
      submissionId: distribution.distributionId,
      status: distribution.status === 'failed' ? 'failed' : 'processing',
      error: distribution.error,
      providerUrl: distribution.dashboardUrl,
      providerData: {
        revelatorReleaseId,
        mode: this.client.mode,
      },
      submittedAt: new Date().toISOString(),
    };
  }

  async getSubmissionStatus(submissionId: string): Promise<SubmissionResult> {
    const distribution = await this.client.getDistributionStatus(submissionId);

    const status: SubmissionResult['status'] =
      distribution.status === 'delivered'
        ? 'completed'
        : distribution.status === 'failed'
          ? 'failed'
          : distribution.status === 'queued'
            ? 'pending'
            : 'processing';

    return {
      submissionId,
      status,
      error: distribution.error,
      providerUrl: distribution.dashboardUrl,
      submittedAt: new Date().toISOString(),
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
    };
  }

  /**
   * Generate a signed URL for a Storage path so the provider can download
   * the audio. Falls back to passing the raw path (mock mode tolerates it).
   */
  private async resolveAudioUrl(
    filePath?: string
  ): Promise<{ audioUrl?: string; audioPath?: string }> {
    if (!filePath) return {};

    // Already a downloadable URL
    if (/^https?:\/\//.test(filePath)) {
      return { audioUrl: filePath };
    }

    try {
      const bucket = admin.storage().bucket();
      const [signedUrl] = await bucket.file(filePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 86_400_000,
      });
      return { audioUrl: signedUrl };
    } catch (error) {
      logger.warn(`Could not sign URL for ${filePath}, passing raw path`, error);
      return { audioPath: filePath };
    }
  }
}
