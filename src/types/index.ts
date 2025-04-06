export interface Trip {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  songs: Song[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filePath?: string;
  imagePath?: string;
  projectPath?: string;
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
  };
  notes?: string;
} 