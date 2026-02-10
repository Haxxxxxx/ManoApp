import { Song } from '../types/song';

export interface CompletenessResult {
  score: number;
  label: string;
  color: 'error' | 'warning' | 'info' | 'success';
  missingFields: MissingField[];
  filledFields: string[];
  totalWeight: number;
  filledWeight: number;
}

export interface MissingField {
  key: string;
  label: string;
  tabIndex: number;
}

interface MetadataField {
  key: string;
  label: string;
  check: (song: Song) => boolean;
  weight: number;
  tabIndex: number; // which tab in SongDetailsPanel to navigate to
}

export const METADATA_FIELDS: MetadataField[] = [
  // Core fields (higher weight)
  { key: 'title', label: 'Title', check: (s) => !!s.title?.trim(), weight: 3, tabIndex: 0 },
  { key: 'artist', label: 'Artist', check: (s) => !!s.artist?.trim(), weight: 3, tabIndex: 0 },
  { key: 'duration', label: 'Duration', check: (s) => !!s.duration, weight: 2, tabIndex: 0 },
  // Metadata fields
  { key: 'genre', label: 'Genre', check: (s) => (s.metadata?.genre?.length ?? 0) > 0, weight: 1, tabIndex: 3 },
  { key: 'tags', label: 'Tags', check: (s) => (s.metadata?.tags?.length ?? 0) > 0, weight: 1, tabIndex: 3 },
  { key: 'bpm', label: 'BPM', check: (s) => s.metadata?.bpm != null, weight: 1, tabIndex: 0 },
  { key: 'key', label: 'Key', check: (s) => !!s.metadata?.key, weight: 1, tabIndex: 0 },
  { key: 'isrc', label: 'ISRC', check: (s) => !!s.metadata?.isrc, weight: 1, tabIndex: 3 },
  { key: 'releaseDate', label: 'Release Date', check: (s) => !!s.metadata?.releaseDate, weight: 1, tabIndex: 0 },
  { key: 'lyrics', label: 'Lyrics', check: (s) => !!s.metadata?.lyrics, weight: 1, tabIndex: 1 },
  { key: 'featuring', label: 'Featuring', check: (s) => (s.metadata?.featuring?.length ?? 0) > 0, weight: 1, tabIndex: 3 },
  { key: 'imagePath', label: 'Cover Art', check: (s) => !!s.imagePath, weight: 1, tabIndex: 2 },
  { key: 'videoUrl', label: 'Video URL', check: (s) => !!s.metadata?.videoUrl, weight: 1, tabIndex: 2 },
];

export function calculateMetadataCompleteness(song: Song): CompletenessResult {
  const filledFields: string[] = [];
  const missingFields: MissingField[] = [];
  let filledWeight = 0;
  let totalWeight = 0;

  for (const field of METADATA_FIELDS) {
    totalWeight += field.weight;
    if (field.check(song)) {
      filledFields.push(field.label);
      filledWeight += field.weight;
    } else {
      missingFields.push({ key: field.key, label: field.label, tabIndex: field.tabIndex });
    }
  }

  const score = Math.round((filledWeight / totalWeight) * 100);

  let label: string;
  let color: CompletenessResult['color'];

  if (score < 25) {
    label = 'Incomplete';
    color = 'error';
  } else if (score < 50) {
    label = 'Basic';
    color = 'warning';
  } else if (score < 80) {
    label = 'Good';
    color = 'info';
  } else {
    label = 'Release Ready';
    color = 'success';
  }

  return { score, label, color, missingFields, filledFields, totalWeight, filledWeight };
}
