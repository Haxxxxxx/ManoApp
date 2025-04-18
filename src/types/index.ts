export interface Trip {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  userId: string;
  collaborators?: {
    [userId: string]: {
      role: 'owner' | 'editor' | 'viewer';
      joinedAt: string;
    };
  };
  songs: Song[];
  coverImage?: string;
  collaborators?: string[];
  tags?: string[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filePath: string;
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
  };
  notes?: string;
} 