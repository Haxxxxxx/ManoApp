# SoundCloud Integration

This document describes how to set up and use the SoundCloud connector for exporting releases to SoundCloud.

## Overview

The SoundCloud connector allows users to securely connect their SoundCloud account and export releases (singles, albums, EPs) directly to SoundCloud. The connector implements the `ProviderConnector` interface and provides a mock-first implementation that can be replaced with real SoundCloud API calls.

## Features

- **OAuth2 Authentication**: Secure server-side OAuth flow using SoundCloud OAuth2
- **Release Export**: Export releases with metadata, artwork, and audio files
- **Preflight Validation**: Validate releases before submission
- **Rights Management**: Support for collaborator rights splits
- **Mock-First**: Works with mocks for testing, ready for real API integration

## Setup

### Prerequisites

1. Firebase project with Functions and Firestore enabled
2. SoundCloud Developer Account
3. SoundCloud App credentials

### Step 1: Create SoundCloud App

1. Go to [SoundCloud Developers](https://developers.soundcloud.com/)
2. Sign in with your SoundCloud account
3. Click **"Register a new application"**
4. Fill in application details:
   - **App Name**: Your app name
   - **Website**: Your website URL
   - **Redirect URI**: `https://YOUR-PROJECT.cloudfunctions.net/handleSoundCloudCallback`
     - For local development: `http://localhost:5001/YOUR-PROJECT/us-central1/handleSoundCloudCallback`
5. Save and note your **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Add the following environment variables to your Firebase Functions configuration:

```bash
# SoundCloud OAuth
SOUNDCLOUD_CLIENT_ID=your-client-id
SOUNDCLOUD_CLIENT_SECRET=your-client-secret
SOUNDCLOUD_CALLBACK_URL=https://YOUR-PROJECT.cloudfunctions.net/handleSoundCloudCallback

# Encryption key (shared with Google Drive integration)
ENCRYPTION_KEY=your-32-byte-encryption-key-base64-encoded
```

### Step 3: Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Step 4: Enable Feature Flag

In `src/config/features.ts`, set:

```typescript
export const featureFlags: FeatureFlags = {
  // ... other flags
  soundcloud: true,
};
```

## Usage

### Client-Side Integration

```typescript
import { SoundCloudConnector } from '@/services/export/connectors/soundcloudConnector';
import { ReleaseManifest } from '@/types/export';

// Create connector instance
const connector = new SoundCloudConnector();

// 1. Authorize user
const authResult = await connector.authorize(userId);
if (typeof authResult === 'object' && authResult.redirectUrl) {
  // Redirect user to OAuth URL
  window.location.href = authResult.redirectUrl;
}

// 2. After OAuth callback, prepare release
const manifest: ReleaseManifest = {
  releaseId: 'release-1',
  title: 'My Release',
  type: 'single',
  description: 'Release description',
  genre: 'Electronic',
  tags: ['electronic', 'dance'],
  tracks: [
    {
      trackNumber: 1,
      songId: 'song-1',
      song: songData,
      title: 'Track Title',
    },
  ],
  artworkUrl: 'https://storage.example.com/artwork.jpg',
  rightsSplits: [
    { userId: 'user-1', name: 'Artist', percentage: 50 },
    { userId: 'user-2', name: 'Producer', percentage: 50 },
  ],
};

// 3. Run preflight validation
const preflight = await connector.runPreflight(manifest);
if (!preflight.valid) {
  console.error('Preflight errors:', preflight.errors);
  return;
}

// 4. Prepare submission payload
const payload = await connector.prepare(manifest);

// 5. Submit to SoundCloud
const result = await connector.submit(payload);
console.log('Submission ID:', result.submissionId);
console.log('Status:', result.status);
```

## API Reference

### SoundCloudConnector

#### `authorize(userId: string)`

Authorizes user with SoundCloud. Returns existing token if available, or OAuth redirect URL.

**Returns:**
- `string` - "authorized" if already connected
- `{ redirectUrl: string }` - OAuth URL if needs authorization

#### `prepare(manifest: ReleaseManifest)`

Prepares release manifest for submission. Maps manifest to SoundCloud format and fetches files.

**Parameters:**
- `manifest: ReleaseManifest` - Release data

**Returns:**
- `Promise<SubmissionPayload>` - Prepared payload with files

#### `submit(payload: SubmissionPayload)`

Submits release to SoundCloud.

**Parameters:**
- `payload: SubmissionPayload` - Prepared submission payload

**Returns:**
- `Promise<SubmissionResult>` - Submission result with provider data

#### `runPreflight(manifest: ReleaseManifest)`

Validates release before submission.

**Returns:**
- `Promise<PreflightResult>` - Validation result with errors and warnings

### Firebase Functions

#### `checkSoundCloudToken`

Checks if user has a valid SoundCloud token.

**Returns:**
```typescript
{
  hasToken: boolean;
}
```

#### `startSoundCloudOAuth`

Initiates OAuth flow.

**Returns:**
```typescript
{
  redirectUrl: string;
  state: string;
}
```

#### `handleSoundCloudCallback`

Completes OAuth flow.

**Parameters:**
```typescript
{
  code: string;
  state: string;
}
```

#### `submitToSoundCloud`

Submits release to SoundCloud (server-side).

**Parameters:**
- `SubmissionPayload` - Submission payload

**Returns:**
- `SubmissionResult` - Submission result

## Release Manifest Structure

```typescript
interface ReleaseManifest {
  releaseId: string;
  title: string;
  description?: string;
  type: 'single' | 'album' | 'ep' | 'mixtape';
  releaseDate?: string;
  genre?: string;
  tags?: string[];
  artworkUrl?: string;
  artworkFile?: File | Blob;
  tracks: ReleaseTrack[];
  rightsSplits?: RightsSplit[];
  metadata?: Record<string, unknown>;
}
```

## Preflight Validation

The connector performs validation before submission:

### Errors (Blocking)
- Missing title
- No tracks
- Invalid rights splits (must sum to 100%)
- Missing track files
- Title too long (>255 characters)

### Warnings (Non-blocking)
- Missing artwork
- Description too long
- Album type (SoundCloud supports single tracks)
- Artwork dimensions

## SoundCloud-Specific Constraints

- **Title**: Max 255 characters
- **Description**: Max 5000 characters
- **File Size**: Max 500MB per track
- **Artwork**: Recommended 1000x1000px or larger
- **Albums**: SoundCloud supports single tracks. Albums are uploaded as separate tracks.

## Mock vs. Real Implementation

### Current Implementation (Mock)

The connector currently uses mock implementations for:
- OAuth token storage (real)
- Submission (mock - returns success immediately)
- Status polling (mock - returns pending)

### Real Implementation TODO

To replace with real SoundCloud API:

1. **Update `submit()` method** in `soundcloudConnector.ts`:
   - Use SoundCloud Upload API: `POST https://api.soundcloud.com/tracks`
   - Handle multipart form data for file uploads
   - Return real submission ID from SoundCloud

2. **Update `getSubmissionStatus()` method**:
   - Poll SoundCloud API: `GET https://api.soundcloud.com/tracks/{track_id}`
   - Check upload status

3. **Update Firebase Function `submitToSoundCloud`**:
   - Implement real SoundCloud API calls
   - Handle file uploads from Firebase Storage
   - Store real submission IDs

See SoundCloud API documentation:
- [SoundCloud API Guide](https://developers.soundcloud.com/docs/api/guide)
- [SoundCloud Upload API](https://developers.soundcloud.com/docs/api/reference#upload)

## Rights Splits

The connector supports rights splits for collaborators:

```typescript
rightsSplits: [
  { userId: 'user-1', name: 'Artist', percentage: 50, role: 'Artist' },
  { userId: 'user-2', name: 'Producer', percentage: 50, role: 'Producer' },
]
```

Splits must sum to exactly 100%. The connector validates this in preflight.

## Error Handling

Common errors and solutions:

- **"SoundCloud not connected"**: User needs to complete OAuth flow
- **"Preflight validation failed"**: Fix errors shown in preflight result
- **"Firebase Functions service is not available"**: Check Firebase Functions configuration
- **"Failed to submit to SoundCloud"**: Check function logs and SoundCloud API status

## Testing

### Unit Tests

```bash
npm test -- soundcloudConnector
npm test -- soundcloudMapper
```

### Mock Testing

The connector is designed for mock-first testing. All tests pass without real SoundCloud credentials.

### Integration Testing

For integration testing with real SoundCloud API:

1. Set up test SoundCloud app
2. Configure test credentials
3. Use test user account
4. Run integration tests in isolated environment

## Troubleshooting

### OAuth Not Working

1. Verify redirect URI matches exactly in SoundCloud app settings
2. Check environment variables are set correctly
3. Verify callback URL is accessible

### Submission Fails

1. Check Firebase Functions logs: `firebase functions:log`
2. Verify file URLs are accessible
3. Check file size limits
4. Verify SoundCloud API status

### Token Issues

1. Check token encryption key is set
2. Verify token storage in Firestore
3. Re-authenticate if token expired

## Security

- OAuth tokens are encrypted at rest
- CSRF protection via state parameter
- Server-side only API calls
- No client secrets in client bundle

## Migration to Production

### Replace Mock Implementation

1. Update `submit()` method with real SoundCloud API calls
2. Implement file upload handling
3. Add error handling and retry logic
4. Implement status polling

### Add Monitoring

- Track submission success/failure rates
- Monitor API rate limits
- Set up alerts for failures
- Log submission details (without sensitive data)

### Performance Optimization

- Implement async uploads for large files
- Add progress tracking
- Cache submission status
- Batch operations where possible

## Support

For issues or questions:
1. Check Firebase Functions logs
2. Review SoundCloud API documentation
3. Verify environment variables
4. Check SoundCloud developer dashboard for API status

