import { BaseConnector } from './baseConnector';
import {
  ReleaseManifest, SubmissionPayload, SubmissionResult, PreflightResult,
} from '../../../types/export';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sanitizeFilename } from '../../../utils/formatters';

export class SpotifyConnector extends BaseConnector {
  readonly name = 'Spotify';
  readonly id = 'spotify';

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
          explicit: t.metadata?.explicit || false,
          duration: t.song.duration,
        })),
      },
      metadata: { releaseId: manifest.releaseId, format: 'wav' },
    };
  }

  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    const zip = new JSZip();
    const data = payload.data as Record<string, unknown>;
    const tracks = data.tracks as Array<Record<string, unknown>>;

    zip.file('spotify_metadata.json', JSON.stringify(data, null, 2));
    zip.file('README.txt', `Spotify Distribution Package\n============================\nTitle: ${data.title}\nFormat: WAV (16-bit, 44.1kHz minimum)\nTracks: ${tracks?.length || 0}\n\nUpload this package to your Spotify for Artists distributor.`);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `spotify-${sanitizeFilename(String(data.title || 'release'))}.zip`);

    return {
      submissionId: `spotify-export-${Date.now()}`,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  async runPreflight(manifest: ReleaseManifest): Promise<PreflightResult> {
    const base = await super.runPreflight(manifest);
    const errors = [...base.errors];
    const warnings = [...base.warnings];

    if (manifest.title && manifest.title.length > 200) {
      errors.push({ code: 'TITLE_TOO_LONG', message: 'Spotify title must be 200 characters or less', severity: 'error', field: 'title' });
    }

    for (const track of manifest.tracks || []) {
      if (!track.metadata?.isrc && !track.song?.metadata?.isrc) {
        warnings.push({ code: 'MISSING_ISRC', message: `Track "${track.song?.title}" is missing ISRC code`, severity: 'warning', field: `tracks[${track.trackNumber - 1}].isrc` });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
