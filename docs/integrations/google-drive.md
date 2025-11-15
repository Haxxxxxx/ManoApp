# Google Drive Integration

This document describes how to set up and use the Google Drive integration for importing files into ManoApp.

## Overview

The Google Drive integration allows users to securely connect their Google Drive account and import audio files, images, and PDFs directly into ManoApp projects. Files are validated, deduplicated using SHA256 hashing, and stored in Firebase Storage.

## Features

- **OAuth2 Authentication**: Secure server-side OAuth flow using Google OAuth2
- **File Import**: Import files from Google Drive to ManoApp storage
- **Deduplication**: Automatic duplicate detection using SHA256 hashing
- **Token Encryption**: OAuth tokens are encrypted at rest
- **Token Refresh**: Automatic token refresh when access tokens expire

## Setup

### Prerequisites

1. Firebase project with Functions and Firestore enabled
2. Google Cloud Project with Google Drive API enabled
3. OAuth 2.0 credentials from Google Cloud Console

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Drive API**
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Choose **Web application**
7. Add authorized redirect URI: `https://YOUR-PROJECT.cloudfunctions.net/handleGoogleDriveCallback`
   - For local development: `http://localhost:5001/YOUR-PROJECT/us-central1/handleGoogleDriveCallback`
8. Save the **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Add the following environment variables to your Firebase Functions configuration:

```bash
# Google Drive OAuth
GDRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GDRIVE_CLIENT_SECRET=your-client-secret
GDRIVE_CALLBACK_URL=https://YOUR-PROJECT.cloudfunctions.net/handleGoogleDriveCallback

# Encryption key (32+ bytes, base64 encoded recommended)
ENCRYPTION_KEY=your-32-byte-encryption-key-base64-encoded
```

**Important**: 
- Generate a strong encryption key: `openssl rand -base64 32`
- Store the encryption key securely (use Firebase Functions config or a secret manager)
- Never commit the encryption key to version control

### Step 3: Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Step 4: Deploy Firestore Indexes

The integration requires a composite index on the `assets` collection:

```bash
firebase deploy --only firestore:indexes
```

The required index is already defined in `firestore.indexes.json`:
- Collection: `assets`
- Fields: `hash` (Ascending), `userId` (Ascending)

### Step 5: Enable Feature Flag

In `src/config/features.ts`, set:

```typescript
export const featureFlags: FeatureFlags = {
  // ... other flags
  gdriveImport: true,
};
```

## Usage

### Client-Side Integration

```typescript
import {
  startGoogleDriveOAuth,
  handleGoogleDriveCallback,
  listGoogleDriveFiles,
  importGoogleDriveFile,
} from '@/services/integrations/googleDriveService';

// 1. Start OAuth flow
const { authUrl, state } = await startGoogleDriveOAuth();

// 2. Redirect user to authUrl
window.location.href = authUrl;

// 3. After user authorizes, Google redirects to callback URL
// The callback handler should extract 'code' and 'state' from URL params
const code = new URLSearchParams(window.location.search).get('code');
const state = new URLSearchParams(window.location.search).get('state');

// 4. Complete OAuth flow
await handleGoogleDriveCallback(code, state);

// 5. List files
const { files, nextPageToken } = await listGoogleDriveFiles({
  pageSize: 20,
  query: "mimeType='audio/mpeg'",
});

// 6. Import a file
const result = await importGoogleDriveFile({
  fileId: 'google-drive-file-id',
  projectId: 'project-id', // optional
  targetFolder: 'folder-name', // optional
});
```

## API Reference

### Firebase Functions

#### `startGoogleDriveOAuth`

Initiates the OAuth flow and returns the authorization URL.

**Returns:**
```typescript
{
  authUrl: string;  // URL to redirect user to
  state: string;    // CSRF protection token
}
```

#### `handleGoogleDriveCallback`

Completes the OAuth flow by exchanging the authorization code for tokens.

**Parameters:**
```typescript
{
  code: string;   // Authorization code from Google
  state: string;  // State token from startGoogleDriveOAuth
}
```

**Returns:**
```typescript
{
  success: boolean;
}
```

#### `listGoogleDriveFiles`

