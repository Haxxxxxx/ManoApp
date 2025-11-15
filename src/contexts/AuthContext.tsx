import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth } from '../firebase/config';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArtistProfile } from '../types/artist';
import { getArtistProfile, updateArtistProfile } from '../services/artistService';

interface AuthContextType {
  currentUser: User | null;
  artistProfile: ArtistProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<ArtistProfile>) => Promise<void>;
  devBypass: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  artistProfile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  devBypass: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleUserAuth = useCallback(async (authUser: User | null) => {
    if (authUser) {
      const artistProfileRef = doc(db, 'artists', authUser.uid);
      const artistProfileSnap = await getDoc(artistProfileRef);

      if (!artistProfileSnap.exists()) {
        const defaultName = authUser.email?.split('@')[0] || 'Anonymous Artist';
        const now = new Date();
        const newArtistProfile: ArtistProfile = {
          id: authUser.uid,
          userId: authUser.uid,
          name: defaultName,
          email: authUser.email || '',
          bio: '',
          genre: '',
          location: '',
          socialLinks: {},
          photoURL: authUser.photoURL || undefined,
          coverImage: undefined,
          createdAt: now,
          updatedAt: now,
        };
        // Remove undefined values before saving to Firestore
        const profileData: Record<string, unknown> = {
          id: newArtistProfile.id,
          userId: newArtistProfile.userId,
          name: newArtistProfile.name,
          email: newArtistProfile.email,
          bio: newArtistProfile.bio,
          genre: newArtistProfile.genre,
          location: newArtistProfile.location,
          socialLinks: newArtistProfile.socialLinks,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };
        if (newArtistProfile.photoURL) {
          profileData.photoURL = newArtistProfile.photoURL;
        }
        if (newArtistProfile.coverImage) {
          profileData.coverImage = newArtistProfile.coverImage;
        }
        await setDoc(artistProfileRef, profileData);
        setArtistProfile(newArtistProfile);
      } else {
        const data = artistProfileSnap.data();
        if (data) {
          // Safely convert Firestore timestamps to Date objects
          const convertTimestamp = (timestamp: unknown): Date => {
            if (timestamp && typeof timestamp.toDate === 'function') {
              return timestamp.toDate();
            } else if (timestamp instanceof Date) {
              return timestamp;
            } else if (typeof timestamp === 'string') {
              return new Date(timestamp);
            } else if (typeof timestamp === 'number') {
              return new Date(timestamp);
            }
            return new Date();
          };

          const profile: ArtistProfile = {
            id: data.id || authUser.uid,
            userId: data.userId || authUser.uid,
            name: data.name || authUser.email?.split('@')[0] || 'Anonymous Artist',
            email: data.email || authUser.email || '',
            bio: data.bio || '',
            genre: data.genre || '',
            location: data.location || '',
            socialLinks: data.socialLinks || {},
            photoURL: data.photoURL,
            coverImage: data.coverImage,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          };
          setArtistProfile(profile);
        }
      }
      setCurrentUser(authUser);
      // Redirect to root page if we're on the auth page
      if (window.location.pathname === '/auth') {
        navigate('/');
      }
    } else {
      setCurrentUser(null);
      setArtistProfile(null);
      // Redirect to auth page if we're not already there
      if (window.location.pathname !== '/auth') {
        navigate('/auth');
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleUserAuth);
    return unsubscribe;
  }, [handleUserAuth]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const profileData = await getArtistProfile(currentUser.uid);
      if (profileData) {
        const profile: ArtistProfile = {
          id: currentUser.uid,
          userId: currentUser.uid,
          name: profileData.name || currentUser.email?.split('@')[0] || 'Anonymous Artist',
          email: profileData.email || currentUser.email || '',
          bio: profileData.bio || '',
          genre: profileData.genre || '',
          location: profileData.location || '',
          socialLinks: profileData.socialLinks || {},
          photoURL: profileData.photoURL,
          coverImage: profileData.coverImage,
          createdAt: profileData.createdAt || new Date(),
          updatedAt: profileData.updatedAt || new Date(),
        };
        setArtistProfile(profile);
      }
    }
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const updateProfile = async (data: Partial<ArtistProfile>) => {
    if (!currentUser) return;
    
    // Create a clean update object without any Date objects
    const cleanData: Partial<Omit<ArtistProfile, 'createdAt' | 'updatedAt' | 'id' | 'userId'>> = {};
    Object.entries(data).forEach(([key, value]) => {
      // Skip timestamp fields as we'll handle them separately
      if (key !== 'createdAt' && key !== 'updatedAt' && key !== 'id' && key !== 'userId') {
        (cleanData as Record<string, unknown>)[key] = value;
      }
    });
    
    // Add timestamp to the update data
    const updateData = {
      ...cleanData,
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    // Update in database
    await updateArtistProfile(currentUser.uid, updateData);
    
    // Update local state with Date objects (not Timestamps)
    setArtistProfile((prev: ArtistProfile | null) => {
      if (!prev) return null;
      return {
        ...prev,
        ...cleanData,
        updatedAt: new Date()
      };
    });
  };

  // Dev bypass function - uses Firebase anonymous authentication for development
  const devBypass = async () => {
    try {
      // Check if we're in development mode
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      if (!isDev) {
        return;
      }

      setLoading(true);

      // Use Firebase anonymous authentication for proper Firebase integration
      const userCredential = await signInAnonymously(auth);
      const anonymousUser = userCredential.user;

      // Create or get artist profile for the anonymous user
      const artistProfileRef = doc(db, 'artists', anonymousUser.uid);
      const artistProfileSnap = await getDoc(artistProfileRef);

      let profile: ArtistProfile;

      if (!artistProfileSnap.exists()) {
        // Create a default profile for dev user
        const defaultName = 'Dev User';
        const now = new Date();
        profile = {
          id: anonymousUser.uid,
          userId: anonymousUser.uid,
          name: defaultName,
          email: 'dev@manoapp.local',
          bio: 'Development mode user',
          genre: '',
          location: '',
          socialLinks: {},
          photoURL: undefined,
          coverImage: undefined,
          createdAt: now,
          updatedAt: now,
        };
        
        // Remove undefined values before saving to Firestore
        const profileData: Record<string, unknown> = {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          genre: profile.genre,
          location: profile.location,
          socialLinks: profile.socialLinks,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        };
        if (profile.photoURL) {
          profileData.photoURL = profile.photoURL;
        }
        if (profile.coverImage) {
          profileData.coverImage = profile.coverImage;
        }
        await setDoc(artistProfileRef, profileData);
      } else {
        const data = artistProfileSnap.data();
        if (data) {
          const convertTimestamp = (timestamp: unknown): Date => {
            if (timestamp && typeof timestamp.toDate === 'function') {
              return timestamp.toDate();
            } else if (timestamp instanceof Date) {
              return timestamp;
            } else if (typeof timestamp === 'string') {
              return new Date(timestamp);
            } else if (typeof timestamp === 'number') {
              return new Date(timestamp);
            }
            return new Date();
          };

          profile = {
            id: data.id || anonymousUser.uid,
            userId: data.userId || anonymousUser.uid,
            name: data.name || 'Dev User',
            email: data.email || 'dev@manoapp.local',
            bio: data.bio || 'Development mode user',
            genre: data.genre || '',
            location: data.location || '',
            socialLinks: data.socialLinks || {},
            photoURL: data.photoURL,
            coverImage: data.coverImage,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          };
        } else {
          // Fallback profile
          profile = {
            id: anonymousUser.uid,
            userId: anonymousUser.uid,
            name: 'Dev User',
            email: 'dev@manoapp.local',
            bio: 'Development mode user',
            genre: '',
            location: '',
            socialLinks: {},
            photoURL: undefined,
            coverImage: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      // The handleUserAuth will be called automatically by onAuthStateChanged
      // But we can also set it directly for immediate feedback
      setCurrentUser(anonymousUser);
      setArtistProfile(profile);
      setLoading(false);

      // Navigate to home
      if (window.location.pathname === '/auth') {
        navigate('/');
      }
    } catch (error) {
      // Error in dev bypass
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, artistProfile, loading, login, signup, logout, updateProfile, devBypass }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}; 