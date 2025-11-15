import { useState, useEffect, useCallback, useRef } from 'react';
import { getTrip, updateTrip, deleteTrip } from '../services/firebaseService';
import { Trip } from '../types/trip';
import { getErrorMessage } from '../utils/storageHelpers';

interface UseTripOptions {
  tripId?: string;
  autoFetch?: boolean;
}

interface UseTripReturn {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateTripData: (updates: Partial<Trip>) => Promise<Trip>;
  removeTrip: () => Promise<void>;
}

/**
 * Custom hook for managing trip/project data
 * Provides consistent data fetching and state management
 */
export function useTrip(options: UseTripOptions = {}): UseTripReturn {
  const { tripId, autoFetch = true } = options;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchTrip = useCallback(async () => {
    if (!tripId) {
      setTrip(null);
      return;
    }

    cancelledRef.current = false;

    try {
      setLoading(true);
      setError(null);
      const fetchedTrip = await getTrip(tripId);
      if (!cancelledRef.current) {
        setTrip(fetchedTrip);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        const errorMessage = getErrorMessage(err, 'Failed to fetch project');
        setError(errorMessage);
        setTrip(null);
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    if (autoFetch && tripId) {
      fetchTrip();
    } else if (!tripId) {
      setTrip(null);
    }

    return () => {
      cancelledRef.current = true;
    };
  }, [autoFetch, tripId, fetchTrip]);

  const updateTripData = useCallback(async (updates: Partial<Trip>): Promise<Trip> => {
    if (!tripId) {
      throw new Error('Trip ID is required to update a trip');
    }

    try {
      setError(null);
      const updatedTrip = await updateTrip(tripId, updates);
      setTrip(updatedTrip);
      return updatedTrip;
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to update project');
      setError(errorMessage);
      throw err;
    }
  }, [tripId]);

  const removeTrip = useCallback(async (): Promise<void> => {
    if (!tripId) {
      throw new Error('Trip ID is required to delete a trip');
    }

    try {
      setError(null);
      await deleteTrip(tripId);
      setTrip(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to delete project');
      setError(errorMessage);
      throw err;
    }
  }, [tripId]);

  return {
    trip,
    loading,
    error,
    refresh: fetchTrip,
    updateTripData,
    removeTrip,
  };
}

