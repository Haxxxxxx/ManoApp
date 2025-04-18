export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filePath: string;
  file?: File;
  imagePath?: string;
  projectPath?: string;
  userId: string;
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
    releaseDate?: string;
    source?: 'local' | 'remote' | 'upload';
    featuring?: string[];
    lyrics?: string;
    videoUrl?: string;
    base64Data?: string;
    originalFileName?: string;
    fileSize?: number;
    lastModified?: number;
  };
  notes?: string;
} 