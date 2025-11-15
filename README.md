# ManoApp

A comprehensive music production and project management platform for artists, producers, and collaborators. ManoApp helps musicians structure, create, and manage their musical projects with full control over their assets, releases, and collaborations.

## 🎵 Features

### Core Features
- **Project Management**: Create and manage projects (albums, singles, EPs, playlists)
- **Song Management**: Upload, organize, and manage audio files with metadata
- **Collaboration**: Invite collaborators, share projects, and manage permissions
- **Album Creation**: Build albums from projects with customizable track ordering
- **Local File Browser**: Import and manage local audio files
- **Dashboard**: Overview of all projects with statistics and quick actions

### Advanced Features (Feature Flags)

#### AI Metadata & Tagging
- AI-assisted metadata suggestions (BPM, key, genre, tags)
- Automatic tagging after song upload
- Accept/reject individual suggestions

#### Stems & Multitrack Support
- Upload and manage individual stems
- Audio mixer with volume, pan, mute, solo controls
- Mixdown export functionality
- Real-time audio preview

#### Release Checklist
- Smart release planning with checklist templates
- Task assignment and progress tracking
- Release validation before publishing
- Support for singles, albums, EPs, and mixtapes

#### Collaborative Comments
- Versioned comments with @mentions
- Threaded discussions
- Comment resolution tracking
- Real-time updates

#### Google Drive Integration
- Secure OAuth2 connection to Google Drive
- Import audio files and images directly from Drive
- Automatic file deduplication using SHA256 hashing
- File validation and metadata extraction

#### SoundCloud Connector
- Export releases directly to SoundCloud
- Rights splits management for collaborators
- Preflight validation before export
- Export history and status tracking

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Firebase SDK** - Client-side Firebase integration

### Backend
- **Firebase Functions** - Serverless functions (Node.js 22)
- **Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Firebase Auth** - Authentication

### Development Tools
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **Storybook** - Component development and documentation
- **ESLint** - Code linting
- **TypeScript** - Type checking

