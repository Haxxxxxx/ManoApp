import { auth } from '../firebase/config';
import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../firebase/config';

// SoundCloud API endpoints
const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';

/**
 * Get the SoundCloud access token for the current user
 * @returns The SoundCloud access token
 */
export const getSoundCloudAccessToken = async (): Promise<string> => {
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
    
    // Call the Firebase function to exchange the ID token for a SoundCloud access token
    const getSoundCloudToken = httpsCallable(functions as Functions, 'getSoundCloudToken');
    const result = await getSoundCloudToken({ idToken });
    
    // @ts-ignore - The result data structure is determined by the Firebase function
    return result.data.accessToken;
  } catch (error) {
    console.error('Error getting SoundCloud access token:', error);
    throw new Error('Failed to get SoundCloud access token');
  }
};

/**
 * Get the user's SoundCloud profile
 * @returns The user's SoundCloud profile
 */
export const getSoundCloudProfile = async () => {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please enable Firebase Functions in the Firebase Console.');
  }

  try {
    const accessToken = await getSoundCloudAccessToken();
    
    const response = await fetch(`${SOUNDCLOUD_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching SoundCloud profile:', error);
    throw error;
  }
};

/**
 * Publish a track to SoundCloud
 * @param trackData The track data to publish
 * @returns The published track data
 */
export const publishToSoundCloud = async (trackData: {
  title: string;
  description: string;
  genre?: string;
  tags?: string[];
  artworkUrl?: string;
  fileUrl: string;
  isPrivate?: boolean;
  downloadable?: boolean;
}) => {
  if (!functions) {
    throw new Error('Firebase Functions service is not available. Please enable Firebase Functions in the Firebase Console.');
  }

  try {
    const accessToken = await getSoundCloudAccessToken();
    
    // Call the Firebase function to publish to SoundCloud
    const publishToSoundCloud = httpsCallable(functions as Functions, 'publishToSoundCloud');
    const result = await publishToSoundCloud({ 
      accessToken,
      trackData
    });
    
    // @ts-ignore - The result data structure is determined by the Firebase function
    return result.data;
  } catch (error) {
    console.error('Error publishing to SoundCloud:', error);
    throw error;
  }
}; 