import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import type { UpdateData, DocumentData } from 'firebase/firestore';
import { Trip } from '../types/trip';
import { Song } from '../types/song';
import { auth } from '../firebase/config';
import { ref, deleteObject, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { FirebaseStorage } from 'firebase/storage';
import { ArtistProfile } from '../types/artist';
import { Album } from '../types/album';
import { ActivityItem } from '../types/activity';
import { Release } from '../types/release';
import { FILE_SIZE_LIMITS } from '../utils/constants';

const tripsCollection = 'trips';
const songsCollection = 'songs';

export const createTrip = async (trip: Omit<Trip, 'id'>) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create a trip');
    }

    // Validate required fields
    if (!trip.name || !trip.name.trim()) {
      throw new Error('Trip name is required');
    }

    const now = new Date().toISOString();
    const tripData = {
      ...trip,
      name: trip.name.trim(),
      userId: trip.userId || currentUser.uid, // Ensure userId is set
      createdAt: now,
      updatedAt: now,
      songs: [], // Always empty - songs are stored in separate collection
      collaborators: trip.collaborators || [],
      tags: trip.tags || [],
      status: trip.status || 'draft',
      type: trip.type || 'project'
    };
    
    const docRef = await addDoc(collection(db, tripsCollection), tripData);
    const createdTrip = { ...tripData, id: docRef.id };
    
    // Log activity
    try {
      await logTripActivity(
        docRef.id,
        currentUser.uid,
        'trip_created',
        `Trip "${trip.name}" was created`
      );
    } catch (logError) {
      // Continue even if activity logging fails
    }
    
    return createdTrip;
  } catch (error) {
    // Error creating trip
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
    // Error fetching trips
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
    // Error getting trip
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
    // Error updating trip
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
    // Error deleting trip
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

    const now = new Date().toISOString();
    const songData = {
      ...song,
      tripId,
      userId: currentUser.uid,
      createdAt: now,
      updatedAt: now, // Add updatedAt for consistency
      metadata: {
        ...song.metadata,
        tags: song.metadata?.tags || [],
        genre: song.metadata?.genre || []
      }
    };

    // Create the song document in the songs collection (source of truth)
    const docRef = await addDoc(collection(db, songsCollection), songData);
    const createdSong = { ...songData, id: docRef.id };

    // Create a folder reference in storage
    if (storage) {
      try {
        const folderRef = ref(storage, `projects/${tripId}/${docRef.id}`);
        // Create an empty file to represent the folder
        await uploadString(folderRef, '', 'raw');
      } catch (storageError) {
        // Continue even if folder creation fails
      }
    }

    // Log activity in trip
    try {
      await logTripActivity(
        tripId,
        currentUser.uid,
        'song_created',
        `Song "${song.title}" was added to the trip`
      );
    } catch (logError) {
      // Continue even if activity logging fails
    }

    // Note: We no longer update trip.songs array - songs collection is the source of truth
    // The trip.songs array is kept for backward compatibility but should not be relied upon
    // Always fetch songs using getSongs(tripId) instead of trip.songs

    return createdSong;
  } catch (error) {
    // Error creating song
    throw error;
  }
};

/**
 * Get song count for a trip (optimized for counting)
 * @param tripId The trip ID
 * @returns The number of songs in the trip
 */
export const getSongCount = async (tripId: string): Promise<number> => {
  try {
    const songsQuery = query(
      collection(db, songsCollection),
      where('tripId', '==', tripId)
    );
    const snapshot = await getDocs(songsQuery);
    return snapshot.size;
  } catch (error) {
    // Error getting song count
    return 0;
  }
};

export const getSongsByTripId = async (tripId: string) => {
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
    // Error fetching songs
    throw error;
  }
};

