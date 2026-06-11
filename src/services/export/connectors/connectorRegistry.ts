/**
 * Connector Registry
 * Central registry mapping PlatformId to connector factories
 *
 * Only real connectors are registered: SoundCloud (per-user OAuth direct
 * upload) and Revelator (white-label distribution to all DSPs — Spotify,
 * Apple Music, Amazon, YouTube Music etc. are reached through it, not
 * through per-store stub connectors).
 */

import { PlatformId, PlatformConfig, ProviderConnector } from '../../../types/export';
import { SoundCloudConnector } from './soundcloudConnector';
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
