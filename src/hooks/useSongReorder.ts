import { useCallback, useRef, useState, useEffect } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import type { Song } from '../types/song';
import { updateSongOrder } from '../services/firebaseService';

const DEBOUNCE_MS = 500;

export function useSongReorder(
  songs: Song[],
  setSongs: (songs: Song[]) => void,
  _tripId: string
) {
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(songs);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);

      setSongs(items);

      // Debounced persist
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const orders = items.map((s, i) => ({ songId: s.id, sortOrder: i }));
          await updateSongOrder(orders);
        } catch {
          // reorder persist failed silently — local state still updated
        } finally {
          setIsSaving(false);
        }
      }, DEBOUNCE_MS);
    },
    [songs, setSongs]
  );

  return { handleDragEnd, isSaving };
}
