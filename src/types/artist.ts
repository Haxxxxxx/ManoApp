export interface ArtistProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio?: string;
  genre?: string;
  location?: string;
  socialLinks?: {
    spotify?: string;
    soundcloud?: string;
    instagram?: string;
    twitter?: string;
    [key: string]: string | undefined;
  };
  photoURL?: string;  // Using photoURL to be consistent with Firebase Auth User type
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
} 