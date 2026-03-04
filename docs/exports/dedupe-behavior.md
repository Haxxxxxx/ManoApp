# Fingerprinting & Duplicate Detection

## Overview

The fingerprinting system detects duplicate assets to prevent accidental re-uploads and help manage your library efficiently.

## How It Works

### Hash Computation
- **SHA256 hash**: Computed client-side for fast duplicate detection
- **Fingerprint**: Computed server-side using Chromaprint (audio fingerprinting)
- Both are stored with each asset

### Duplicate Detection

When importing or uploading a file:
1. Compute hash and fingerprint
2. Query existing assets for matches
3. If match found, show duplicate dialog
4. User chooses action: Link, Merge, or Force Create

## Duplicate Options

### Link to Existing
- Skips import
- Uses existing asset
- No new storage used

### Merge Metadata
- Updates existing asset with new metadata
- Keeps original file
- Useful for adding missing information

### Force Create
- Creates new asset despite duplicate
- Useful when you intentionally want duplicates
- Flagged in database

## Admin Tools

Admins can scan for duplicates:
- Endpoint: `scanDuplicates`
- Returns groups of duplicate assets
- Helps identify accidental duplicates

## Fingerprint Implementation

Currently uses mock fingerprinting. For production:
1. Install Chromaprint library
2. Replace mock implementation in `fingerprintService.ts`
3. Compute real audio fingerprints

## Best Practices

1. Review duplicates before importing
2. Use "Link" for true duplicates
3. Use "Merge" to update metadata
4. Use "Force" only when necessary

