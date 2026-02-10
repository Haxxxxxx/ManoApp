import { useState, useEffect, useCallback, useRef } from 'react';
import { getSongs, getSong, createSong, updateSong, deleteSong } from '../services/firebaseService';
import { Song } from '../types/song';
import { getErrorMessage } from '../utils/storageHelpers';

interface UseSongsOptions {
  tripId?: string;
  autoFetch?: boolean;
}

interface UseSongsReturn {
  songs: Song[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addSong: (song: Omit<Song, 'id'>) => Promise<Song>;
  updateSongData: (songId: string, updates: Partial<Song>) => Promise<Song>;
  removeSong: (songId: string) => Promise<void>;
  getSongById: (songId: string) => Promise<Song | null>;
}

/**
 * Custom hook for managing songs data
 * Provides consistent data fetching, caching, and state management
 */
export function useSongs(options: UseSongsOptions = {}): UseSongsReturn {
  const { tripId, autoFetch = true } = options;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchSongs = useCallback(async () => {
    if (!tripId) {
      setSongs([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedSongs = await getSongs(tripId);
      if (!cancelledRef.current) {
        setSongs(fetchedSongs);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        const errorMessage = getErrorMessage(err, 'Failed to fetch songs');
        setError(errorMessage);
        setSongs([]);
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    cancelledRef.current = false;
    if (autoFetch && tripId) {
      fetchSongs();
    } else if (!tripId) {
      setSongs([]);
    }

    return () => {
      cancelledRef.current = true;
    };
  }, [autoFetch, tripId, fetchSongs]);

  const addSong = useCallback(async (song: Omit<Song, 'id'>): Promise<Song> => {
    if (!tripId) {
      throw new Error('Trip ID is required to create a song');
    }

    try {
      setError(null);
      const newSong = await createSong(tripId, song);
      setSongs(prev => [...prev, newSong]);
      return newSong;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to create song');
      setError(errorMessage);
      throw err;
    }
  }, [tripId]);

  const updateSongData = useCallback(async (songId: string, updates: Partial<Song>): Promise<Song> => {
    try {
      setError(null);
      const updatedSong = await updateSong(songId, updates);
      setSongs(prev => prev.map(s => s.id === songId ? updatedSong : s));
      return updatedSong;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to update song');
      setError(errorMessage);
      throw err;
    }
  }, []);

  const removeSong = useCallback(async (songId: string): Promise<void> => {
    try {
      setError(null);
      await deleteSong(songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to delete song');
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getSongById = useCallback(async (songId: string): Promise<Song | null> => {
    try {
      return await getSong(songId);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to fetch song');
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    songs,
    loading,
    error,
    refresh: fetchSongs,
    addSong,
    updateSongData,
    removeSong,
    getSongById,
  };
}

