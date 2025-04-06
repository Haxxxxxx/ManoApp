import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Trip, Song } from '../types';

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
  const docRef = await addDoc(collection(db, songsCollection), {
    ...song,
    tripId,
    createdAt: new Date().toISOString(),
  });
  return { ...song, id: docRef.id };
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