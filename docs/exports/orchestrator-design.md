# Distributor Orchestrator Design

## Overview

The Distributor Orchestrator is a central service that coordinates the distribution of releases to multiple provider platforms. It handles validation, job queuing, status tracking, and error handling.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ POST /distributeReleaseToProviders
       ▼
┌─────────────────────┐
│  Orchestrator API   │
└──────┬──────────────┘
       │
       ├──► Validate Release (Preflight)
       ├──► Register Provider Jobs
       └──► Enqueue to Queue
              │
              ▼
       ┌─────────────┐
       │   Queue     │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │ Job Worker  │
       └──────┬──────┘
              │
              ├──► Get Provider Connector
              ├──► Prepare Submission
              ├──► Submit to Provider
              └──► Update Status
```

## Components

### Orchestrator Service
- **Location**: `functions/src/services/orchestrator.ts`
- **Responsibilities**:
  - Release validation (preflight)
  - Provider job enqueueing
  - Submission status tracking
  - Error handling

### Provider Registry
- **Location**: `functions/src/services/providerRegistry.ts`
- **Responsibilities**:
  - Connector registration
  - Connector lookup
  - Provider capability queries

### Queue System
- **Location**: `functions/src/lib/queue.ts`
- **Implementation**: Mock queue with BullMQ skeleton
- **Production**: Replace with BullMQ + Redis

## Data Flow

1. Client calls `distributeReleaseToProviders` with `releaseId` and `providerIds[]`
2. Orchestrator validates release (preflight check)
3. For each provider:
   - Create submission record in Firestore
   - Enqueue job to queue
4. Job worker processes jobs:
   - Get provider connector from registry
   - Prepare submission payload
   - Submit to provider
   - Update submission status

## Submission Status

Submissions are stored in `releases/{releaseId}/submissions/{providerId}` with:
- Status: `pending` | `processing` | `completed` | `failed`
- History: Array of status changes
- Provider data: Submission ID, URL, etc.

## Error Handling

- Failed submissions are marked as `failed` with error message
- Retry logic can be added to queue system
- Status history tracks all state changes

## Future Enhancements

- Retry mechanism for failed submissions
- Scheduled distribution
- Batch processing for multiple releases
- Webhook notifications for status updates

