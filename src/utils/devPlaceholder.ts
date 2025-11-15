import { Trip } from '../types/trip';
import { Song } from '../types/song';
import { Album, AlbumSong } from '../types/album';

/**
 * Development-only placeholder project for testing
 * This is only rendered when import.meta.env.DEV is true
 */
export const createDevPlaceholderProject = (): Trip => {
  const placeholderSongs: Song[] = [
    {
      id: 'dev-song-1',
      title: 'Sample Track 1',
      artist: 'Demo Artist',
      duration: '3:45',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'local' as const,
        tags: ['Electronic', 'Upbeat'],
        genre: ['Electronic'],
        bpm: 128,
      },
    },
    {
      id: 'dev-song-2',
      title: 'Sample Track 2',
      artist: 'Demo Artist',
      duration: '4:12',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'local' as const,
        tags: ['Rock', 'Energetic'],
        genre: ['Rock'],
        bpm: 140,
      },
    },
    {
      id: 'dev-song-3',
      title: 'Sample Track 3',
      artist: 'Demo Artist',
      duration: '2:58',
      userId: 'dev-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'local' as const,
        tags: ['Jazz', 'Calm'],
        genre: ['Jazz'],
        bpm: 90,
      },
    },
  ];

  return {
    id: 'dev-placeholder-project',
    name: '🧪 Dev Test Project',
    description: 'This is a development placeholder project for testing. It will not appear in production.',
    userId: 'dev-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    songs: placeholderSongs,
    collaborators: [],
    tags: ['dev', 'test', 'placeholder'],
    type: 'project',
    status: 'in-progress',
    isPrivate: false,
    metadata: {
      isDevPlaceholder: true,
    },
  };
};

/**
 * Check if a trip is a dev placeholder
 */
export const isDevPlaceholder = (trip: Trip): boolean => {
  return trip.id === 'dev-placeholder-project' || 
         (trip.metadata as { isDevPlaceholder?: boolean })?.isDevPlaceholder === true;
};

/**
 * Development-only placeholder album for testing
 * This is only rendered when import.meta.env.DEV is true
 */
export const createDevPlaceholderAlbum = (): Album => {
  const placeholderSongs: AlbumSong[] = [
    {
      id: 'dev-album-song-1',
      title: 'Test Track Alpha',
      artist: 'Dev Artist',
      duration: 225, // 3:45 in seconds
      filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      metadata: {
        source: 'project',
        bpm: 128,
        key: 'C Major',
        genre: ['Electronic'],
        tags: ['electronic', 'ambient', 'test'],
      },
    },
    {
      id: 'dev-album-song-2',
      title: 'Beta Groove',
      artist: 'Test Band',
      duration: 150, // 2:30 in seconds
      filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      metadata: {
        source: 'project',
        bpm: 100,
        key: 'G Minor',
        genre: ['Rock'],
        tags: ['rock', 'indie', 'demo'],
      },
    },
    {
      id: 'dev-album-song-3',
      title: 'Jazz Fusion Jam',
      artist: 'Improv Collective',
      duration: 310, // 5:10 in seconds
      filePath: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      metadata: {
        source: 'project',
        bpm: 140,
        key: 'Bb Major',
        genre: ['Jazz'],
        tags: ['jazz', 'instrumental', 'fusion'],
      },
    },
  ];

  return {
    id: 'dev-placeholder-album',
    userId: 'dev-user',
    title: '🧪 Dev Test Album',
    artist: 'Demo Artist',
    releaseDate: new Date().toISOString(),
    genre: 'Electronic',
    description: 'This is a development placeholder album for testing. It will not appear in production.',
    coverImage: 'https://via.placeholder.com/400/DC2626/FFFFFF?text=DEV+ALBUM',
    selectedPlatforms: ['soundcloud'],
    songs: placeholderSongs,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Check if an album is a dev placeholder
 */
export const isDevPlaceholderAlbum = (album: Album): boolean => {
  return album.id === 'dev-placeholder-album';
};

