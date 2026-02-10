import { useState, useCallback } from 'react';
import { Song } from '../types/song';
import { updateSong } from '../services/firebaseService';

export function useBatchOperations() {
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());

  const toggleSong = useCallback((songId: string) => {
    setSelectedSongIds(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, []);

  const selectAll = useCallback((songIds: string[]) => {
    setSelectedSongIds(new Set(songIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedSongIds(new Set());
  }, []);

  const applyBatchUpdate = useCallback(async (
    updates: Partial<Song>,
    songs: Song[]
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> => {
    const selected = songs.filter(s => selectedSongIds.has(s.id));
    const results = await Promise.allSettled(
      selected.map(song => updateSong(song.id, updates))
    );

    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        succeeded.push(selected[idx].id);
      } else {
        failed.push({ id: selected[idx].id, error: result.reason?.message || 'Unknown error' });
      }
    });

    return { succeeded, failed };
  }, [selectedSongIds]);

  return { selectedSongIds, toggleSong, selectAll, deselectAll, applyBatchUpdate };
}
