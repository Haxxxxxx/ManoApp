import React, { createContext, useContext, ReactNode } from 'react';
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

  const refreshTrips = async () => {
    await Promise.all([refreshUserTrips(), refreshSharedTrips()]);
  };

  const addTrip = (trip: Trip) => {
    // The cache will be automatically updated by the useFirestore hook
    refreshTrips();
  };

  const updateTrip = (tripId: string, updatedTrip: Trip) => {
    // The cache will be automatically updated by the useFirestore hook
    refreshTrips();
  };

  const removeTrip = (tripId: string) => {
    // The cache will be automatically updated by the useFirestore hook
    refreshTrips();
  };

  const value = {
    trips: (userTrips as Trip[]) || [],
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