export const getUserSongs = async (userId: string) => {
  try {
    const q = query(
      collection(db, songsCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Song[];
  } catch (error) {
    // Error fetching user songs
    throw error;
  }
};

// Alias for backward compatibility
export const getSongs = getSongsByTripId;

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
    // Get the song first to verify it exists
    const songRef = doc(db, songsCollection, songId);
    const songDoc = await getDoc(songRef);
    
    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }
    
    // Update the song document in the songs collection (source of truth)
    await updateDoc(songRef, {
      ...song,
      updatedAt: new Date().toISOString()
    });
    
    // Get the updated song data
    const updatedSongDoc = await getDoc(songRef);
    const updatedSong = { id: updatedSongDoc.id, ...updatedSongDoc.data() } as Song;
    
    // Note: We no longer update trip.songs array - songs collection is the source of truth
    // Always fetch songs using getSongs(tripId) instead of trip.songs
    
    return updatedSong;
  } catch (error) {
    // Error updating song
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
        // Error deleting song file from storage
        // Continue with the deletion even if storage deletion fails
      }
    }
    
  } catch (error) {
    // Error deleting song
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
    // Error inviting collaborator
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
    // Error removing collaborator
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create a playlist');
    }

    const now = new Date().toISOString();
    const newPlaylist = {
      ...playlistData,
      userId: playlistData.userId || currentUser.uid, // Ensure userId is set
      type: 'playlist' as const,
      createdAt: now,
      updatedAt: now,
      songs: [], // Always empty - songs are stored in separate collection
      collaborators: playlistData.collaborators || [],
      tags: playlistData.tags || [],
      status: playlistData.status || 'draft'
    };
    
    const docRef = await addDoc(collection(db, 'trips'), newPlaylist);
    const createdPlaylist = {
      id: docRef.id,
      ...newPlaylist
    };
    
    // Log activity
    try {
      await logTripActivity(
        docRef.id,
        currentUser.uid,
        'playlist_created',
        `Playlist "${playlistData.name}" was created`
      );
    } catch (logError) {
      // Continue even if activity logging fails
    }
    
    return createdPlaylist;
  } catch (error) {
    // Error creating playlist
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
    
    const songs: Song[] = [];
    songsSnapshot.forEach((doc) => {
      const data = doc.data();
      songs.push({
        id: doc.id,
        title: data.title || 'Untitled',
        artist: data.artist || 'Unknown',
        duration: data.duration || '0:00',
        filePath: data.filePath || '',
        userId: data.userId || userId,
        ...data
      } as Song);
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
    // Error getting analytics
    throw error;
  }
};

// Helper function to check if storage is available
const checkStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Storage service is not available');
  }
  return storage;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const storageInstance = checkStorage();

  try {
    const fileRef = ref(storageInstance, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    // Error deleting file
    throw error;
  }
};

/**
 * Searches for artists by name or email
 * @param searchTerm The search term to match against name or email
 * @returns Array of matching artist profiles
 */
export const searchArtists = async (searchTerm: string): Promise<ArtistProfile[]> => {
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
    } as ArtistProfile));

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
      } as ArtistProfile));
      
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
    // Error searching artists
    throw error;
  }
};

/**
 * Gets all artists from the database
 * @returns Array of all artist profiles
 */
export const getAllArtists = async (): Promise<ArtistProfile[]> => {
  try {
    const artistsRef = collection(db, 'artists');
    const querySnapshot = await getDocs(artistsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ArtistProfile));
  } catch (error) {
    // Error fetching artists
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
    // Error updating trip collaborators
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
    // Create a query that gets trips where:
    // 1. The user is in the collaborators array
    // 2. The user is NOT the owner
    const q = query(
      collection(db, tripsCollection),
      where('collaborators', 'array-contains', userId),
      where('userId', '!=', userId)
    );
    
    const tripsSnapshot = await getDocs(q);
    
    return tripsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Trip));
  } catch (error) {
    // Error fetching collaborative trips
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
    // Error logging trip activity
    throw error;
  }
};

/**
 * Gets the activity logs for a trip
 * @param tripId The trip ID
 * @returns Array of activity logs
 */
export const getTripLogs = async (tripId: string): Promise<ActivityItem[]> => {
  try {
    const logsRef = collection(db, 'trips', tripId, 'logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityItem));
  } catch (error) {
    // Error fetching trip logs
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
    // Error checking if user is collaborator
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
    // Error getting user profile
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
    }, {} as Record<string, unknown>);
    
    // Prepare update data — UpdateData is the Firestore SDK's own shape for
    // updateDoc payloads (plain values plus FieldValue sentinels)
    const updateData: UpdateData<DocumentData> = {
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
    // Error updating user profile
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
    // Error deleting account
    throw error;
  }
};

// Album types are exported from '../types/album'
// Import them using: import { Album, AlbumSong } from '../types/album';

// Album functions
export const createAlbum = async (album: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create an album');
    }

    // Validate that userId matches current user
    if (album.userId !== currentUser.uid) {
      throw new Error('Album userId must match the current user');
    }

    // Validate required album fields
    if (!album.title || !album.title.trim()) {
      throw new Error('Album title is required');
    }
    if (!album.artist || !album.artist.trim()) {
      throw new Error('Album artist is required');
    }
    if (!album.releaseDate) {
      throw new Error('Album release date is required');
    }

    // Validate that songs array is not empty
    if (!album.songs || album.songs.length === 0) {
      throw new Error('Album must contain at least one song');
    }

    // Validate that all songs have required fields
    for (const song of album.songs) {
      if (!song.id || !song.title || !song.artist) {
        throw new Error('All songs must have id, title, and artist');
      }
      // Validate duration is a number
      if (typeof song.duration !== 'number' || song.duration < 0) {
        throw new Error('All songs must have a valid duration (non-negative number)');
      }
    }

    const now = new Date().toISOString();
    const albumData = {
      ...album,
      userId: currentUser.uid, // Ensure userId is set correctly
      title: album.title.trim(),
      artist: album.artist.trim(),
      genre: album.genre?.trim() || '',
      description: album.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
      songs: album.songs // Store songs array in album
    };
    
    const docRef = await addDoc(collection(db, 'albums'), albumData);
    const createdAlbum = { ...albumData, id: docRef.id };
    
    // Note: Albums don't have activity logs like trips, but we could add them if needed
    
    return createdAlbum;
  } catch (error) {
    // Error creating album
    throw error;
  }
};

