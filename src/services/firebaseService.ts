import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Trip, Song } from '../types';
import {storage} from '../firebase/config';
import { ref, uploadString } from 'firebase/storage';

const tripsCollection = 'trips';
const songsCollection = 'songs';

export const createTrip = async (trip: Omit<Trip, 'id'>) => {
  const docRef = await addDoc(collection(db, tripsCollection), {
    ...trip,
    createdAt: new Date().toISOString(),
  });
  return { ...trip, id: docRef.id };
};

export const getTrips = async (userId: string) => {
  const q = query(collection(db, tripsCollection), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Trip[];
};

export const getTrip = async (tripId: string) => {
  const docRef = doc(db, tripsCollection, tripId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Trip;
  }
  return null;
};

export const updateTrip = async (tripId: string, trip: Partial<Trip>) => {
  const docRef = doc(db, tripsCollection, tripId);
  await updateDoc(docRef, trip);
};

export const deleteTrip = async (tripId: string) => {
  const docRef = doc(db, tripsCollection, tripId);
  await deleteDoc(docRef);
};

export const createSong = async (tripId: string, song: Omit<Song, 'id'>) => {
  try {
    // Get the trip first to ensure it exists
    const tripDoc = await getDoc(doc(db, tripsCollection, tripId));
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data() as Trip;
    
    // Check if user is a member of the trip
    const isMember = tripData.userId === song.userId || 
                    (tripData.collaborators && tripData.collaborators[song.userId]);
    
    if (!isMember) {
      throw new Error('You do not have permission to create projects in this trip');
    }

    // Create the song with the provided userId
    const songData = {
      ...song,
      tripId,
      createdAt: new Date().toISOString(),
      metadata: {
        ...song.metadata,
        tags: song.metadata?.tags || [],
        genre: song.metadata?.genre || []
      }
    };

    // Create the song document
    const docRef = await addDoc(collection(db, songsCollection), songData);

    // Create a folder reference in storage
    if (storage) {
      try {
        const folderRef = ref(storage, `projects/${tripId}/${docRef.id}`);
        // Create an empty file to represent the folder
        await uploadString(folderRef, '', 'raw');
      } catch (storageError) {
        console.warn('Failed to create storage folder:', storageError);
        // Continue even if folder creation fails
      }
    }

    console.log('Song created successfully:', {
      id: docRef.id,
      ...songData
    });

    return { 
      ...songData, 
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating song:', error);
    throw error;
  }
};

export const getSongs = async (tripId: string) => {
  const q = query(collection(db, songsCollection), where('tripId', '==', tripId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Song[];
};

export const getSong = async (songId: string) => {
  const docRef = doc(db, songsCollection, songId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Song;
  }
  return null;
};

export const updateSong = async (songId: string, song: Partial<Song>) => {
  const docRef = doc(db, songsCollection, songId);
  await updateDoc(docRef, song);
};

export const deleteSong = async (songId: string) => {
  const docRef = doc(db, songsCollection, songId);
  await deleteDoc(docRef);
}; 