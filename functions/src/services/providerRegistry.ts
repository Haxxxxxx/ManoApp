/**
 * Provider Registry Service
 * 
 * Manages provider connector registration and lookup
 */

import { logger } from 'firebase-functions';
import { ProviderConnector } from '../../../src/types/export';
import { RevelatorConnector } from '../integrations/revelator/connector';

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
 */
function initializeDefaultProviders(): void {
  if (!registryInstance) return;

  // Revelator white-label distribution (mock mode unless REVELATOR_MODE=live)
  registryInstance.registerProvider('revelator', new RevelatorConnector());

  logger.info('Provider registry initialized');
}

