import { auth } from '../firebase/config';
import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../firebase/config';

// Spotify API endpoints
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Get the Spotify access token for the current user
 * @returns The Spotify access token
 */
export const getSpotifyAccessToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please enable Firebase Functions in the Firebase Console.');
  }

  try {
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Call the Firebase function to exchange the ID token for a Spotify access token
    const getSpotifyToken = httpsCallable(functions as Functions, 'getSpotifyToken');
    const result = await getSpotifyToken({ idToken });
    
    // @ts-ignore - The result data structure is determined by the Firebase function
    return result.data.accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw new Error('Failed to get Spotify access token');
  }
};

/**
 * Get a release by ID from Spotify
 * @param releaseId The Spotify release ID
 * @returns The release data
 */
export const getSpotifyRelease = async (releaseId: string) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/albums/${releaseId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify release:', error);
    throw error;
  }
};

/**
 * Publish a release to Spotify
 * @param releaseData The release data to publish
 * @returns The published release data
 */
export const publishToSpotify = async (releaseData: {
  name: string;
  description: string;
  releaseDate: string;
  isExplicit: boolean;
  songs: {
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
  }[];
}) => {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please enable Firebase Functions in the Firebase Console.');
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    
    // Call the Firebase function to publish to Spotify
    const publishToSpotify = httpsCallable(functions as Functions, 'publishToSpotify');
    const result = await publishToSpotify({ 
      accessToken,
      releaseData
    });
    
    // @ts-ignore - The result data structure is determined by the Firebase function
    return result.data;
  } catch (error) {
    console.error('Error publishing to Spotify:', error);
    throw error;
  }
};

/**
 * Get the user's Spotify profile
 * @returns The user's Spotify profile
 */
export const getSpotifyProfile = async () => {
  try {
    const accessToken = await getSpotifyAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify profile:', error);
    throw error;
  }
}; 