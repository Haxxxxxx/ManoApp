import { useState, useCallback, useRef, useEffect } from 'react';
import { useTrips } from '../contexts/TripContext';
import { useAuth } from '../contexts/AuthContext';
import { getSongs, getAlbums } from '../services/firebaseService';
import type { SearchResult, SearchGroup } from '../types/search';
import type { Song } from '../types/song';
import type { Album } from '../types/album';

const MAX_RESULTS_PER_GROUP = 5;
const DEBOUNCE_MS = 200;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { trips, sharedTrips } = useTrips();
  const { currentUser } = useAuth();
  const cacheRef = useRef<{ songs: Song[]; albums: Album[]; loaded: boolean; loadedAt: number }>({
    songs: [],
    albums: [],
    loaded: false,
    loadedAt: 0,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Load songs and albums into cache when palette opens
  const loadCache = useCallback(async () => {
    const now = Date.now();
    const cacheExpired = now - cacheRef.current.loadedAt > CACHE_TTL_MS;

    if (cacheRef.current.loaded && !cacheExpired) return;
    if (!currentUser) return;

    try {
      const allTrips = [...trips, ...sharedTrips];
      const songPromises = allTrips.map((t) => getSongs(t.id).catch(() => [] as Song[]));
      const songArrays = await Promise.all(songPromises);
      cacheRef.current.songs = songArrays.flat();

      const albums = await getAlbums(currentUser.uid).catch(() => [] as Album[]);
      cacheRef.current.albums = albums;
      cacheRef.current.loaded = true;
      cacheRef.current.loadedAt = now;
    } catch {
      // cache load failed — search will still work with projects
    }
  }, [trips, sharedTrips, currentUser]);

  const filterResults = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      const lq = q.toLowerCase();
      const groups: SearchGroup[] = [];

      // Projects
      const allTrips = [...trips, ...sharedTrips];
      const projectResults: SearchResult[] = allTrips
        .filter(
          (t) =>
            t.name.toLowerCase().includes(lq) ||
            t.description?.toLowerCase().includes(lq) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(lq))
        )
        .slice(0, MAX_RESULTS_PER_GROUP)
        .map((t) => ({
          id: t.id,
          type: 'project' as const,
          title: t.name,
          subtitle: t.status || 'draft',
          navigateTo: `/trip/${t.id}`,
        }));

      if (projectResults.length > 0) {
        groups.push({ type: 'project', label: 'Projects', results: projectResults });
      }

      // Songs
      const songResults: SearchResult[] = cacheRef.current.songs
        .filter(
          (s) =>
            s.title.toLowerCase().includes(lq) ||
            s.artist?.toLowerCase().includes(lq) ||
            s.metadata?.tags?.some((tag) => tag.toLowerCase().includes(lq))
        )
        .slice(0, MAX_RESULTS_PER_GROUP)
        .map((s) => ({
          id: s.id,
          type: 'song' as const,
          title: s.title,
          subtitle: s.artist,
          navigateTo: s.tripId ? `/trip/${s.tripId}` : `/song/${s.id}`,
        }));

      if (songResults.length > 0) {
        groups.push({ type: 'song', label: 'Songs', results: songResults });
      }

      // Albums
      const albumResults: SearchResult[] = cacheRef.current.albums
        .filter(
          (a) =>
            a.title.toLowerCase().includes(lq) ||
            a.artist?.toLowerCase().includes(lq)
        )
        .slice(0, MAX_RESULTS_PER_GROUP)
        .map((a) => ({
          id: a.id,
          type: 'album' as const,
          title: a.title,
          subtitle: a.artist,
          navigateTo: `/albums/${a.id}`,
        }));

      if (albumResults.length > 0) {
        groups.push({ type: 'album', label: 'Albums', results: albumResults });
      }

      setResults(groups);
    },
    [trips, sharedTrips]
  );

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      filterResults(query);
      setIsSearching(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, filterResults]);

  const open = useCallback(() => {
    setIsOpen(true);
    loadCache();
  }, [loadCache]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  return { query, setQuery, results, isSearching, isOpen, open, close, toggle };
}
