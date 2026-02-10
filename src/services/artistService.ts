import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ArtistProfile } from '../types/artist';

export const createArtistProfile = async (userId: string, profileData: Partial<ArtistProfile>): Promise<ArtistProfile> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  
  const artistRef = doc(db, 'artists', userId);
  const now = new Date();
  
  const data = {
    ...profileData,
    userId,
    createdAt: now,
    updatedAt: now
  } as ArtistProfile;
  
  await setDoc(artistRef, {
    ...data,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now)
  });
  return data;
};

export const getArtistProfile = async (userId: string) => {
  if (!db) {
    // Firestore is not initialized
    throw new Error('Firestore is not initialized');
  }
  
  // Try both collection paths
  let artistDoc = null;
  let error = null;
  
  // First try the 'artists' collection
  try {
    const artistRef = doc(db, 'artists', userId);
    artistDoc = await getDoc(artistRef);
  } catch (e) {
    // Error fetching from "artists" collection
    error = e;
  }
  
  // If not found or error, try the 'artistProfiles' collection
  if (!artistDoc || !artistDoc.exists()) {
    try {
      const artistProfileRef = doc(db, 'artistProfiles', userId);
      artistDoc = await getDoc(artistProfileRef);
    } catch (e) {
      // Error fetching from "artistProfiles" collection
      // If we already have an error, keep the first one
      if (!error) error = e;
    }
  }
  
  // If we have a document, return it
  if (artistDoc && artistDoc.exists()) {
    return artistDoc.data();
  }
  
  // If we have an error and no document, throw the error
  if (error) {
    // Failed to fetch artist profile
    // Don't throw the error, just return null
    // This allows the app to continue even if the profile can't be fetched
    return null;
  }
  
  // If we have no document and no error, return null
  return null;
};

export const updateArtistProfile = async (userId: string, profileData: Partial<ArtistProfile>) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  
  const artistRef = doc(db, 'artists', userId);
  
  // Create a clean update object
  const cleanData: Record<string, any> = {};
  
  // Process each field in the profile data
  Object.entries(profileData).forEach(([key, value]) => {
    // Handle Timestamp objects
    if (value instanceof Timestamp) {
      cleanData[key] = value;
    } 
    // Handle Date objects
    else if (value instanceof Date) {
      cleanData[key] = Timestamp.fromDate(value);
    }
    // Handle other values
    else {
      cleanData[key] = value;
    }
  });
  
  // Ensure updatedAt is always a Timestamp
  if (!cleanData.updatedAt) {
    cleanData.updatedAt = Timestamp.fromDate(new Date());
  }
  
  await updateDoc(artistRef, cleanData);
}; 