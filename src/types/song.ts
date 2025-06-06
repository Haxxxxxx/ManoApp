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
  metadata?: SongMetadata;
  notes?: string;
}

export type SongMetadata = {
  bpm?: number;
  key?: string;
  genre?: string[];
  tags?: string[];
  releaseDate?: string;
  source?: 'local' | 'remote' | 'upload';
  featuring?: string[];
  lyrics?: string;
  videoUrl?: string;
  _originalFileName?: string;
  _fileSize?: number;
  _lastModified?: number;
}; 