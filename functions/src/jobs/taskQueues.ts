/**
 * Cloud Tasks queue functions
 *
 * Durable backend for lib/queue.ts when QUEUE_MODE=cloud-tasks. Each
 * onTaskDispatched export here must be registered in
 * TASK_FUNCTION_BY_JOB (lib/queue.ts) under its job name.
 *
 * A thrown handler error triggers a Cloud Tasks retry with backoff; the
 * handler is idempotent-enough for that (updateSubmissionStatus overwrites,
 * and Revelator createRelease upserts by externalId).
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
