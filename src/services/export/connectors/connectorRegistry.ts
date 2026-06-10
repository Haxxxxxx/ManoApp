/**
 * Connector Registry
 * Central registry mapping PlatformId to connector factories
 */

import { PlatformId, PlatformConfig, ProviderConnector } from '../../../types/export';
import { SoundCloudConnector } from './soundcloudConnector';
import { SpotifyConnector } from './spotifyConnector';
import { AppleConnector } from './appleConnector';
import { AmazonConnector } from './amazonConnector';
import { YouTubeConnector } from './youtubeConnector';
import { RevelatorConnector } from './revelatorConnector';

export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: 'soundcloud',
    audioFormat: 'mp3',
    requiresAuth: true,
    exportOnly: false,
    maxTitleLength: 255,
    maxDescriptionLength: 5000,
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    audioFormat: 'wav',
    requiresAuth: true,
    exportOnly: true,
    maxTitleLength: 200,
  },
  apple: {
    id: 'apple',
    name: 'Apple Music',
    icon: 'apple',
    audioFormat: 'aiff',
    requiresAuth: true,
    exportOnly: true,
    maxTitleLength: 255,
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon Music',
    icon: 'amazon',
    audioFormat: 'flac',
    requiresAuth: true,
    exportOnly: true,
    maxTitleLength: 200,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Music',
    icon: 'youtube',
    audioFormat: 'mp3',
    requiresAuth: true,
    exportOnly: true,
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
  },
  revelator: {
    id: 'revelator',
    name: 'Revelator (All DSPs)',
    icon: 'revelator',
    audioFormat: 'wav',
    requiresAuth: false,
    exportOnly: false,
    maxTitleLength: 255,
  },
};

const connectorFactories: Record<PlatformId, () => ProviderConnector> = {
  soundcloud: () => new SoundCloudConnector(),
  spotify: () => new SpotifyConnector(),
  apple: () => new AppleConnector(),
  amazon: () => new AmazonConnector(),
  youtube: () => new YouTubeConnector(),
  revelator: () => new RevelatorConnector(),
};

export function getConnector(platformId: PlatformId): ProviderConnector {
  const factory = connectorFactories[platformId];
  if (!factory) throw new Error(`Unknown platform: ${platformId}`);
  return factory();
}

export function getAllPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS);
}

export function getPlatformConfig(platformId: PlatformId): PlatformConfig {
  return PLATFORM_CONFIGS[platformId];
}
