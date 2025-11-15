/**
 * Feature Flags Configuration
 * 
 * Controls which features are enabled in the application.
 * All features are disabled by default for safe rollout.
 * 
 * To enable a feature, set its flag to true.
 */

export interface FeatureFlags {
  /** AI-assisted metadata and tagging suggestions */
  aiMetadata: boolean;
  
  /** Stems & multitrack support with mixer preview */
  stemsAndMixer: boolean;
  
  /** Release checklist and smart task suggestions */
  releaseChecklist: boolean;
  
  /** Versioned collaborative comments with @mentions */
  comments: boolean;
  
  /** Google Drive import integration */
  gdriveImport: boolean;
  
  /** SoundCloud connector integration */
  soundcloud: boolean;
}

/**
 * Default feature flags - all features disabled by default
 */
export const featureFlags: FeatureFlags = {
  aiMetadata: false,
  stemsAndMixer: false,
  releaseChecklist: false,
  comments: false,
  gdriveImport: false,
  soundcloud: false,
};

/**
 * Check if a feature is enabled
 * @param feature - The feature flag name
 * @returns true if the feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature] === true;
};

/**
 * Enable a feature flag (for development/testing)
 * @param feature - The feature flag name
 */
export const enableFeature = (feature: keyof FeatureFlags): void => {
  featureFlags[feature] = true;
};

/**
 * Disable a feature flag
 * @param feature - The feature flag name
 */
export const disableFeature = (feature: keyof FeatureFlags): void => {
  featureFlags[feature] = false;
};

/**
 * Get all enabled features
 * @returns Array of enabled feature names
 */
export const getEnabledFeatures = (): Array<keyof FeatureFlags> => {
  return Object.keys(featureFlags).filter(
    (key) => featureFlags[key as keyof FeatureFlags]
  ) as Array<keyof FeatureFlags>;
};

