/**
 * Stem Service
 * 
 * Service for managing stems (multitrack audio files) for songs
 */

import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Stem } from '../types/stem';
import { Song } from '../types/song';

const songsCollection = 'songs';

/**
 * Add a stem to a song
 * @param songId - The song ID
 * @param stem - The stem to add
 * @returns Updated song
 */
export const addStemToSong = async (songId: string, stem: Stem): Promise<Song> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    const existingStems = songData.stems || [];

    // Check if stem with same ID already exists
    if (existingStems.some(s => s.id === stem.id)) {
      throw new Error('Stem with this ID already exists');
    }

    // Add order if not provided
    const stemWithOrder = {
      ...stem,
      order: stem.order ?? existingStems.length,
    };

    // Update song with new stem
    await updateDoc(songRef, {
      stems: arrayUnion(stemWithOrder),
      updatedAt: new Date().toISOString(),
    });

    // Return updated song
    const updatedDoc = await getDoc(songRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Song;
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a stem from a song
 * @param songId - The song ID
 * @param stemId - The stem ID to remove
 * @returns Updated song
 */
export const removeStemFromSong = async (songId: string, stemId: string): Promise<Song> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    const existingStems = songData.stems || [];
    const stemToRemove = existingStems.find(s => s.id === stemId);

    if (!stemToRemove) {
      throw new Error('Stem not found');
    }

    // Remove stem from array
    const updatedStems = existingStems.filter(s => s.id !== stemId);

    await updateDoc(songRef, {
      stems: updatedStems,
      updatedAt: new Date().toISOString(),
    });

    // Return updated song
    const updatedDoc = await getDoc(songRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Song;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a stem in a song
 * @param songId - The song ID
 * @param stemId - The stem ID to update
 * @param updates - Partial stem updates
 * @returns Updated song
 */
export const updateStemInSong = async (
  songId: string,
  stemId: string,
  updates: Partial<Stem>
): Promise<Song> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    const existingStems = songData.stems || [];
    const stemIndex = existingStems.findIndex(s => s.id === stemId);

    if (stemIndex === -1) {
      throw new Error('Stem not found');
    }

    // Update stem
    const updatedStems = [...existingStems];
    updatedStems[stemIndex] = {
      ...updatedStems[stemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(songRef, {
      stems: updatedStems,
      updatedAt: new Date().toISOString(),
    });

    // Return updated song
    const updatedDoc = await getDoc(songRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Song;
  } catch (error) {
    throw error;
  }
};

/**
 * Reorder stems in a song
 * @param songId - The song ID
 * @param stemIds - Array of stem IDs in new order
 * @returns Updated song
 */
export const reorderStems = async (songId: string, stemIds: string[]): Promise<Song> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    const existingStems = songData.stems || [];

    // Reorder stems based on provided order
    const reorderedStems = stemIds
      .map((id, index): Stem | null => {
        const stem = existingStems.find(s => s.id === id);
        return stem ? { ...stem, order: index } : null;
      })
      .filter((stem): stem is Stem => stem !== null);

    // Add any stems not in the reorder list at the end
    const remainingStems = existingStems.filter(s => !stemIds.includes(s.id));
    reorderedStems.push(...remainingStems.map((stem, index) => ({
      ...stem,
      order: stemIds.length + index,
    })));

    await updateDoc(songRef, {
      stems: reorderedStems,
      updatedAt: new Date().toISOString(),
    });

    // Return updated song
    const updatedDoc = await getDoc(songRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Song;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all stems for a song
 * @param songId - The song ID
 * @returns Array of stems
 */
export const getStemsForSong = async (songId: string): Promise<Stem[]> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    return songData.stems || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Batch add multiple stems to a song
 * @param songId - The song ID
 * @param stems - Array of stems to add
 * @returns Updated song
 */
export const batchAddStems = async (songId: string, stems: Stem[]): Promise<Song> => {
  try {
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const songData = songDoc.data() as Song;
    const existingStems = songData.stems || [];

    // Add order to each stem
    const stemsWithOrder = stems.map((stem, index) => ({
      ...stem,
      order: stem.order ?? existingStems.length + index,
    }));

    // Combine with existing stems
    const allStems = [...existingStems, ...stemsWithOrder];

    await updateDoc(songRef, {
      stems: allStems,
      updatedAt: new Date().toISOString(),
    });

    // Return updated song
    const updatedDoc = await getDoc(songRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Song;
  } catch (error) {
    throw error;
  }
};

