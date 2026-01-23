# CueControl Mobile

**Version 5.1.0**

## Recent Changes Log

### January 23, 2026 - Version 5.1.0
**Session Summary:**
- Added SupportModal component for in-app contact support messaging
  - Users can type a message which opens email client with pre-filled content
  - Includes user email and app version in the message
  - Header matches standard style (36px, 15px font, #787878 borders)
- Updated Contact Support buttons to open SupportModal instead of direct mailto link
  - Mode selection screen
  - About modal
- Fixed ViewerSettingsModal header to match standard style
  - Height: 36px (was 35px), font size: 15px (was 13px)
  - Added top border and left divider before header buttons
- Fixed settings navigation from mode selection screen
  - Now uses router.replace('/') to properly return to mode selection
- Made Contact Support buttons consistent across screens (same size, icon, styling)
- Updated version to 5.1.0 across all files

### January 23, 2026 - Version 5.0.0
**Session Summary:**
- Updated About modal and Settings screen headers to match mode selection window style
  - Height: 36px, font size: 15px, border color: #787878
  - Added left border divider before header buttons
- Fixed settings button on mode selection screen to navigate to settings (was opening about modal)
- Updated version to 5.0.0 across all files

### January 20, 2026 - Version 3.9.2
**Session Summary:**
- Home screen: Changed logout button to gear icon for settings, X button now handles logout
- Track request screen: Renamed "Song Request" to "Track Request", made input same size as others
- Track request screen: X button now navigates home instead of logging out
- Added version number display to login screen
- Updated version numbers across all app files (package.json, app.json, index.tsx, AboutModal.tsx, login.tsx)
- Updated CLAUDE.md with UI documentation
- Built iOS app via EAS and pushed to GitHub

**React Native / Expo mobile companion app for CueControl.** Allows DJs to manage their request queue from mobile, and viewers to submit song requests using DJ handles.

## Project Overview

This is a companion app to the CueControl desktop application. It provides two modes:
- **DJ Mode**: Full queue management (view, mark played, delete, edit, manual entry)
- **Viewer Mode**: Submit song requests to DJs using their handle (e.g., `@trinitro`)

**Desktop App:** See `/Users/andrewkeim/Downloads/dj-request-system 2` for the Electron desktop app (v8.0.0).

## Architecture

```
cuecontrol-mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Mode selection (DJ/Viewer)
│   ├── auth/                     # Authentication screens
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Sign in / Sign up
│   ├── (tabs)/                   # DJ mode tab navigation
│   │   ├── _layout.tsx
│   │   ├── queue.tsx             # Main queue screen
│   │   ├── next-stream.tsx       # Next stream queue
│   │   └── settings.tsx          # DJ settings & config
│   └── viewer/                   # Viewer mode
│       ├── _layout.tsx
│       └── request.tsx           # Submit request form
├── src/
│   ├── services/
│   │   ├── firebase.ts           # Firebase initialization
│   │   └── requests.ts           # CRUD operations & DJ handles
│   ├── hooks/
│   │   ├── useRequests.ts        # Real-time request subscription
│   │   └── useNextStream.ts      # Next stream subscription
│   ├── components/
│   │   ├── RequestCard.tsx       # Individual request row
│   │   ├── StatusPill.tsx        # Queued/Played toggle
│   │   ├── ManualEntryModal.tsx  # Add request manually
│   │   ├── EditRequestModal.tsx  # Edit request details
│   │   └── AboutModal.tsx        # App info modal (version, credits, support)
│   ├── context/
│   │   ├── AuthContext.tsx       # Firebase auth state
│   │   └── AppModeContext.tsx    # DJ/Viewer mode state
│   ├── constants/
│   │   └── theme.ts              # CueControl dark theme
│   └── types/
│       └── request.ts            # Request interface
├── app.json                      # Expo configuration
└── package.json
```

## Firebase Integration

### Firebase Project
- **Project ID:** `cuecontrol-c22b4`
- **Auth Domain:** `cuecontrol-c22b4.firebaseapp.com`
- **Database URL:** `https://cuecontrol-c22b4-default-rtdb.firebaseio.com`

### Database Structure
```
Firebase Realtime Database:
├── djHandles/                    # DJ handle → license key mapping
│   └── {handle}:
│       ├── licenseKey           # "DJRQ-XXXX-XXXX-XXXX"
│       ├── displayName          # "DJ Trinitro"
│       └── updatedAt            # timestamp
├── licenses/
│   └── {licenseKey}/            # Key with dashes removed
│       ├── handle               # Reverse lookup: "trinitro"
│       ├── requests/            # Song request queue
│       │   └── {id}:
│       │       ├── id           # timestamp-based ID
│       │       ├── username     # requester name
│       │       ├── request      # "Artist - Track"
│       │       ├── played       # boolean
│       │       ├── notes        # DJ notes (optional)
│       │       ├── platform     # "twitch"|"youtube"|"manual"|"mobile"
│       │       └── timestamp
│       ├── nextStream/          # Saved for next stream
│       └── currentRequester/    # Currently playing
```

### Security Rules
See `/Users/andrewkeim/Downloads/dj-request-system 2/firebase-rules.json` for required rules.

Key permissions:
- `/djHandles` - Anyone can read, authenticated users can write
- `/licenses/{key}/requests` - Anyone can read/write (for viewer submissions)
- `/licenses/{key}/handle` - Authenticated users only

## Key Services

### `src/services/firebase.ts`
Firebase initialization and connection management.

```typescript
initializeFirebase(): boolean
getFirebaseDatabase(): Database | null
isFirebaseConnected(): boolean
```

### `src/services/requests.ts`
Request CRUD operations and DJ handle management.

**License-based Operations (DJ Mode):**
```typescript
setCurrentLicenseKey(key: string | null): void
subscribeToRequests(callback): () => void  // Returns unsubscribe
addRequest(request): Promise<number>
updateRequestStatus(id, played): Promise<void>
updateRequest(id, { request?, notes? }): Promise<void>
deleteRequest(id): Promise<void>
deleteAllRequests(): Promise<void>
moveToNextStream(id): Promise<void>
```

**DJ Handle Operations:**
```typescript
// DJ registers their handle
registerDJHandle(handle, licenseKey, displayName?): Promise<void>

// Check if handle is available
isHandleAvailable(handle): Promise<boolean>

// Get DJ's handle from license
getDJHandle(licenseKey): Promise<string | null>

// Viewer looks up DJ by handle
lookupDJByHandle(handle): Promise<{ licenseKey, displayName } | null>

// Viewer submits request by handle
sendRequestByHandle(handle, { username, track }): Promise<{
  id: number,
  queuePosition: number,
  djDisplayName: string
}>
```

**Handle Validation:**
- Minimum 3 characters
- Lowercase alphanumeric + underscores only
- Normalized before storage (lowercase, trimmed)

## Authentication

### Login Screen (`app/auth/login.tsx`)
- Header bar with CueControl title and info button
- App logo, title, tagline, and version number
- Email/password form with Sign In / Sign Up tabs
- "Remember email" and "Stay signed in" checkboxes
- Auto-login when "Stay signed in" credentials are saved

### Flow
1. App checks for existing Firebase auth session
2. If not authenticated → Show login screen
3. User signs in or creates account
4. On success → Navigate to mode selection

### Context: `AuthContext.tsx`
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn(email, password): Promise<{ success, error? }>;
  signUp(email, password): Promise<{ success, error? }>;
  signOut(): Promise<void>;
}
```

## App Modes

### Mode Selection Screen (`app/index.tsx`)
After login, users choose between DJ Mode and Viewer Mode.

**Header Bar:**
- CueControl title on left
- Info button (i) - opens About modal
- Settings button (gear icon) - navigates to Settings screen
- Close button (X) - signs out and returns to login

**Content:**
- App logo, title, tagline, and version
- Contact Support button
- DJ Mode button - enters queue management
- Request Mode button - enters viewer request submission

### DJ Mode
Full queue management with tab navigation:

1. **Queue Tab** (`app/(tabs)/queue.tsx`)
   - Real-time request list
   - Tap status pill to toggle played/unplayed
   - Swipe left to delete
   - Swipe right to move to next stream
   - FAB button for manual entry
   - Edit button on each request

2. **Next Stream Tab** (`app/(tabs)/next-stream.tsx`)
   - Requests saved for future streams
   - Swipe right to move back to main queue

3. **Settings Tab** (`app/(tabs)/settings.tsx`)
   - License key management
   - DJ Handle registration
   - Sign out option
   - Request license key button (emails Admin@cuecontrolapp.com)

### Viewer Mode
Single screen for submitting requests:

**Screen:** `app/viewer/request.tsx`
- Header bar with CueControl title, info button (i), and close button (X)
- X button navigates back to home/mode selection (does NOT log out)
- DJ Handle input with `@` prefix
- Username input (saved for convenience)
- Track Request input (labeled "Track Request *")
- Submit button
- Success state shows queue position

**Flow:**
1. Viewer enters DJ's handle (e.g., `trinitro`)
2. App looks up DJ in Firebase (`/djHandles/trinitro`)
3. Gets license key from lookup result
4. Submits request to `/licenses/{licenseKey}/requests`
5. Returns queue position to viewer

## Request Data Schema

```typescript
interface Request {
  id: number;           // Timestamp-based ID
  username: string;     // Requester name
  request: string;      // "Artist - Track"
  message?: string;     // Original chat message
  played: boolean;      // Status
  notes?: string;       // DJ notes
  platform: 'twitch' | 'youtube' | 'manual' | 'mobile';
  timestamp?: number;
}
```

## Theme

Dark theme matching desktop app. See `src/constants/theme.ts`:

```typescript
colors: {
  background: {
    main: '#000000',
    panel: '#1a1a1a',
    row: '#2a2a2a',
  },
  accent: {
    primary: '#2f81ff',
    soft: 'rgba(47, 129, 255, 0.15)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#c5c5c5',
    muted: '#787878',
  },
  status: {
    played: '#7a7a7a',
    success: '#4CAF50',
  },
  border: '#3a3a3a',
}
```

## Running the App

### Development
```bash
cd /Users/andrewkeim/Downloads/cuecontrol-mobile
npm install
npx expo start
```

Scan QR code with Expo Go app on your phone.

### Type Checking
```bash
npx tsc --noEmit
```

### Building for Production
```bash
# Configure EAS Build
npx eas build:configure

# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

## Testing the DJ Handle Flow

End-to-end test script (run from desktop app directory):
```bash
cd "/Users/andrewkeim/Downloads/dj-request-system 2"
node -e "
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set, get } = require('firebase/database');

// ... test script that:
// 1. Authenticates user
// 2. Registers DJ handle
// 3. Looks up DJ by handle
// 4. Submits request to DJ's queue
// 5. Verifies request in queue
"
```

## Integration with Desktop App

The mobile app and desktop app share the same Firebase database:

1. **Desktop adds requests** via Twitch/YouTube chat bots → Firebase
2. **Mobile DJ Mode** subscribes to same Firebase path
3. **Mobile Viewer Mode** writes to DJ's Firebase path by handle lookup
4. **Changes sync in real-time** across all connected clients

**Data Path:** `/licenses/{licenseKeyWithoutDashes}/requests`

Example: License `DJRQ-Q448-YJQS-RKXJ` → Path `/licenses/DJRQQ448YJQSRKXJ/requests`

## Dependencies

| Package | Purpose |
|---------|---------|
| expo | React Native framework |
| expo-router | File-based navigation |
| firebase | Auth and Realtime Database |
| @react-native-async-storage/async-storage | Local storage |
| expo-secure-store | Secure credential storage |
| @expo/vector-icons | Icon library |
| react-native-gesture-handler | Swipe gestures |
| react-native-reanimated | Animations |

## Common Issues

### "DJ not found" Error
- Viewer entered wrong handle
- DJ hasn't registered their handle yet
- Handle is case-sensitive (always lowercase)

### Requests Not Syncing
- Check Firebase connection status
- Verify license key is correct
- Check Firebase security rules

### Authentication Issues
- Ensure Firebase Auth is enabled in console
- Check email/password requirements (min 6 chars for password)

## License

ISC
