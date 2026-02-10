import { BaseConnector } from './baseConnector';
import {
  ReleaseManifest, SubmissionPayload, SubmissionResult, PreflightResult,
} from '../../../types/export';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sanitizeFilename } from '../../../utils/formatters';

export class YouTubeConnector extends BaseConnector {
  readonly name = 'YouTube Music';
  readonly id = 'youtube';

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
        description: manifest.description,
        type: manifest.type,
        releaseDate: manifest.releaseDate,
        tags: manifest.tags,
        tracks: manifest.tracks.map(t => ({
          trackNumber: t.trackNumber,
          title: t.title || t.song.title,
          artist: t.song.artist,
          duration: t.song.duration,
          videoUrl: t.song.metadata?.videoUrl,
        })),
      },
      metadata: { releaseId: manifest.releaseId, format: 'mp3' },
    };
  }

  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const zip = new JSZip();
    const data = payload.data as Record<string, unknown>;

    zip.file('youtube_metadata.json', JSON.stringify(data, null, 2));
    zip.file('README.txt', `YouTube Music Distribution Package\n==================================\nTitle: ${data.title}\nFormat: MP3 (320kbps recommended)\n\nUpload via YouTube Studio or your distributor.`);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `youtube-music-${sanitizeFilename(String(data.title || 'release'))}.zip`);

    return {
      submissionId: `youtube-export-${Date.now()}`,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const base = await super.runPreflight(manifest);
    const errors = [...base.errors];
    const warnings = [...base.warnings];

    if (manifest.title && manifest.title.length > 100) {
      errors.push({ code: 'TITLE_TOO_LONG', message: 'YouTube title must be 100 characters or less', severity: 'error', field: 'title' });
    }
    if (manifest.description && manifest.description.length > 5000) {
      warnings.push({ code: 'DESCRIPTION_TOO_LONG', message: 'Description may be truncated', severity: 'warning', field: 'description' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
