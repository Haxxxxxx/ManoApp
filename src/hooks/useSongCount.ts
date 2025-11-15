import { useState, useEffect } from 'react';
import { getSongCount } from '../services/firebaseService';

/**
 * Custom hook for getting song count for a trip
 * Optimized for display purposes where we only need the count
 */
export function useSongCount(tripId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tripId) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const songCount = await getSongCount(tripId);
        if (!cancelled) {
          setCount(songCount);
        }
      } catch (error) {
        // Silently fail - count will remain 0
        if (!cancelled) {
          setCount(0);
        }
      }
    };

    fetchCount();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return count;
}

