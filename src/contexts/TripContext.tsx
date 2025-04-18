import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip } from '../types/trip';
import { getTrips, getCollaborativeTrips } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface TripContextType {
  trips: Trip[];
  sharedTrips: Trip[];
  loading: boolean;
  error: string | null;
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sharedTrips, setSharedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchTrips = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const [userTrips, collaborativeTrips] = await Promise.all([
        getTrips(currentUser.uid),
        getCollaborativeTrips(currentUser.uid)
      ]);
      setTrips(userTrips);
      setSharedTrips(collaborativeTrips);
      setError(null);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentUser]);

  const addTrip = (trip: Trip) => {
    setTrips(prevTrips => [trip, ...prevTrips]);
  };

  const updateTrip = (tripId: string, updatedTrip: Trip) => {
    setTrips(prevTrips => 
      prevTrips.map(trip => trip.id === tripId ? updatedTrip : trip)
    );
  };

  const removeTrip = (tripId: string) => {
    setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
  };

  const value = {
    trips,
    sharedTrips,
    loading,
    error,
    refreshTrips: fetchTrips,
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