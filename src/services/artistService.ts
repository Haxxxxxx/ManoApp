import { db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface ArtistProfile {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  genres?: string[];
  socialLinks?: {
    spotify?: string;
    soundcloud?: string;
    instagram?: string;
    twitter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const createArtistProfile = async (userId: string, email: string, displayName?: string) => {
  const artistRef = doc(db, 'artists', userId);
  const artistProfile: ArtistProfile = {
    id: userId,
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(artistRef, artistProfile);
  return artistProfile;
};

export const getArtistProfile = async (userId: string) => {
  const artistRef = doc(db, 'artists', userId);
  const docSnap = await getDoc(artistRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as ArtistProfile;
  }
  return null;
};

export const updateArtistProfile = async (userId: string, updates: Partial<ArtistProfile>) => {
  const artistRef = doc(db, 'artists', userId);
  const updateData = {
    ...updates,
    updatedAt: new Date()
  };
  
  await updateDoc(artistRef, updateData);
  return updateData;
}; 