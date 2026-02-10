/**
 * Provider Registry Service
 * 
 * Manages provider connector registration and lookup
 */

import { logger } from 'firebase-functions';
import { ProviderConnector } from '../../../src/types/export';

/**
 * Provider registry singleton
 */
class ProviderRegistry {
  private providers: Map<string, ProviderConnector> = new Map();

  /**
   * Register a provider connector
   */
  registerProvider(id: string, connector: ProviderConnector): void {
    if (this.providers.has(id)) {
      logger.warn(`Provider ${id} is already registered, overwriting`);
    }
    this.providers.set(id, connector);
    logger.info(`Registered provider: ${id} (${connector.name})`);
  }

  /**
   * Get a provider connector by ID
   */
  getProvider(id: string): ProviderConnector | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderConnector[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(id: string): void {
    if (this.providers.delete(id)) {
      logger.info(`Unregistered provider: ${id}`);
    } else {
      logger.warn(`Provider ${id} was not registered`);
    }
  }
}

// Singleton instance
let registryInstance: ProviderRegistry | null = null;

/**
 * Get the provider registry instance
 */
export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
    initializeDefaultProviders();
  }
  return registryInstance;
}

/**
 * Initialize default providers
 * 
 * Note: In a real implementation, you would import and register actual connectors here.
 * For now, we'll register a mock SoundCloud connector placeholder.
 */
function initializeDefaultProviders(): void {
  // TODO: Import and register actual connectors
  // Example:
  // import { SoundCloudConnector } from '../../../src/services/export/connectors/soundcloudConnector';
  // const registry = getProviderRegistry();
  // registry.registerProvider('soundcloud', new SoundCloudConnector());
  
  logger.info('Provider registry initialized (no default providers registered yet)');
}

