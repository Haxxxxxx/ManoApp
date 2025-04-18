import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  artistProfile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleUserAuth);
    return unsubscribe;
  }, []);

  const handleUserAuth = async (authUser: User | null) => {
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
        await setDoc(artistProfileRef, {
          ...newArtistProfile,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        });
        setArtistProfile(newArtistProfile);
      } else {
        const data = artistProfileSnap.data();
        if (data) {
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
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
          setArtistProfile(profile);
        }
      }
      setCurrentUser(authUser);
    } else {
      setCurrentUser(null);
      setArtistProfile(null);
    }
    setLoading(false);
  };

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
    
    // Add timestamp to the update data
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Update in database
    await updateArtistProfile(currentUser.uid, updateData);
    
    // Update local state
    setArtistProfile((prev: ArtistProfile | null) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updateData
      };
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, artistProfile, loading, login, signup, logout, updateProfile }}>
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