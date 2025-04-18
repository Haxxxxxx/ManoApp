import { db } from '../firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Firestore } from 'firebase/firestore';
import { ArtistProfile } from '../types/artist';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createArtistProfile = async (userId: string, profileData: Partial<ArtistProfile>): Promise<ArtistProfile> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  
  const artistRef = doc(db, 'artists', userId);
  const data = {
    ...profileData,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  } as ArtistProfile;
  
  await setDoc(artistRef, {
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString()
  });
  return data;
};

export const getArtistProfile = async (userId: string) => {
  if (!db) {
    console.error('Firestore is not initialized');
    throw new Error('Firestore is not initialized');
  }
  
  console.log('Fetching artist profile for user:', userId);
  
  // Try both collection paths
  let artistDoc = null;
  let error = null;
  
  // First try the 'artists' collection
  try {
    const artistRef = doc(db, 'artists', userId);
    artistDoc = await getDoc(artistRef);
    console.log('Artist profile fetch result from "artists" collection:', artistDoc.exists() ? 'Profile exists' : 'Profile does not exist');
  } catch (e) {
    console.error('Error fetching from "artists" collection:', e);
    error = e;
  }
  
  // If not found or error, try the 'artistProfiles' collection
  if (!artistDoc || !artistDoc.exists()) {
    try {
      const artistProfileRef = doc(db, 'artistProfiles', userId);
      artistDoc = await getDoc(artistProfileRef);
      console.log('Artist profile fetch result from "artistProfiles" collection:', artistDoc.exists() ? 'Profile exists' : 'Profile does not exist');
    } catch (e) {
      console.error('Error fetching from "artistProfiles" collection:', e);
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
    console.error('Failed to fetch artist profile:', error);
    // Don't throw the error, just return null
    // This allows the app to continue even if the profile can't be fetched
    return null;
  }
  
  // If we have no document and no error, return null
  return null;
};

export const updateArtistProfile = async (userId: string, profileData: any) => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  
  const artistRef = doc(db, 'artists', userId);
  await updateDoc(artistRef, {
    ...profileData,
    updatedAt: new Date().toISOString()
  });
}; 