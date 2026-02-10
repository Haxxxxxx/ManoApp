import { useState, useEffect, useCallback } from 'react';
import { getTripLogs } from '../services/firebaseService';
import type { ActivityItem } from '../types/activity';

interface UseActivityFeedReturn {
  activities: ActivityItem[];
  loading: boolean;
  refresh: () => void;
}

export function useActivityFeed(tripIds: string[], maxItems = 20): UseActivityFeedReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (tripIds.length === 0) {
      setActivities([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        tripIds.map((id) => getTripLogs(id).then((logs) => logs.map((l) => ({ ...l, tripId: id }))))
      );

      if (cancelled) return;

      const merged: ActivityItem[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          merged.push(...r.value);
        }
      }

      merged.sort((a, b) => {
        const ta = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
        const tb = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
        return tb - ta;
      });

      setActivities(merged.slice(0, maxItems));
      setLoading(false);
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [tripIds.join(','), maxItems, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { activities, loading, refresh };
}
