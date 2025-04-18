export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  profession?: string;
  socialLinks?: {
    linkedin?: string;
    tiktok?: string;
    soundcloud?: string;
    spotify?: string;
    deezer?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SocialPlatform {
  name: string;
  icon: string;
  placeholder: string;
  baseUrl: string;
  color: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    name: 'linkedin',
    icon: 'linkedin',
    placeholder: 'Your LinkedIn username',
    baseUrl: 'https://linkedin.com/in/',
    color: '#0077B5'
  },
  {
    name: 'tiktok',
    icon: 'tiktok',
    placeholder: '@username',
    baseUrl: 'https://tiktok.com/@',
    color: '#000000'
  },
  {
    name: 'soundcloud',
    icon: 'soundcloud',
    placeholder: 'Your SoundCloud username',
    baseUrl: 'https://soundcloud.com/',
    color: '#FF5500'
  },
  {
    name: 'spotify',
    icon: 'spotify',
    placeholder: 'Spotify artist username',
    baseUrl: 'https://open.spotify.com/artist/',
    color: '#1DB954'
  },
  {
    name: 'deezer',
    icon: 'deezer',
    placeholder: 'Deezer artist name',
    baseUrl: 'https://www.deezer.com/artist/',
    color: '#00C7F2'
  },
  {
    name: 'instagram',
    icon: 'instagram',
    placeholder: '@username',
    baseUrl: 'https://instagram.com/',
    color: '#E4405F'
  },
  {
    name: 'youtube',
    icon: 'youtube',
    placeholder: 'Channel name or ID',
    baseUrl: 'https://youtube.com/c/',
    color: '#FF0000'
  },
  {
    name: 'twitter',
    icon: 'twitter',
    placeholder: '@username',
    baseUrl: 'https://twitter.com/',
    color: '#1DA1F2'
  },
  {
    name: 'website',
    icon: 'language',
    placeholder: 'https://your-website.com',
    baseUrl: '',
    color: '#4CAF50'
  }
]; 