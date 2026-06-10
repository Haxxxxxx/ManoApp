/**
 * Orchestrator Service
 * 
 * Client service for interacting with the distributor orchestrator
 */

import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../firebase/config';
import { ProviderSubmission } from '../types/submissions';

/**
 * Distribute a release to multiple providers
 */
export async function distributeRelease(
  releaseId: string,
  providerIds: string[]
): Promise<Record<string, ProviderSubmission>> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available');
  }

  const distribute = httpsCallable<
    { releaseId: string; providerIds: string[] },
    { submissions: Record<string, ProviderSubmission> }
  >(functions as Functions, 'distributeReleaseToProviders');

  const result = await distribute({ releaseId, providerIds });

  if (!result.data || !result.data.submissions) {
    throw new Error('Invalid response from distribute service');
  }

  return result.data.submissions;
}

/**
 * Get all submissions for a release
 */
export async function getSubmissions(
  releaseId: string
): Promise<Record<string, ProviderSubmission>> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available');
  }

  const getSubs = httpsCallable<
    { releaseId: string },
    { submissions: Record<string, ProviderSubmission> }
  >(functions as Functions, 'getReleaseSubmissions');

  const result = await getSubs({ releaseId });

  if (!result.data || !result.data.submissions) {
    throw new Error('Invalid response from submissions service');
  }

  return result.data.submissions;
}

/**
 * Poll providers for in-flight submissions and return the updated set
 */
export async function refreshSubmissions(
  releaseId: string
): Promise<Record<string, ProviderSubmission>> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available');
  }

  const refresh = httpsCallable<
    { releaseId: string },
    { submissions: Record<string, ProviderSubmission> }
  >(functions as Functions, 'refreshReleaseSubmissions');

  const result = await refresh({ releaseId });

  if (!result.data || !result.data.submissions) {
    throw new Error('Invalid response from refresh service');
  }

  return result.data.submissions;
}

