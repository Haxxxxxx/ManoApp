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
  
  /** Distributor orchestrator and provider registry */
  distributor: boolean;
  
  /** Audio fingerprinting and duplicate detection */
  fingerprint: boolean;
  
  /** Export presets for provider-specific settings */
  exportPresets: boolean;

  /** Split-sheet generation and signing */
  splitSheet: boolean;

  /** Batch operations for songs and assets */
  batchOperations: boolean;

  /** Multi-platform publish support */
  multiPlatformPublish: boolean;

  /** Analytics dashboard */
  analytics: boolean;

  /** Global search / command palette */
  globalSearch: boolean;

  /** Notification center with real-time updates */
  notificationCenter: boolean;

  /** Song metadata completeness indicator */
  metadataCompleteness: boolean;

  /** Dashboard activity feed */
  activityFeed: boolean;

  /** Keyboard shortcuts with guide dialog */
  keyboardShortcuts: boolean;

  /** Smart project templates with checklists */
  smartTemplates: boolean;

  /** Quick actions context menu on right-click */
  quickActions: boolean;
}

/**
 * Default feature flags - all features disabled by default
 */
export const featureFlags: FeatureFlags = {
  // OFF: the aiMetadata Cloud Function is still a Math.random() mock —
  // do not re-enable until a real model is wired in (functions/src/aiMetadata.ts)
  aiMetadata: false,
  stemsAndMixer: false,
  releaseChecklist: true,
  comments: true,
  gdriveImport: false,
  soundcloud: true,
  distributor: true,
  fingerprint: false,
  exportPresets: true,
  splitSheet: false,
  batchOperations: true,
  multiPlatformPublish: true,
  analytics: true,
  globalSearch: true,
  notificationCenter: true,
  metadataCompleteness: true,
  activityFeed: true,
  keyboardShortcuts: true,
  smartTemplates: true,
  quickActions: true,
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

/**
 * Initialize feature flags from Firestore (optional)
 * Falls back to hardcoded defaults if Firestore is unavailable
 */
export async function initFeatureFlags(): Promise<void> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    if (!db) return;

    const flagsDoc = await getDoc(doc(db, 'config', 'featureFlags'));
    if (flagsDoc.exists()) {
      const remoteFlags = flagsDoc.data() as Partial<FeatureFlags>;
      for (const key of Object.keys(remoteFlags) as Array<keyof FeatureFlags>) {
        if (key in featureFlags && typeof remoteFlags[key] === 'boolean') {
          featureFlags[key] = remoteFlags[key]!;
        }
      }
    }
  } catch {
    // Firestore unavailable, using hardcoded defaults
  }
}

