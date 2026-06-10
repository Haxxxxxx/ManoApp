/**
 * Revelator Connector (client-side)
 *
 * Frontend counterpart of the server-side Revelator connector. Actual
 * submission runs in Cloud Functions via the distribution orchestrator
 * (platform-level credentials never reach the client) — this class
 * provides registry presence, authorization checks, and DSP-grade
 * preflight feedback in the UI.
 */

import { BaseConnector } from './baseConnector';
import {
  ReleaseManifest,
  SubmissionPayload,
  SubmissionResult,
  PreflightResult,
  PreflightIssue,
} from '../../../types/export';

/** ISRC: 2-letter country, 3-char registrant, 2-digit year, 5-digit designation */
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
/** UPC/EAN: 12 or 13 digits */
const UPC_RE = /^\d{12,13}$/;
/** Minimum lead time DSPs want between submission and release date */
const RELEASE_LEAD_DAYS = 7;

export class RevelatorConnector extends BaseConnector {
  readonly name = 'Revelator';
  readonly id = 'revelator';

  /**
   * Revelator uses platform-level enterprise credentials configured on
   * the backend — no per-user OAuth flow is needed.
   */
  async authorize(_userId: string): Promise<string | { redirectUrl: string }> {
    return 'authorized';
  }

  /**
   * DSP-grade preflight, mirroring the server-side connector so users
   * see delivery blockers before the orchestrator rejects them.
   */
  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const base = await super.runPreflight(manifest);
    const errors: PreflightIssue[] = [...base.errors];
    const warnings: PreflightIssue[] = [...base.warnings];

    // Artwork is a hard requirement for DSP delivery (base treats it as a warning)
    const artworkWarningIdx = warnings.findIndex((w) => w.code === 'MISSING_ARTWORK');
    if (artworkWarningIdx !== -1) {
      warnings.splice(artworkWarningIdx, 1);
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
        message: 'Genre is missing — DSPs require a primary genre before live delivery',
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
    }

    for (const track of manifest.tracks ?? []) {
      const label = track.title || track.song?.title || `#${track.trackNumber}`;
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

    return { valid: errors.length === 0, errors, warnings };
  }

  async prepare(manifest: ReleaseManifest): Promise<SubmissionPayload> {
    const preflight = await this.runPreflight(manifest);
    if (!preflight.valid) {
      throw new Error(
        `Preflight validation failed: ${preflight.errors.map((e) => e.message).join(', ')}`
      );
    }
    return { data: { releaseId: manifest.releaseId } };
  }

  /**
   * Direct client-side submission is intentionally unsupported:
   * distribution must go through the orchestrator Cloud Function.
   */
  async submit(_payload: SubmissionPayload): Promise<SubmissionResult> {
    throw new Error(
      'Revelator distribution runs server-side. Enable the "distributor" feature flag and submit through the distribution orchestrator.'
    );
  }
}
