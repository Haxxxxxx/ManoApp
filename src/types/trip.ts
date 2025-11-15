import { Song } from './song';

export type TripStatus = 'draft' | 'in-progress' | 'completed' | 'archived' | 'published';

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
  type?: 'project' | 'playlist' | 'single' | 'album';
  status?: TripStatus;
  isPrivate?: boolean;
  template?: string;
  metadata?: Record<string, unknown>;
  publishedAt?: string;
} 