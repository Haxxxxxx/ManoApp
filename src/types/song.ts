export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string | number;
  filePath?: string;
  imagePath?: string;
  downloadUrl?: string;
  file?: File;
  projectPath?: string;
  userId: string;
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
    releaseDate?: string;
    source?: 'local' | 'remote' | 'upload';
    _source?: string;
    _originalFileName?: string;
    _fileSize?: number;
    _lastModified?: number;
    _file?: File;
    featuring?: string[];
    lyrics?: string;
    videoUrl?: string;
    base64Data?: string;
    originalFileName?: string;
    lastModified?: number;
  };
  notes?: string;
} 