### Integrations
- **Google Drive API** - File import
- **SoundCloud API** - Release export (mock-first implementation)
- **Google OAuth2** - Authentication for integrations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm (or yarn)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git**
- A **Firebase project** (create one at [Firebase Console](https://console.firebase.google.com/))

## 🚀 Local Setup Guide

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ManoApp
```

### Step 2: Install Dependencies

Install root dependencies:
```bash
# Use legacy-peer-deps to handle peer dependency conflicts
npm install --legacy-peer-deps
```

**Note**: This project includes an `.npmrc` file that sets `legacy-peer-deps=true` by default. If you still encounter issues, explicitly use the flag above.

Install Firebase Functions dependencies:
```bash
cd functions
npm install
cd ..
```

### Step 3: Firebase Project Setup

1. **Create a Firebase Project** (if you haven't already):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Firebase Services**:
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create database (start in test mode for development)
   - **Storage**: Enable Firebase Storage
   - **Functions**: Enable Cloud Functions

3. **Get Firebase Configuration**:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the Firebase configuration object

### Step 4: Environment Variables

#### Frontend Environment Variables

Create a `.env` file in the root directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Optional: Encryption key for development (generate with: openssl rand -base64 32)
VITE_ENCRYPTION_KEY=your-32-byte-key-base64-encoded
```

#### Firebase Functions Environment Variables

Set environment variables for Firebase Functions:

```bash
# Navigate to functions directory
cd functions

# Set encryption key (required for OAuth token encryption)
firebase functions:config:set encryption.key="your-32-byte-key-base64-encoded"

# Google Drive OAuth (optional - only if using Google Drive integration)
firebase functions:config:set gdrive.client_id="your-client-id"
firebase functions:config:set gdrive.client_secret="your-client-secret"
firebase functions:config:set gdrive.callback_url="https://your-project.cloudfunctions.net/handleGoogleDriveCallback"

# SoundCloud OAuth (optional - only if using SoundCloud integration)
firebase functions:config:set soundcloud.client_id="your-client-id"
firebase functions:config:set soundcloud.client_secret="your-client-secret"
firebase functions:config:set soundcloud.callback_url="https://your-project.cloudfunctions.net/handleSoundCloudCallback"
```

**Note**: For local development, you can also use `.env` files or Firebase emulator environment variables.

### Step 5: Initialize Firebase

Login to Firebase:
```bash
firebase login
```

Link your project:
```bash
firebase use --add
# Select your Firebase project
```

### Step 6: Deploy Firestore Rules and Indexes

Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

### Step 7: Start Development Server

Start the Vite dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 8: (Optional) Start Firebase Emulators

For local Firebase Functions development:

```bash
# Start emulators
firebase emulators:start

# In another terminal, build functions
cd functions
npm run build:watch
```

The emulators will run on:
- Functions: `http://localhost:5001`
- Firestore: `http://localhost:8080`
- Storage: `http://localhost:9199`

## 🏗️ Project Structure

```
ManoApp/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── common/             # Shared components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── panels/             # Panel components
│   │   └── pages/              # Page components
│   ├── services/                # Business logic services
│   │   ├── integrations/       # External integrations
│   │   └── export/             # Export connectors
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   ├── contexts/               # React contexts
│   ├── config/                 # Configuration files
│   ├── utils/                  # Utility functions
│   └── mocks/                  # Mock data for testing
├── functions/                   # Firebase Functions
│   └── src/
│       ├── integrations/       # Integration functions
│       └── lib/                # Shared utilities
├── public/                      # Static assets
├── docs/                        # Documentation
│   ├── integrations/           # Integration guides
│   └── ui/                    # UI documentation
├── scripts/                     # Utility scripts
│   └── migrations/            # Database migration scripts
└── .storybook/                  # Storybook configuration
```

## 🧪 Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Running Storybook

```bash
# Start Storybook dev server
npm run storybook

# Build Storybook for deployment
npm run build-storybook
```

Storybook will be available at `http://localhost:6006`

### Linting

```bash
# Run ESLint
npm run lint
```

### Building for Production

```bash
# Build frontend
npm run build

# Build Firebase Functions
cd functions
npm run build
cd ..
```

## 🔧 Configuration

### Feature Flags

Feature flags are located in `src/config/features.ts`. All features are disabled by default:

```typescript
export const featureFlags: FeatureFlags = {
  aiMetadata: false,
  stemsAndMixer: false,
  releaseChecklist: false,
  comments: false,
  gdriveImport: false,      // Google Drive integration
  soundcloud: false,        // SoundCloud connector
};
```

To enable a feature, set its flag to `true`.

### Firebase Configuration

Firebase configuration is in `src/firebase/config.ts`. It reads from environment variables prefixed with `VITE_`.

## 📚 Documentation

### Integration Guides
- [Google Drive Integration](./docs/integrations/google-drive.md)
- [SoundCloud Integration](./docs/integrations/soundcloud.md)

### UI Documentation
- [Storybook: RightsEditor & ExportPanel](./docs/ui/storybook-rights-export.md)

### Additional Documentation
- [Feature Integration Summary](./FEATURE_INTEGRATION_FINAL.md)
- [Implementation Verification](./IMPLEMENTATION_VERIFICATION.md)
- [Codebase Audit](./CODEBASE_AUDIT_AND_ENHANCEMENTS.md)

## 🧩 Key Components

### Panels
- **Project Overview**: Dashboard with statistics and quick actions
- **Release Planning**: Release checklist and rights management
- **Google Drive Import**: Import files from Google Drive
- **Export Panel**: Export releases to external platforms
- **Rights Editor**: Manage collaborator rights splits

### Services
- **Firebase Service**: CRUD operations for Firestore
- **Storage Service**: File upload and management
- **Google Drive Service**: Google Drive integration
- **SoundCloud Connector**: SoundCloud export functionality
- **Export Service**: General export utilities

## 🔐 Security

### OAuth Integrations
- Tokens are encrypted at rest using AES-256-GCM
- CSRF protection via state parameter validation
- No client secrets exposed to client code
- Token refresh logic for expired tokens

### Firestore Security Rules
- User-based access control
- Collaborator permissions
- Collection-level security rules

## 🚢 Deployment

### Deploy Frontend

```bash
# Build and deploy to Firebase Hosting
npm run deploy
```

### Deploy Firebase Functions

```bash
# Deploy all functions
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### Deploy Everything

```bash
npm run deploy:all
```

## 🧪 Testing

### Unit Tests
- Services: `src/services/**/__tests__/`
- Components: `src/components/**/__tests__/`
- Hooks: `src/hooks/**/__tests__/`

### Integration Tests
- Firebase Functions: `functions/src/**/__tests__/`
- Use Firebase Emulators for local testing

### Storybook
- Component stories: `src/components/**/*.stories.tsx`
- Run with `npm run storybook`

## 🐛 Troubleshooting

### Common Issues

#### npm install fails with peer dependency errors

**Solution**: This project requires the `--legacy-peer-deps` flag due to peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

An `.npmrc` file is included in the project root to set this automatically. If you still encounter issues:

1. Verify `.npmrc` exists: `cat .npmrc` (should show `legacy-peer-deps=true`)
2. Try force install: `npm install --force`
3. Clear cache: `npm cache clean --force && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps`
4. Use yarn: `yarn install`

#### Firebase Connection Errors
- Verify environment variables are set correctly
- Check Firebase project is active: `firebase use`
- Ensure Firebase services are enabled in console

#### OAuth Callback Not Working
- Verify redirect URI matches exactly in OAuth provider settings
- Check callback URL is accessible
- Verify state parameter is being validated

#### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`
- Clear build cache: `rm -rf dist .vite`
- Check TypeScript errors: `npm run build`
- If peer deps issue: `npm install --legacy-peer-deps`

#### Function Deployment Errors
- Ensure Node.js version matches (22): `node --version`
- Build functions first: `cd functions && npm run build`
- Check function logs: `firebase functions:log`

## 📝 Environment Variables Reference

### Frontend (.env)
```
VITE_FIREBASE_API_KEY          # Firebase API key
VITE_FIREBASE_AUTH_DOMAIN      # Firebase auth domain
VITE_FIREBASE_PROJECT_ID       # Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET   # Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID  # Firebase messaging sender ID
VITE_FIREBASE_APP_ID           # Firebase app ID
VITE_FIREBASE_MEASUREMENT_ID   # Firebase measurement ID (optional)
VITE_ENCRYPTION_KEY            # Encryption key (32+ bytes, base64)
```

### Firebase Functions
```
ENCRYPTION_KEY                 # Encryption key for OAuth tokens
GDRIVE_CLIENT_ID              # Google Drive OAuth client ID
GDRIVE_CLIENT_SECRET          # Google Drive OAuth client secret
GDRIVE_CALLBACK_URL           # Google Drive OAuth callback URL
SOUNDCLOUD_CLIENT_ID          # SoundCloud OAuth client ID
SOUNDCLOUD_CLIENT_SECRET      # SoundCloud OAuth client secret
SOUNDCLOUD_CALLBACK_URL       # SoundCloud OAuth callback URL
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write/update tests
4. Ensure linting passes: `npm run lint`
5. Ensure tests pass: `npm test`
6. Commit with meaningful messages
7. Push and create a pull request

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Material-UI for component library
- React team for the amazing framework

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation in `docs/`
- Review existing issues and discussions

---

**Happy coding! 🎵**
