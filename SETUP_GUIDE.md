# ManoApp Local Setup Guide

A step-by-step guide to get ManoApp running on your local machine.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Git installed (`git --version`)
- [ ] A Firebase account (create at [firebase.google.com](https://firebase.google.com))

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd ManoApp

# Install root dependencies
# Note: If you encounter peer dependency errors, use: npm install --legacy-peer-deps
npm install --legacy-peer-deps

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

**Important**: This project uses `--legacy-peer-deps` flag to handle peer dependency conflicts. An `.npmrc` file is included to set this by default, but if you encounter issues, explicitly use the flag.

### 2. Firebase Project Setup

#### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "ManoApp")
4. Disable Google Analytics (optional for development)
5. Click **"Create project"**

#### 2.2 Enable Firebase Services

**Authentication:**
1. Go to **Authentication** → **Get started**
2. Enable **Email/Password** provider
3. Click **Save**

**Firestore Database:**
1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (for development)
3. Choose a location (closest to you)
4. Click **Enable**

**Storage:**
1. Go to **Storage** → **Get started**
2. Start in **test mode** (for development)
3. Use default bucket location
4. Click **Done**

**Functions:**
1. Go to **Functions** → **Get started**
2. Review pricing (Blaze plan required for external API calls)
3. Click **Continue**

#### 2.3 Get Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **"Your apps"** section
3. Click **Web** icon (`</>`)
4. Register app (nickname: "ManoApp Web")
5. Copy the configuration object

### 3. Configure Environment Variables

#### 3.1 Create Frontend .env File

Create a `.env` file in the root directory:

```bash
# .env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Replace the values** with your actual Firebase configuration.

#### 3.2 Generate Encryption Key (Optional)

For OAuth integrations, generate an encryption key:

```bash
# Generate a secure 32-byte key (base64 encoded)
openssl rand -base64 32
```

Add to `.env`:
```bash
VITE_ENCRYPTION_KEY=your-generated-key-here
```

#### 3.3 Configure Firebase Functions (Optional)

If you plan to use Google Drive or SoundCloud integrations:

```bash
# Login to Firebase
firebase login

# Link your project
firebase use --add
# Select your project from the list

# Set encryption key
firebase functions:config:set encryption.key="your-32-byte-key-base64"

# For Google Drive (optional)
firebase functions:config:set gdrive.client_id="your-client-id"
firebase functions:config:set gdrive.client_secret="your-client-secret"
firebase functions:config:set gdrive.callback_url="http://localhost:5001/your-project/us-central1/handleGoogleDriveCallback"

# For SoundCloud (optional)
firebase functions:config:set soundcloud.client_id="your-client-id"
firebase functions:config:set soundcloud.client_secret="your-client-secret"
firebase functions:config:set soundcloud.callback_url="http://localhost:5001/your-project/us-central1/handleSoundCloudCallback"
```

**Note**: For local development with emulators, you can also set these in `.env` files in the `functions/` directory.

### 4. Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 5. Start Development

#### Option A: Frontend Only (Recommended for initial setup)

```bash
# Start Vite dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: With Firebase Emulators (Full stack)

**Terminal 1 - Start Emulators:**
```bash
firebase emulators:start
```

**Terminal 2 - Build Functions:**
```bash
cd functions
npm run build:watch
```

**Terminal 3 - Start Frontend:**
```bash
npm run dev
```

The emulators provide:
- Functions: `http://localhost:5001`
- Firestore: `http://localhost:8080`
- Storage: `http://localhost:9199`
- UI: `http://localhost:4000`

### 6. Verify Setup

1. **Open the app**: Navigate to `http://localhost:3000`
2. **Create an account**: Click "Sign Up" and create a test account
3. **Create a project**: Use the dashboard to create your first project
4. **Upload a song**: Test file upload functionality

## Setting Up Integrations (Optional)

### Google Drive Integration

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable **Google Drive API**

2. **Create OAuth Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:5001/your-project/us-central1/handleGoogleDriveCallback`
   - Save Client ID and Client Secret

3. **Configure Environment**:
   ```bash
   firebase functions:config:set gdrive.client_id="your-client-id"
   firebase functions:config:set gdrive.client_secret="your-client-secret"
   firebase functions:config:set gdrive.callback_url="http://localhost:5001/your-project/us-central1/handleGoogleDriveCallback"
   ```

4. **Enable Feature Flag**:
   Edit `src/config/features.ts`:
   ```typescript
   gdriveImport: true,
   ```

### SoundCloud Integration

1. **Create SoundCloud App**:
   - Go to [SoundCloud Developers](https://developers.soundcloud.com/)
   - Sign in and register a new application
   - Note Client ID and Client Secret

2. **Configure Environment**:
   ```bash
   firebase functions:config:set soundcloud.client_id="your-client-id"
   firebase functions:config:set soundcloud.client_secret="your-client-secret"
   firebase functions:config:set soundcloud.callback_url="http://localhost:5001/your-project/us-central1/handleSoundCloudCallback"
   ```

3. **Enable Feature Flag**:
   Edit `src/config/features.ts`:
   ```typescript
   soundcloud: true,
   ```

## Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch

# In another terminal, run Storybook (if working on UI)
npm run storybook
```

### Making Changes

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**
3. **Run linter**: `npm run lint`
4. **Run tests**: `npm test`
5. **Commit**: `git commit -m "feat: your feature description"`

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- RightsEditor
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Issue: "Firebase app not initialized"

**Solution**: Check that all `VITE_FIREBASE_*` environment variables are set in `.env` file.

### Issue: "Functions not found"

**Solution**: 
1. Ensure Firebase Functions are deployed: `firebase deploy --only functions`
2. Or use emulators: `firebase emulators:start`

### Issue: "Permission denied" errors

**Solution**: 
1. Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Verify you're authenticated: Check Firebase Auth in browser console

### Issue: OAuth redirect not working

**Solution**:
1. Verify redirect URI matches exactly (including http/https, port, path)
2. Check OAuth provider settings
3. For local development, use emulator URLs

### Issue: npm install fails with peer dependency errors

**Solution**:
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Or if that doesn't work, try force install
npm install --force

# Alternative: Use yarn (if installed)
yarn install
```

**Note**: An `.npmrc` file is included in the project root that should handle this automatically. If issues persist, check that the file exists and contains `legacy-peer-deps=true`.

### Issue: Build errors

**Solution**:
```bash
# Clear cache and reinstall with legacy peer deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear build artifacts
rm -rf dist .vite

# Rebuild
npm run build
```

### Issue: TypeScript errors

**Solution**:
```bash
# Fix TypeScript errors automatically (if script exists)
npm run fix-ts-errors

# Or build ignoring errors (for development)
npm run build:ignore-errors
```

## Next Steps

After setup:

1. **Explore the app**: Create projects, upload songs, invite collaborators
2. **Enable features**: Edit `src/config/features.ts` to enable features you want to test
3. **Read documentation**: Check `docs/` folder for integration guides
4. **Run Storybook**: `npm run storybook` to see component library
5. **Write tests**: Add tests for new features

## Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Open an issue on GitHub
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **React Docs**: [react.dev](https://react.dev)

## Quick Reference

### Common Commands

```bash
# Installation (use legacy-peer-deps)
npm install --legacy-peer-deps  # Install dependencies

# Development
npm run dev              # Start dev server
npm run storybook        # Start Storybook
npm test                 # Run tests
npm run lint             # Run linter

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Firebase
firebase login           # Login to Firebase
firebase use --add       # Link project
firebase deploy          # Deploy to Firebase
firebase emulators:start # Start emulators

# Functions
cd functions
npm install             # Install function dependencies
npm run build           # Build functions
npm run build:watch     # Build and watch
```

### Important Files

- `.env` - Frontend environment variables
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes
- `src/config/features.ts` - Feature flags
- `functions/.env` - Functions environment variables (optional)

---

**Happy coding! 🎵**

