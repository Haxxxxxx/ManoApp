/**
 * Mock Release Manifest Data
 * 
 * Sample data for Storybook stories
 */

import { ReleaseManifest, RightsSplit } from '../../types/export';
import { Song } from '../../types/song';

export const mockSong: Song = {
  id: 'song-1',
  title: 'Amazing Track',
  artist: 'Test Artist',
  filePath: 'https://storage.example.com/song.mp3',
  userId: 'user-1',
  tripId: 'trip-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    bpm: 128,
    key: 'C major',
    genre: ['Electronic', 'House'],
    tags: ['dance', 'electronic'],
  },
};

export const mockRightsSplits: RightsSplit[] = [
  {
    userId: 'user-1',
    name: 'Artist',
    percentage: 50,
    role: 'Artist',
  },
  {
    userId: 'user-2',
    name: 'Producer',
    percentage: 50,
    role: 'Producer',
  },
];

export const mockReleaseManifest: ReleaseManifest = {
  releaseId: 'release-1',
  title: 'My Amazing Release',
  description: 'This is a test release with amazing music',
  type: 'single',
  releaseDate: new Date().toISOString(),
  genre: 'Electronic',
  tags: ['electronic', 'dance', 'house'],
  artworkUrl: 'https://storage.example.com/artwork.jpg',
  tracks: [
    {
      trackNumber: 1,
      songId: 'song-1',
      song: mockSong,
      title: 'Amazing Track',
    },
  ],
  rightsSplits: mockRightsSplits,
};

export const mockReleaseManifestAlbum: ReleaseManifest = {
  ...mockReleaseManifest,
  type: 'album',
  title: 'My Amazing Album',
  tracks: [
    {
      trackNumber: 1,
      songId: 'song-1',
      song: mockSong,
      title: 'Track 1',
    },
    {
      trackNumber: 2,
      songId: 'song-2',
      song: { ...mockSong, id: 'song-2', title: 'Track 2' },
      title: 'Track 2',
    },
  ],
};

export const mockReleaseManifestInvalid: ReleaseManifest = {
  ...mockReleaseManifest,
  title: '', // Missing title
  tracks: [], // No tracks
  rightsSplits: [
    { userId: 'user-1', name: 'Artist', percentage: 60 },
    { userId: 'user-2', name: 'Producer', percentage: 30 }, // Doesn't sum to 100
  ],
};

