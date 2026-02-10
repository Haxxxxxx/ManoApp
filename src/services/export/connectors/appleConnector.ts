import { BaseConnector } from './baseConnector';
import {
  ReleaseManifest, SubmissionPayload, SubmissionResult, PreflightResult,
} from '../../../types/export';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sanitizeFilename } from '../../../utils/formatters';

export class AppleConnector extends BaseConnector {
  readonly name = 'Apple Music';
  readonly id = 'apple';

  async authorize(_userId: string): Promise<string | { redirectUrl: string }> {
    return 'export-only';
  }

  async prepare(manifest: ReleaseManifest): Promise<SubmissionPayload> {
    const preflight = await this.runPreflight(manifest);
    if (!preflight.valid) {
      throw new Error(`Preflight failed: ${preflight.errors.map(e => e.message).join(', ')}`);
    }
    return {
      data: {
        title: manifest.title,
        type: manifest.type,
        releaseDate: manifest.releaseDate,
        genre: manifest.genre,
        tracks: manifest.tracks.map(t => ({
          trackNumber: t.trackNumber,
          title: t.title || t.song.title,
          artist: t.song.artist,
          isrc: t.metadata?.isrc || t.song.metadata?.isrc,
          explicit: t.metadata?.explicit || false,
          duration: t.song.duration,
        })),
      },
      metadata: { releaseId: manifest.releaseId, format: 'aiff' },
    };
  }

  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const zip = new JSZip();
    const data = payload.data as Record<string, unknown>;

    zip.file('apple_metadata.json', JSON.stringify(data, null, 2));
    zip.file('README.txt', `Apple Music Distribution Package\n================================\nTitle: ${data.title}\nFormat: AIFF (16-bit, 44.1kHz minimum)\n\nUpload via Apple Music for Artists or your distributor.`);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `apple-music-${sanitizeFilename(String(data.title || 'release'))}.zip`);

    return {
      submissionId: `apple-export-${Date.now()}`,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const base = await super.runPreflight(manifest);
    const errors = [...base.errors];
    const warnings = [...base.warnings];

    if (manifest.title && manifest.title.length > 255) {
      errors.push({ code: 'TITLE_TOO_LONG', message: 'Apple Music title must be 255 characters or less', severity: 'error', field: 'title' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
