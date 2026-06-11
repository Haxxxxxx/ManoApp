/**
 * Cloud Tasks queue functions
 *
 * Durable backend for lib/queue.ts when QUEUE_MODE=cloud-tasks. Each
 * onTaskDispatched export here must be registered in
 * TASK_FUNCTION_BY_JOB (lib/queue.ts) under its job name.
 *
 * A thrown handler error triggers a Cloud Tasks retry with backoff. Retries
 * are safe because every provider side effect is checkpointed: the job skips
 * already-completed submissions, and RevelatorConnector.submit() persists
 * revelatorReleaseId/distributionId to the submission doc as each step
 * succeeds, never re-creating or re-distributing past a checkpoint.
 */

import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { processSubmitToProvider } from './submitToProvider';

export const submitToProviderTask = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 60,
      maxBackoffSeconds: 3600,
    },
    rateLimits: {
      maxConcurrentDispatches: 5,
    },
  },
  async (request) => {
    await processSubmitToProvider(request.data);
  }
);
