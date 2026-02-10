import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Trip } from '../types/trip';

// Cache interface
interface Cache {
  [key: string]: {
    data: unknown;
    timestamp: number;
  };
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Global cache object
const cache: Cache = {};

// Function to clear cache for a specific path pattern
export const clearCacheForPath = (pathPattern: string) => {
  Object.keys(cache).forEach(key => {
    if (key.startsWith(pathPattern)) {
      delete cache[key];
    }
  });
};

// Function to clear all cache
export const clearAllCache = () => {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
};

/**
 * Custom hook for fetching Firestore data with caching
 * @param path - Collection or document path
 * @param options - Query options
 * @returns Object containing data, loading state, error state, and refresh function
 */
export function useFirestore<T = DocumentData>(
  path: string,
  options?: {
    type?: 'collection' | 'document';
    constraints?: QueryConstraint[];
    cacheTime?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    cancelledRef.current = false;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${path}-${JSON.stringify(options?.constraints || [])}`;
      const cachedData = cache[cacheKey];
      const now = Date.now();

      // Check if we have valid cached data
      if (
        cachedData &&
        now - cachedData.timestamp < (options?.cacheTime || CACHE_EXPIRATION)
      ) {
        if (!cancelledRef.current) {
          setData(cachedData.data as T);
          setLoading(false);
        }
        return;
      }

      let result: T;

      if (options?.type === 'document') {
        // Fetch single document
        const docRef = doc(db, path) as DocumentReference<T>;
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Document not found');
        }
        
        result = { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        // Fetch collection
        const collectionRef = collection(db, path);
        const q = options?.constraints 
          ? query(collectionRef, ...options.constraints)
          : query(collectionRef);
        
        const querySnapshot = await getDocs(q);
        result = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T;
      }

      if (!cancelledRef.current) {
        // Update cache
        cache[cacheKey] = {
          data: result,
          timestamp: now
        };

        setData(result);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [path, options?.constraints, options?.type, options?.cacheTime]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      cancelledRef.current = true;
    };
  }, [fetchData]);

  // Clear cache for this path
  const clearCache = useCallback(() => {
    const cacheKey = `${path}-${JSON.stringify(options?.constraints || [])}`;
    delete cache[cacheKey];
  }, [path, options?.constraints]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    clearCache
  };
}

// Helper functions for common queries
export const useUserProfile = (userId: string) => {
  return useFirestore(`users/${userId}`, {
    type: 'document',
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useUserTrips = (userId: string) => {
  const [data, setData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const trips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trip[];
        setData(trips);
        setLoading(false);
      },
      (err) => {
        // Error fetching trips
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const trips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      setData(trips);
    } catch (err) {
      // Error refreshing trips
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
};

export const useSharedTrips = (userId: string) => {
  const [data, setData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('collaborators', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const trips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trip[];
        setData(trips);
        setLoading(false);
      },
      (err) => {
        // Error fetching shared trips
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('collaborators', 'array-contains', userId));
      const snapshot = await getDocs(q);
      const trips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      setData(trips);
    } catch (err) {
      // Error refreshing shared trips
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
};

export const useTripSongs = (tripId: string) => {
  return useFirestore('songs', {
    constraints: [
      where('tripId', '==', tripId),
      orderBy('createdAt', 'desc')
    ],
    cacheTime: 1 * 60 * 1000 // 1 minute
  });
};

export const useUserAlbums = (userId: string) => {
  return useFirestore('albums', {
    constraints: [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ],
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
}; 