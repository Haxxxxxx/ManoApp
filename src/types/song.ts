import { AIMetadata } from './ai';
import { Stem } from './stem';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string | number;
  filePath: string;
  imagePath?: string;
  downloadUrl?: string;
  file?: File;
  projectPath?: string;
  userId: string;
  tripId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  metadata?: SongMetadata;
  notes?: string;
  /** Array of stems (multitrack audio files) */
  stems?: Stem[];
  status?: SongStatus;
}

export type SongStatus = 'draft' | 'in-review' | 'ready' | 'published' | 'archived';

export type SongMetadata = {
  bpm?: number;
  key?: string;
  genre?: string[];
  tags?: string[];
  releaseDate?: string;
  source?: 'local' | 'remote' | 'upload';
  isrc?: string;
  featuring?: string[];
  lyrics?: string;
  videoUrl?: string;
  _originalFileName?: string;
  _fileSize?: number;
  _lastModified?: number;
  /** AI-generated metadata suggestions */
  aiMetadata?: AIMetadata;
  /** Suggested tags from AI (array of tag strings) */
  suggestedTags?: string[];
}; 