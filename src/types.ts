export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filePath: string;
  imagePath?: string;
  userId: string;
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
    releaseDate?: string;
    source?: 'local' | 'remote' | 'upload';
    lyrics?: string;
    featuring?: string[];
    videoUrl?: string;
  };
} 

export interface Trip {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  songs?: Song[];
  collaborators?: string[];
  tags?: string[];
  coverImage?: string;
} 