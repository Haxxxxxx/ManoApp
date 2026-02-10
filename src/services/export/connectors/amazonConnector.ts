import { BaseConnector } from './baseConnector';
import {
  ReleaseManifest, SubmissionPayload, SubmissionResult, PreflightResult,
} from '../../../types/export';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sanitizeFilename } from '../../../utils/formatters';

export class AmazonConnector extends BaseConnector {
  readonly name = 'Amazon Music';
  readonly id = 'amazon';

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
        tracks: manifest.tracks.map(t => ({
          trackNumber: t.trackNumber,
          title: t.title || t.song.title,
          artist: t.song.artist,
          isrc: t.metadata?.isrc || t.song.metadata?.isrc,
          duration: t.song.duration,
        })),
      },
      metadata: { releaseId: manifest.releaseId, format: 'flac' },
    };
  }

  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const zip = new JSZip();
    const data = payload.data as Record<string, unknown>;

    zip.file('amazon_metadata.json', JSON.stringify(data, null, 2));
    zip.file('README.txt', `Amazon Music Distribution Package\n=================================\nTitle: ${data.title}\nFormat: FLAC (lossless)\n\nUpload via your Amazon Music distributor.`);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `amazon-music-${sanitizeFilename(String(data.title || 'release'))}.zip`);

    return {
      submissionId: `amazon-export-${Date.now()}`,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const base = await super.runPreflight(manifest);
    return { valid: base.errors.length === 0, errors: [...base.errors], warnings: [...base.warnings] };
  }
}
