/**
 * Job Processor: Submit to Provider
 * 
 * Processes provider submission jobs from the queue
 */

import { logger } from 'firebase-functions';
import { ReleaseManifest, SubmissionPayload, SubmissionResult } from '../../../src/types/export';
import { getProviderRegistry } from '../services/providerRegistry';
import { updateSubmissionStatus } from '../services/orchestrator';
import { JobData } from '../lib/queue';

/**
 * Process a submitToProvider job
 */
export async function processSubmitToProvider(data: JobData): Promise<void> {
  const { releaseId, providerId, manifest, userId } = data as {
    releaseId: string;
    providerId: string;
    manifest: ReleaseManifest;
    userId: string;
  };

  logger.info(`Processing submission job for release ${releaseId} to provider ${providerId}`);

  try {
    // Update status to processing
    await updateSubmissionStatus(releaseId, providerId, 'processing');

    // Get provider connector
    const registry = getProviderRegistry();
    const connector = registry.getProvider(providerId);

    if (!connector) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Prepare submission payload
    logger.info(`Preparing submission for provider ${providerId}`);
    const payload: SubmissionPayload = await connector.prepare(manifest);

    // Submit to provider
    logger.info(`Submitting to provider ${providerId}`);
    const result: SubmissionResult = await connector.submit(payload);

    // Update submission status
    await updateSubmissionStatus(
      releaseId,
      providerId,
      result.status,
      result.submissionId,
      result.error,
      result.providerData,
      result.providerUrl
    );

    logger.info(`Submission completed for release ${releaseId} to provider ${providerId}`, {
      status: result.status,
      submissionId: result.submissionId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Submission failed for release ${releaseId} to provider ${providerId}`, error);

    // Update status to failed
    await updateSubmissionStatus(
      releaseId,
      providerId,
      'failed',
      undefined,
      errorMessage
    );

    // Re-throw to allow queue to handle retries (if configured)
    throw error;
  }
}

