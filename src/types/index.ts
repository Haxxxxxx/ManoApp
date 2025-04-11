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
}

export interface Song {
  id: string;
  title: string;
  description: string;
  userId: string;
  tripId: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
  imagePath: string;
  videoPath: string;
  metadata: {
    lyrics: string;
    duration: string;
    style: string;
    tags: string[];
    feats: string[];
    genre: string[];
    bpm: number;
    key: string;
    mood: string;
    instruments: string[];
    language: string;
    year: string;
    isrc: string;
    upc: string;
    publisher: string;
    copyright: string;
    recordingLocation: string;
    recordingDate: string;
    producer: string;
    engineer: string;
    mixer: string;
    masteringEngineer: string;
    notes: string;
  };
} 