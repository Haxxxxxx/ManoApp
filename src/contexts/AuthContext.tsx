import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createArtistProfile, getArtistProfile, ArtistProfile } from '../services/artistService';

interface AuthContextType {
  currentUser: User | null;
  artistProfile: ArtistProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserAuth = async (user: User | null) => {
    if (user) {
      try {
        console.log('Checking for existing artist profile for user:', user.uid);
        // Check if artist profile exists
        let profile = await getArtistProfile(user.uid);
        
        if (profile) {
          console.log('Found existing artist profile:', profile);
        } else {
          console.log('No existing artist profile found, creating new one');
          // If no profile exists, create one
          profile = await createArtistProfile(user.uid, user.email || '', user.displayName || undefined);
          console.log('Created new artist profile:', profile);
        }
        
        setArtistProfile(profile);
        console.log('Artist profile set in state:', profile);
      } catch (error) {
        console.error('Error handling artist profile:', error);
      }
    } else {
      console.log('No user, clearing artist profile');
      setArtistProfile(null);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Attempting to login with:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);
      await handleUserAuth(userCredential.user);
    } catch (error) {
      console.error('Login error:', error);
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled');
        case 'auth/user-not-found':
          throw new Error('No account found with this email');
        case 'auth/wrong-password':
          throw new Error('Incorrect password');
        case 'auth/too-many-requests':
          throw new Error('Too many failed login attempts. Please try again later');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your internet connection');
        default:
          console.error('Unexpected error code:', authError.code);
          throw new Error('Failed to sign in. Please try again');
      }
    }
  };

  const signup = async (email: string, password: string) => {
    console.log('Attempting to signup with:', email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful:', userCredential.user);
      await handleUserAuth(userCredential.user);
    } catch (error) {
      console.error('Signup error:', error);
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/email-already-in-use':
          throw new Error('Email already in use');
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/operation-not-allowed':
          throw new Error('Email/password accounts are not enabled');
        case 'auth/weak-password':
          throw new Error('Password is too weak (minimum 6 characters)');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your internet connection');
        default:
          console.error('Unexpected error code:', authError.code);
          throw new Error('Failed to create account. Please try again');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Logout successful');
      setArtistProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to sign out');
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setCurrentUser(user);
      await handleUserAuth(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state listener error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    artistProfile,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 