export const getAlbums = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'albums'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Album[];
  } catch (error) {
    // Error fetching albums
    throw error;
  }
};

export const getAlbum = async (albumId: string) => {
  try {
    const albumRef = doc(db, 'albums', albumId);
    const albumDoc = await getDoc(albumRef);
    
    if (albumDoc.exists()) {
      return {
        id: albumDoc.id,
        ...albumDoc.data()
      } as Album;
    }
    return null;
  } catch (error) {
    // Error getting album
    throw error;
  }
};

export const updateAlbum = async (albumId: string, albumData: Partial<Album>) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to update an album');
    }

    // Get the album first to verify ownership
    const albumRef = doc(db, 'albums', albumId);
    const albumDoc = await getDoc(albumRef);
    
    if (!albumDoc.exists()) {
      throw new Error('Album not found');
    }

    const existingAlbum = albumDoc.data() as Album;
    
    // Validate that userId matches current user
    if (existingAlbum.userId !== currentUser.uid) {
      throw new Error('You do not have permission to update this album');
    }

    // If songs are being updated, validate them
    if (albumData.songs !== undefined) {
      if (!albumData.songs || albumData.songs.length === 0) {
        throw new Error('Album must contain at least one song');
      }

      // Validate that all songs have required fields
      for (const song of albumData.songs) {
        if (!song.id || !song.title || !song.artist) {
          throw new Error('All songs must have id, title, and artist');
        }
        // Validate duration is a number
        if (typeof song.duration !== 'number' || song.duration < 0) {
          throw new Error('All songs must have a valid duration (non-negative number)');
        }
      }
    }

    // Ensure userId is not changed
    const cleanData: Partial<Album> = {
      ...albumData,
      userId: currentUser.uid, // Prevent userId from being changed
      updatedAt: new Date().toISOString()
    };

    await updateDoc(albumRef, cleanData);
    
    const updatedDoc = await getDoc(albumRef);
    if (!updatedDoc.exists()) {
      throw new Error('Album not found after update');
    }
    
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Album;
  } catch (error) {
    // Error updating album
    throw error;
  }
};

export const deleteAlbum = async (albumId: string) => {
  try {
    const albumRef = doc(db, 'albums', albumId);
    await deleteDoc(albumRef);
  } catch (error) {
    // Error deleting album
    throw error;
  }
};

export const uploadFile = async (
  file: File,
  path: string,
  metadata?: { [key: string]: string }
): Promise<string> => {
  try {
    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.AUDIO_FIREBASE) {
      throw new Error(`File size exceeds ${FILE_SIZE_LIMITS.AUDIO_FIREBASE / (1024 * 1024)}MB limit`);
    }

    // Get storage reference
    const storageRef = ref(checkStorage(), path);

    // Upload file with metadata
    const fileMetadata = {
      contentType: file.type,
      customMetadata: {
        ...metadata,
        uploadedAt: Date.now().toString(),
      },
    };

    const snapshot = await uploadBytes(storageRef, file, fileMetadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    // Error in uploadFile
    throw error;
  }
};

// Release CRUD operations
const releasesCollection = 'releases';

/**
 * Create a new release
 */
export const createRelease = async (release: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>): Promise<Release> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to create a release');
    }

    const now = new Date().toISOString();
    const releaseData = {
      ...release,
      userId: release.userId || currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, releasesCollection), releaseData);
    return { id: docRef.id, ...releaseData };
  } catch (error) {
    throw error;
  }
};

/**
 * Get release by ID
 */
export const getRelease = async (releaseId: string): Promise<Release | null> => {
  try {
    const docRef = doc(db, releasesCollection, releaseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Release;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

/**
 * Get releases for a project
 */
export const getReleasesForProject = async (projectId: string): Promise<Release[]> => {
  try {
    const q = query(
      collection(db, releasesCollection),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Release));
  } catch (error) {
    throw error;
  }
};

/**
 * Update a release
 */
export const updateRelease = async (releaseId: string, updates: Partial<Release>): Promise<Release> => {
  try {
    const releaseRef = doc(db, releasesCollection, releaseId);
    await updateDoc(releaseRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await getDoc(releaseRef);
    if (!updatedDoc.exists()) {
      throw new Error('Release not found');
    }

    return { id: updatedDoc.id, ...updatedDoc.data() } as Release;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a release
 */
export const deleteRelease = async (releaseId: string): Promise<void> => {
  try {
    const releaseRef = doc(db, releasesCollection, releaseId);
    await deleteDoc(releaseRef);
  } catch (error) {
    throw error;
  }
};

/**
 * Update sort order for multiple songs atomically
 */
export const updateSongOrder = async (
  songOrders: Array<{ songId: string; sortOrder: number }>
): Promise<void> => {
  const batch = writeBatch(db);
  for (const { songId, sortOrder } of songOrders) {
    const songRef = doc(db, songsCollection, songId);
    batch.update(songRef, { 'metadata.sortOrder': sortOrder });
  }
  await batch.commit();
}; 