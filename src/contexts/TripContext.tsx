import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Trip } from '../types/trip';
import { useAuth } from './AuthContext';
import { useUserTrips, useSharedTrips } from '../hooks/useFirestore';

interface TripContextType {
  trips: Trip[];
  sharedTrips: Trip[];
  loading: boolean;
  error: Error | null;
  refreshTrips: () => Promise<void>;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updatedTrip: Trip) => void;
  removeTrip: (tripId: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTrips = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};

interface TripProviderProps {
  children: ReactNode;
}

export const TripProvider: React.FC<TripProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { data: userTrips, loading: userTripsLoading, error: userTripsError, refresh: refreshUserTrips } = useUserTrips(currentUser?.uid || '');
  const { data: sharedTripsData, loading: sharedTripsLoading, error: sharedTripsError, refresh: refreshSharedTrips } = useSharedTrips(currentUser?.uid || '');

  const [optimisticTrips, setOptimisticTrips] = useState<Trip[] | null>(null);

  const currentTrips = optimisticTrips ?? (userTrips as Trip[]) ?? [];

  const refreshTrips = async () => {
    await Promise.all([refreshUserTrips(), refreshSharedTrips()]);
  };

  const addTrip = (trip: Trip) => {
    setOptimisticTrips([...currentTrips, trip]);
    refreshTrips().then(() => {
      setOptimisticTrips(null); // Clear override, use fresh data
    }).catch(() => {
      setOptimisticTrips(null); // Rollback on failure
    });
  };

  const updateTrip = (tripId: string, updatedTrip: Trip) => {
    setOptimisticTrips(currentTrips.map(t => t.id === tripId ? updatedTrip : t));
    refreshTrips().then(() => {
      setOptimisticTrips(null);
    }).catch(() => {
      setOptimisticTrips(null);
    });
  };

  const removeTrip = (tripId: string) => {
    setOptimisticTrips(currentTrips.filter(t => t.id !== tripId));
    refreshTrips().then(() => {
      setOptimisticTrips(null);
    }).catch(() => {
      setOptimisticTrips(null);
    });
  };

  const value = {
    trips: currentTrips,
    sharedTrips: (sharedTripsData as Trip[]) || [],
    loading: userTripsLoading || sharedTripsLoading,
    error: userTripsError || sharedTripsError,
    refreshTrips,
    addTrip,
    updateTrip,
    removeTrip
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
}; 