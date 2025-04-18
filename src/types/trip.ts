import { Song } from './song';

export interface Trip {
  id: string;
  name: string;
  description: string;
  userId: string;
  songs: Song[];
  createdAt: string;
  updatedAt: string;
  collaborators: string[];
  tags: string[];
  status: 'draft' | 'published';
  coverImageUrl?: string;
  type?: 'project' | 'playlist';
  visibility?: 'private' | 'public' | 'unlisted';
  metadata?: {
    genre?: string[];
    releaseDate?: string;
    language?: string;
    [key: string]: any;
  };
} 