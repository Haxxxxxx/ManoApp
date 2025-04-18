import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, setDoc } from 'firebase/firestore';
import { Trip } from '../types/trip';
import { Song } from '../types/song';
import { auth } from '../firebase/config';
import { ref, deleteObject, uploadString } from 'firebase/storage';
import { storage } from '../firebase/config';
import { FirebaseStorage } from 'firebase/storage';
import { UserProfile } from '../types/user';
import { ArtistProfile } from '../types/artist';

const tripsCollection = 'trips';
const songsCollection = 'songs';

export const createTrip = async (trip: Omit<Trip, 'id'>) => {
  try {
    const tripData = {
    ...trip,
    createdAt: new Date().toISOString(),
      songs: trip.songs || [],
      collaborators: trip.collaborators || [],
      tags: trip.tags || []
    };
    
    const docRef = await addDoc(collection(db, tripsCollection), tripData);
    return { ...tripData, id: docRef.id };
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

export const getTrips = async (userId: string) => {
  try {
    const q = query(
      collection(db, tripsCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Trip[];
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

/**
 * Gets a trip by ID
 * @param tripId The trip ID
 * @returns The trip data
 */
export const getTrip = async (tripId: string): Promise<Trip | null> => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (tripDoc.exists()) {
      const data = tripDoc.data();
      return {
        id: tripDoc.id,
        name: data.name || '',
        description: data.description || '',
        userId: data.userId || '',
        songs: data.songs || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        collaborators: data.collaborators || [],
        tags: data.tags || [],
        status: data.status || 'draft',
        type: data.type || 'project',
        coverImageUrl: data.coverImageUrl,
        visibility: data.visibility,
        metadata: data.metadata || {}
      } as Trip;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

export const updateTrip = async (tripId: string, tripData: Partial<Trip>) => {
  try {
  const docRef = doc(db, tripsCollection, tripId);
    await updateDoc(docRef, {
      ...tripData,
      updatedAt: new Date().toISOString()
    });
    
    // Return the updated trip
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Trip not found after update');
    }
    
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Trip;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

/**
 * Deletes a trip/project
 * @param tripId The trip ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    // Get the trip first to check if it exists
    const tripRef = doc(db, tripsCollection, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to delete a trip');
    }
    
    // Try to delete the trip document directly
    // Let Firestore rules handle the permission check
    await deleteDoc(tripRef);
    
    // Get all songs associated with this trip
    const songsQuery = query(
      collection(db, songsCollection),
      where('tripId', '==', tripId)
    );
    const songsSnapshot = await getDocs(songsQuery);
    
    // Delete all songs associated with this trip
    const deletePromises = songsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

export const createSong = async (tripId: string, song: Omit<Song, 'id'>) => {
  try {
    // Get the trip first to ensure it exists
    const tripDoc = await getDoc(doc(db, tripsCollection, tripId));
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create a song');
    }

    const songData = {
      ...song,
      tripId,
      userId: currentUser.uid,
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
  try {
    const q = query(
      collection(db, songsCollection),
      where('tripId', '==', tripId),
      orderBy('createdAt', 'desc')
    );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Song[];
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
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
  try {
    // Get the song first to get the tripId
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }
    
    const songData = songDoc.data();
    const tripId = songData.tripId;
    
    // Update the song document
    await updateDoc(songRef, song);
    
    // Get the updated song data
    const updatedSongDoc = await getDoc(songRef);
    const updatedSong = { id: updatedSongDoc.id, ...updatedSongDoc.data() } as Song;
    
    // Get the trip document
    const tripRef = doc(db, tripsCollection, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripDoc.data();
    const tripSongs = tripData.songs || [];
    
    // Update the song in the trip's songs array
    const updatedSongs = tripSongs.map((s: Song) => 
      s.id === songId ? updatedSong : s
    );
    
    // Update the trip document
    await updateDoc(tripRef, { songs: updatedSongs });
    
    return updatedSong;
  } catch (error) {
    console.error('Error updating song:', error);
    throw error;
  }
};

/**
 * Deletes a song
 * @param songId The song ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteSong = async (songId: string): Promise<void> => {
  try {
    // Get the song first to check if it exists and verify permissions
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }
    
    const songData = songDoc.data();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to delete a song');
    }
    
    if (songData.userId !== currentUser.uid) {
      throw new Error('You do not have permission to delete this song');
    }
    
    // Delete the song document
    await deleteDoc(songRef);
    
    // If the song has a file path, delete the file from storage
    if (songData.filePath) {
      try {
        await deleteFile(songData.filePath);
      } catch (storageError) {
        console.error('Error deleting song file from storage:', storageError);
        // Continue with the deletion even if storage deletion fails
      }
    }
    
  } catch (error) {
    console.error('Error deleting song:', error);
    throw error;
  }
};

export const inviteCollaborator = async (tripId: string, artistId: string) => {
  try {
    // Get the trip first to verify it exists and get the owner's ID
    const tripDoc = await getDoc(doc(db, tripsCollection, tripId));
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    
    // Check if the artist is already a collaborator
    if (tripData.collaborators?.includes(artistId)) {
      throw new Error('Artist is already a collaborator');
    }

    // Add the artist ID to collaborators
    const updatedCollaborators = [...(tripData.collaborators || []), artistId];
    await updateDoc(doc(db, tripsCollection, tripId), {
      collaborators: updatedCollaborators,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Added collaborator successfully`
    };
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    throw error;
  }
};

export const removeCollaborator = async (tripId: string, artistId: string) => {
  try {
    const tripDoc = await getDoc(doc(db, tripsCollection, tripId));
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const tripData = tripDoc.data();
    const updatedCollaborators = (tripData.collaborators || []).filter((id: string) => id !== artistId);
    
    await updateDoc(doc(db, tripsCollection, tripId), {
      collaborators: updatedCollaborators,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Removed collaborator`
    };
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
};

/**
 * Creates a new playlist
 * @param playlistData The playlist data to create
 * @returns The created playlist
 */
export const createPlaylist = async (playlistData: Omit<Trip, 'id'>): Promise<Trip> => {
  try {
    const playlistRef = collection(db, 'trips');
    const newPlaylist = {
      ...playlistData,
      type: 'playlist' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(playlistRef, newPlaylist);
    return {
      id: docRef.id,
      ...newPlaylist
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

/**
 * Gets analytics data for a user
 * @param userId The user ID to get analytics for
 * @returns The analytics data
 */
export const getAnalytics = async (userId: string): Promise<any> => {
  try {
    // Get all trips for the user
    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const trips: Trip[] = [];
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() } as Trip);
    });
    
    // Get all songs for the user
    const songsRef = collection(db, 'songs');
    const songsQuery = query(songsRef, where('userId', '==', userId));
    const songsSnapshot = await getDocs(songsQuery);
    
    const songs: any[] = [];
    songsSnapshot.forEach((doc) => {
      songs.push({ id: doc.id, ...doc.data() });
    });
    
    // Calculate analytics
    const totalProjects = trips.filter(trip => trip.type !== 'playlist').length;
    const totalPlaylists = trips.filter(trip => trip.type === 'playlist').length;
    const totalSongs = songs.length;
    
    // Count collaborators
    const collaboratorCounts: { [key: string]: number } = {};
    trips.forEach(trip => {
      trip.collaborators?.forEach(collaborator => {
        if (collaboratorCounts[collaborator]) {
          collaboratorCounts[collaborator]++;
        } else {
          collaboratorCounts[collaborator] = 1;
        }
      });
    });
    
    const totalCollaborators = Object.keys(collaboratorCounts).length;
    
    // Get top collaborators
    const topCollaborators = Object.entries(collaboratorCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Projects by month
    const projectsByMonth: { [key: string]: number } = {};
    trips.forEach(trip => {
      const date = new Date(trip.createdAt);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (projectsByMonth[monthYear]) {
        projectsByMonth[monthYear]++;
      } else {
        projectsByMonth[monthYear] = 1;
      }
    });
    
    // Songs by genre
    const songsByGenre: { [key: string]: number } = {};
    songs.forEach(song => {
      song.metadata?.genre?.forEach((genre: string) => {
        if (songsByGenre[genre]) {
          songsByGenre[genre]++;
        } else {
          songsByGenre[genre] = 1;
        }
      });
    });
    
    return {
      totalProjects,
      totalSongs,
      totalPlaylists,
      totalCollaborators,
      projectsByMonth,
      songsByGenre,
      topCollaborators
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};

// Helper function to check if storage is available
const checkStorage = () => {
  if (!storage) {
    throw new Error('Storage service is not available. Please check your Firebase configuration and ensure Storage is enabled in your project.');
  }
  return storage as FirebaseStorage;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const storageInstance = checkStorage();

  try {
    const fileRef = ref(storageInstance, filePath);
    await deleteObject(fileRef);
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Searches for artists by name or email
 * @param searchTerm The search term to match against name or email
 * @returns Array of matching artist profiles
 */
export const searchArtists = async (searchTerm: string): Promise<any[]> => {
  try {
    const artistsRef = collection(db, 'artists');
    const q = query(
      artistsRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also search by email if it's a valid email format
    if (searchTerm.includes('@')) {
      const emailQuery = query(
        artistsRef,
        where('email', '==', searchTerm),
        limit(10)
      );
      const emailSnapshot = await getDocs(emailQuery);
      const emailResults = emailSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combine results, removing duplicates
      const combinedResults = [...results];
      emailResults.forEach(result => {
        if (!combinedResults.find(r => r.id === result.id)) {
          combinedResults.push(result);
        }
      });
      
      return combinedResults;
    }
    
    return results;
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
};

/**
 * Gets all artists from the database
 * @returns Array of all artist profiles
 */
export const getAllArtists = async (): Promise<any[]> => {
  try {
    const artistsRef = collection(db, 'artists');
    const querySnapshot = await getDocs(artistsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching artists:', error);
    throw error;
  }
};

/**
 * Updates the collaborators of a trip
 * @param tripId The trip ID
 * @param collaboratorIds Array of collaborator IDs
 */
export const updateTripCollaborators = async (tripId: string, collaboratorIds: string[]): Promise<void> => {
  try {
    const tripRef = doc(db, tripsCollection, tripId);
    await updateDoc(tripRef, {
      collaborators: collaboratorIds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating trip collaborators:', error);
    throw error;
  }
};

/**
 * Gets all trips where the user is a collaborator
 * @param userId The user ID
 * @returns Array of trips where the user is a collaborator
 */
export const getCollaborativeTrips = async (userId: string): Promise<Trip[]> => {
  try {
    console.log('Current auth user:', auth.currentUser?.uid);
    console.log('Requested userId:', userId);
    
    // Get all trips
    const tripsSnapshot = await getDocs(collection(db, tripsCollection));
    
    // Filter trips where user is a collaborator but not the owner
    const collaborativeTrips = tripsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Trip))
      .filter(trip => {
        const isCollaborator = Array.isArray(trip.collaborators) && trip.collaborators.includes(userId);
        const isNotOwner = trip.userId !== userId;
        console.log(`Trip ${trip.id}:`, {
          isCollaborator,
          isNotOwner,
          collaborators: trip.collaborators,
          userId: trip.userId
        });
        return isCollaborator && isNotOwner;
      });

    console.log('Found collaborative trips:', collaborativeTrips);
    return collaborativeTrips;
  } catch (error) {
    console.error('Error fetching collaborative trips:', error);
    throw error;
  }
};

/**
 * Logs an activity for a trip
 * @param tripId The trip ID
 * @param userId The user ID who performed the action
 * @param action The action performed
 * @param details Additional details about the action
 */
export const logTripActivity = async (
  tripId: string, 
  userId: string, 
  action: string, 
  details: string
): Promise<void> => {
  try {
    const logsRef = collection(db, 'trips', tripId, 'logs');
    await addDoc(logsRef, {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging trip activity:', error);
    throw error;
  }
};

/**
 * Gets the activity logs for a trip
 * @param tripId The trip ID
 * @returns Array of activity logs
 */
export const getTripLogs = async (tripId: string): Promise<any[]> => {
  try {
    const logsRef = collection(db, 'trips', tripId, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching trip logs:', error);
    throw error;
  }
};

/**
 * Checks if a user is a collaborator in a trip
 * @param tripId The trip ID
 * @param userId The user ID to check
 * @returns Promise that resolves to true if the user is a collaborator, false otherwise
 */
export const isUserCollaborator = async (tripId: string, userId: string): Promise<boolean> => {
  try {
    const tripDoc = await getDoc(doc(db, tripsCollection, tripId));
    if (!tripDoc.exists()) {
      return false;
    }

    const tripData = tripDoc.data();
    return tripData.collaborators?.includes(userId) || false;
  } catch (error) {
    console.error('Error checking if user is collaborator:', error);
    throw error;
  }
};

/**
 * Gets a user's profile
 * @param userId The user ID
 * @returns The user's profile data
 */
export const getUserProfile = async (userId: string): Promise<ArtistProfile> => {
  try {
    const userDoc = await getDoc(doc(db, 'artists', userId));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      userId: userDoc.id,
      name: data.name || '',
      email: data.email || '',
      photoURL: data.photoURL,
      bio: data.bio || '',
      genre: data.genre || '',
      location: data.location || '',
      socialLinks: data.socialLinks || {},
      coverImage: data.coverImage,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    } as ArtistProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Updates a user's profile
 * @param userId The user ID
 * @param data The profile data to update
 */
export const updateUserProfile = async (userId: string, data: Partial<ArtistProfile>): Promise<void> => {
  try {
    const artistRef = doc(db, 'artists', userId);
    
    // Filter out undefined values from the data
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Prepare update data
    const updateData: any = {
      ...cleanData,
      updatedAt: serverTimestamp()
    };
    
    // Check if artist document exists
    const artistDoc = await getDoc(artistRef);
    if (artistDoc.exists()) {
      // Update artist document
      await updateDoc(artistRef, updateData);
    } else {
      // Create artist document if it doesn't exist
      await setDoc(artistRef, {
        ...updateData,
        id: userId,
        userId: userId,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const deleteAccount = async (userId: string): Promise<void> => {
  try {
    // Delete user's data from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Delete user's projects
      const projectsRef = collection(db, 'projects');
      const projectsQuery = query(projectsRef, where('userId', '==', userId));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      const deletePromises = projectsSnapshot.docs.map(async (projectDoc) => {
        // Delete project's songs
        const songsRef = collection(db, 'projects', projectDoc.id, 'songs');
        const songsSnapshot = await getDocs(songsRef);
        const songDeletePromises = songsSnapshot.docs.map(songDoc => 
          deleteDoc(doc(db, 'projects', projectDoc.id, 'songs', songDoc.id))
        );
        
        await Promise.all(songDeletePromises);
        return deleteDoc(projectDoc.ref);
      });
      
      await Promise.all(deletePromises);
      
      // Delete user document
      await deleteDoc(userRef);
    }
    
    // Delete user's authentication account
    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}; 