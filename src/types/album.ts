export interface AlbumSong {
  id: string;
  title: string;
  artist: string;
  duration: number;  // Duration in seconds
  filePath?: string;
  metadata?: {
    source?: 'local' | 'project' | 'firebase';
    projectName?: string;
    bpm?: number;
    key?: string;
    genre?: string[];
    tags?: string[];
    releaseDate?: string;
    isrc?: string;
    featuring?: string[];
    lyrics?: string;
    videoUrl?: string;
    filePath?: string;
  };
}

export interface Album {
  id: string;
  userId: string;
  title: string;
  artist: string;
  releaseDate: string;
  genre: string;
  description: string;
  coverImage: string | null;
  selectedPlatforms: string[];
  songs: AlbumSong[];
  createdAt: string;
  updatedAt: string;
} 