Lists files from the user's Google Drive.

**Parameters:**
```typescript
{
  pageSize?: number;    // Number of files per page (default: 20)
  pageToken?: string;    // Token for pagination
  query?: string;        // Google Drive query string
}
```

**Returns:**
```typescript
{
  files: DriveFile[];
  nextPageToken?: string;
}
```

#### `importGoogleDriveFile`

Imports a file from Google Drive to ManoApp.

**Parameters:**
```typescript
{
  fileId: string;           // Google Drive file ID
  projectId?: string;       // Optional project ID to associate with
  targetFolder?: string;    // Optional folder name in storage
}
```

**Returns:**
```typescript
{
  assetId: string;          // Created asset ID
  duplicate: boolean;       // Whether file was already imported
  message?: string;         // Optional message
  asset?: Asset;           // Asset data if not duplicate
}
```

## Security

### Token Storage

- OAuth tokens are encrypted using AES-256-GCM before storage
- Tokens are stored in the `connectors` collection in Firestore
- Only the user who connected the account can access their tokens
- Refresh tokens are used to automatically refresh expired access tokens

### CSRF Protection

- OAuth state parameter is used to prevent CSRF attacks
- State tokens are stored in Firestore with expiration (10 minutes)
- State tokens are deleted after use

### File Validation

- Only specific MIME types are allowed:
  - Audio: `audio/mpeg`, `audio/wav`, `audio/flac`, `audio/aac`, `audio/ogg`, etc.
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Documents: `application/pdf`

### Rate Limiting

OAuth endpoints should be rate-limited in production. Consider using Firebase App Check or a rate limiting middleware.

## File Deduplication

Files are deduplicated using SHA256 hashing:

1. When a file is imported, its SHA256 hash is computed
2. The system checks if an asset with the same hash exists for the user
3. If a duplicate is found, the existing asset ID is returned
4. If not, a new asset is created

This prevents importing the same file multiple times.

## Error Handling

Common errors and solutions:

- **"User must be authenticated"**: User is not logged in
- **"No Google Drive connection found"**: User needs to complete OAuth flow
- **"Token refresh failed"**: User needs to reconnect their Google account
- **"File type not allowed"**: File MIME type is not in the allowed list
- **"Failed to import file"**: Check Firebase Storage permissions and quotas

## Troubleshooting

### OAuth Callback Not Working

1. Verify the redirect URI in Google Cloud Console matches exactly
2. Check that the callback URL is accessible (not blocked by firewall)
3. Verify environment variables are set correctly

### Token Encryption Errors

1. Ensure `ENCRYPTION_KEY` is set in Firebase Functions config
2. Key must be at least 32 bytes (or use base64-encoded key)
3. Key must be the same across all function instances

### File Import Fails

1. Check Firebase Storage rules allow writes
2. Verify file size is within Firebase Storage limits
3. Check function logs for detailed error messages
4. Ensure Firestore indexes are deployed

## Migration to Production

### Replace Encryption with KMS

The current implementation uses a simple encryption key. In production, replace with:

- **AWS KMS**: Use AWS SDK to encrypt/decrypt tokens
- **Google Cloud KMS**: Use Google Cloud KMS client library
- **Azure Key Vault**: Use Azure Key Vault SDK
- **HashiCorp Vault**: Use Vault API

Update `functions/src/integrations/googleDrive/crypto.ts` to use your KMS solution.

### Enable Rate Limiting

Add rate limiting middleware to OAuth endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});
```

### Monitor and Logging

- Enable Cloud Logging for Firebase Functions
- Set up alerts for OAuth failures
- Monitor token refresh rates
- Track file import success/failure rates

## Testing

### Unit Tests

```bash
cd functions
npm test
```

### Integration Tests

Use Firebase Emulators for local testing:

```bash
firebase emulators:start
```

### Mock Testing

The integration uses a mock-first approach. Tests can run without real Google credentials by mocking the Google APIs.

## Support

For issues or questions:
1. Check Firebase Functions logs: `firebase functions:log`
2. Review Firestore rules and indexes
3. Verify environment variables are set correctly
4. Check Google Cloud Console for API quotas and errors

