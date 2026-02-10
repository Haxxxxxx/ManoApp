import { useState, useMemo } from 'react';
import { Song } from '../types/song';

interface UseSongSearchReturn {
  songSearchQuery: string;
  setSongSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredSongs: Song[];
}

export function useSongSearch(songs: Song[]): UseSongSearchReturn {
  const [songSearchQuery, setSongSearchQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) {
      return songs;
    }
    const query = songSearchQuery.toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        song.metadata?.genre?.some((g) => g.toLowerCase().includes(query))
    );
  }, [songs, songSearchQuery]);

  return {
    songSearchQuery,
    setSongSearchQuery,
    filteredSongs,
  };
}
