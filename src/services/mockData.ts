import { Trip, Song } from '../types/index';

export const mockTrips: Trip[] = [
  {
    id: '1',
    name: 'Summer 2023',
    description: 'My summer playlist for 2023',
    createdAt: '2023-06-01',
    userId: 'mock-user-id',
    songs: [
      {
        id: '1',
        title: 'Summer Vibes',
        artist: 'Artist 1',
        duration: '3:45',
        userId: 'mock-user-id',
        metadata: {
          bpm: 120,
          key: 'C Major',
          genre: ['Pop', 'Electronic'],
          tags: ['summer', 'happy']
        },
        notes: 'Great for beach parties'
      },
      {
        id: '2',
        title: 'Sunset Dreams',
        artist: 'Artist 2',
        duration: '4:20',
        userId: 'mock-user-id',
        metadata: {
          bpm: 110,
          key: 'G Minor',
          genre: ['Chill', 'Ambient'],
          tags: ['sunset', 'relaxing']
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Road Trip',
    description: 'Perfect playlist for long drives',
    createdAt: '2023-07-15',
    userId: 'mock-user-id',
    songs: [
      {
        id: '3',
        title: 'Highway Star',
        artist: 'Artist 3',
        duration: '5:30',
        userId: 'mock-user-id',
        metadata: {
          bpm: 140,
          key: 'A Major',
          genre: ['Rock', 'Classic Rock'],
          tags: ['road', 'energy']
        }
      }
    ]
  }
];

export const getTripById = (id: string): Trip | undefined => {
  return mockTrips.find(trip => trip.id === id);
};

export const getSongById = (tripId: string, songId: string): Song | undefined => {
  const trip = getTripById(tripId);
  return trip?.songs.find(song => song.id === songId);
}; 