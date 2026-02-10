import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Song } from '../types/song';
import { Trip } from '../types/trip';
import { getTrip, getSongs, getSong } from '../services/firebaseService';
import { storageHelpers, getErrorMessage } from '../utils/storageHelpers';
import { STORAGE_KEYS, SPECIAL_PROJECT_IDS } from '../utils/constants';
import { createDevPlaceholderProject } from '../utils/devPlaceholder';

interface UseProjectDataReturn {
  tripData: Trip | null;
  setTripData: React.Dispatch<React.SetStateAction<Trip | null>>;
  tripName: string;
  setTripName: React.Dispatch<React.SetStateAction<string>>;
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  selectedSong: Song | null;
  setSelectedSong: React.Dispatch<React.SetStateAction<Song | null>>;
  handleRefreshTrip: () => Promise<void>;
  handleSongUpdate: (updatedSong: Song) => Promise<void>;
  handleSongCreated: (song: Song) => Promise<void>;
  handleSongClick: (song: Song) => Promise<void>;
}

export function useProjectData(selectedTrip: string | null | undefined): UseProjectDataReturn {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [tripName, setTripName] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Fetch trip data effect
  useEffect(() => {
    let cancelled = false;

    const fetchTripData = async () => {
      if (!selectedTrip) {
        if (!cancelled) {
          setTripData(null);
          setTripName('');
          setSongs([]);
          setSelectedSong(null);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setError(null);
      }

      try {
        // Check if this is a dev placeholder project
        if (import.meta.env.DEV && selectedTrip === 'dev-placeholder-project') {
          const devProject = createDevPlaceholderProject();

          if (!cancelled) {
            setTripData(devProject);
            setTripName(devProject.name);
            setSongs(devProject.songs || []);
            setIsLoading(false);
          }
          return;
        }

        // Check if this is a local songs project
        if (selectedTrip === SPECIAL_PROJECT_IDS.LOCAL_SONGS) {
          const savedLocalFiles = storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES);
          if (savedLocalFiles) {
            const localFiles = savedLocalFiles;

            const localProject: Trip = {
              id: selectedTrip,
              name: 'Local Songs',
              description: 'Collection of local audio files',
              userId: 'local',
              songs: localFiles,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              collaborators: [],
              tags: ['local-files'],
              status: 'draft' as const,
              type: 'project',
            };

            if (!cancelled) {
              setTripData(localProject);
              setTripName(localProject.name);
              setSongs(localFiles);

              // Check if we need to select a specific song
              const songMatch = window.location.pathname.match(/\/song\/([^/]+)/);
              if (songMatch && songMatch[1]) {
                const songId = songMatch[1];
                const song = localFiles.find((s: Song) => s.id === songId);
                if (song) {
                  setSelectedSong(song);
                }
              }

              setIsLoading(false);
            }
            return;
          }
        }

        // Check if this is a local file project
        const searchParams = new URLSearchParams(window.location.search);
        const isLocalFile = searchParams.get('source') === 'local';

        if (isLocalFile) {
          // Get local project data from sessionStorage
          const currentLocalProject = sessionStorage.getItem('currentLocalProject');
          if (currentLocalProject) {
            let project;
            try {
              project = JSON.parse(currentLocalProject);
            } catch {
              sessionStorage.removeItem('currentLocalProject');
              if (!cancelled) {
                setError('Corrupt local project data was removed');
                setIsLoading(false);
              }
              return;
            }
            if (project.id === selectedTrip) {
              if (!cancelled) {
                setTripData(project);
                setTripName(project.name);
                const localSongs =
                  project.songs && project.songs.length > 0
                    ? project.songs
                    : storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES) || [];
                setSongs(localSongs);

                // Check if we need to select a specific song
                const songMatch = window.location.pathname.match(/\/song\/([^/]+)/);
                if (songMatch && songMatch[1]) {
                  const songId = songMatch[1];
                  const song = localSongs.find((s: Song) => s.id === songId);
                  if (song) {
                    setSelectedSong(song);
                  }
                }
                setIsLoading(false);
              }
              return;
            }
          }

          // If we can't find the project in sessionStorage, try localStorage
          const savedLocalFiles = storageHelpers.getItem<Song[]>(STORAGE_KEYS.LOCAL_FILES);
          if (savedLocalFiles) {
            const localFiles = savedLocalFiles;
            const song = localFiles.find((s: Song) => `local-${s.id}` === selectedTrip);
            if (song) {
              const localProject: Trip = {
                id: selectedTrip,
                name: song.title,
                description: `Project created from local file: ${song.title}`,
                userId: 'local',
                songs: [song],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                collaborators: [],
                tags: ['local-file'],
                status: 'draft' as const,
                type: 'project',
              };
              if (!cancelled) {
                setTripData(localProject);
                setTripName(localProject.name);
                setSongs([song]);
                setSelectedSong(song);
                sessionStorage.setItem('currentLocalProject', JSON.stringify(localProject));
                setIsLoading(false);
              }
              return;
            }
          }

          if (!cancelled) {
            setError('Local project data not found');
            setTripData(null);
            setTripName('');
            setSongs([]);
            setSelectedSong(null);
            setIsLoading(false);
            navigate('/');
          }
          return;
        }

        // Fetch trip data from Firebase
        const trip = await getTrip(selectedTrip);
        if (!cancelled) {
          if (trip) {
            setTripData(trip);
            setTripName(trip.name);

            // Always fetch songs from the songs collection (source of truth)
            const tripSongs = await getSongs(selectedTrip);

            // Sort by sortOrder if present, fallback to createdAt
            tripSongs.sort((a, b) => {
              const orderA = (a.metadata as Record<string, unknown>)?.sortOrder as number | undefined;
              const orderB = (b.metadata as Record<string, unknown>)?.sortOrder as number | undefined;
              if (orderA != null && orderB != null) return orderA - orderB;
              if (orderA != null) return -1;
              if (orderB != null) return 1;
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateA - dateB;
            });

            if (!cancelled) {
              setSongs(tripSongs);

              // Check if we need to select a specific song
              const songMatch = window.location.pathname.match(/\/song\/([^/]+)/);
              if (songMatch && songMatch[1]) {
                const songId = songMatch[1];
                const song = tripSongs.find((s) => s.id === songId);
                if (song) {
                  setSelectedSong(song);
                }
              }
            }
          } else {
            setError('Project not found');
            setTripData(null);
            setTripName('');
            setSongs([]);
          }
        }
      } catch (_error) {
        if (!cancelled) {
          setError('Failed to load project data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTripData();

    return () => {
      cancelled = true;
    };
  }, [selectedTrip, navigate]);

  const handleRefreshTrip = useCallback(async () => {
    if (!selectedTrip) return;

    try {
      setIsLoading(true);
      const refreshedTrip = await getTrip(selectedTrip);
      if (refreshedTrip) {
        setTripData(refreshedTrip);
        setTripName(refreshedTrip.name);

        // Always fetch songs from the songs collection (source of truth)
        const refreshedSongs = await getSongs(selectedTrip);
        setSongs(refreshedSongs);

        // Update selected song if it still exists
        if (selectedSong) {
          const updated = refreshedSongs.find((s) => s.id === selectedSong.id);
          if (updated) {
            setSelectedSong(updated);
          } else {
            setSelectedSong(null);
          }
        }
      } else {
        setError('Project not found');
        setTripData(null);
        setTripName('');
        setSongs([]);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to refresh project'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTrip, selectedSong]);

  const handleSongUpdate = useCallback(
    async (updatedSong: Song) => {
      if (!selectedTrip) return;

      try {
        // Refresh songs from the songs collection (source of truth)
        const refreshedSongs = await getSongs(selectedTrip);
        setSongs(refreshedSongs);

        // Update selected song if it's the one that was updated
        if (selectedSong && selectedSong.id === updatedSong.id) {
          const updated = refreshedSongs.find((s) => s.id === updatedSong.id);
          if (updated) {
            setSelectedSong(updated);
          }
        }
      } catch (_error) {
        // Error updating song - silently fail
      }
    },
    [selectedTrip, selectedSong]
  );

  const handleSongCreated = useCallback(async (song: Song) => {
    setSongs((prev) => [...prev, song]);
  }, []);

  const handleSongClick = useCallback(async (song: Song) => {
    try {
      // Check if this is a local file by looking at the metadata
      const isLocalFile = song.metadata?.source === 'local';

      if (isLocalFile) {
        // For local files, use the song data directly without fetching
        setSelectedSong(song);
        return;
      }

      // For Firebase songs, fetch the latest data
      const latestSong = await getSong(song.id);
      if (latestSong) {
        setSelectedSong(latestSong);
      }
    } catch (_error) {
      // Fallback to using the provided song data if we couldn't fetch the latest
      setSelectedSong(song);
    }
  }, []);

  return {
    tripData,
    setTripData,
    tripName,
    setTripName,
    songs,
    setSongs,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedSong,
    setSelectedSong,
    handleRefreshTrip,
    handleSongUpdate,
    handleSongCreated,
    handleSongClick,
  };
}
