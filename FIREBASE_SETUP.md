# Firebase Setup for CueControl Mobile

## 1. Firebase Console Setup

### Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create one)
3. Go to **Authentication** > **Sign-in method**
4. Enable **Email/Password** authentication

### Configure Realtime Database Rules
1. Go to **Realtime Database** > **Rules**
2. Replace the default rules with:

```json
{
  "rules": {
    "djHandles": {
      "$handle": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "licenses": {
      "$licenseKey": {
        "handle": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "requests": {
          ".read": true,
          ".write": true
        },
        "nextStream": {
          ".read": true,
          ".write": true
        },
        "currentRequester": {
          ".read": true,
          ".write": true
        },
        "settings": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "requests": {
      ".read": true,
      ".write": true
    },
    "nextStream": {
      ".read": true,
      ".write": true
    },
    "currentRequester": {
      ".read": true,
      ".write": true
    }
  }
}
```

**What these rules do:**
- `djHandles` - Anyone can read (for handle lookups), only authenticated users can write (DJs register handles)
- `licenses/{key}/requests` - Open read/write for viewer submissions and queue display
- `licenses/{key}/handle` - Authenticated users only (reverse lookup from license to handle)
- Legacy paths (`/requests`, `/nextStream`, `/currentRequester`) - Open for desktop app backwards compatibility

3. Click **Publish**

## 2. Data Structure

```
Firebase Realtime Database:
├── djHandles/                    # DJ handle lookup table
│   └── {handle}:                 # e.g., "trinitro"
│       ├── licenseKey           # "DJRQ-XXXX-XXXX-XXXX"
│       ├── displayName          # "DJ Trinitro"
│       └── updatedAt            # timestamp
│
├── licenses/
│   └── {DJRQXXXXXXXX}/          # License key without dashes
│       ├── handle               # Reverse lookup: "trinitro"
│       ├── requests/
│       │   └── {requestId}: { id, username, request, played, notes, platform, timestamp }
│       ├── nextStream/
│       │   └── {requestId}: { ... }
│       └── currentRequester/
│           └── { username, requestId, timestamp }
│
└── (legacy paths for desktop app backwards compatibility)
    ├── requests/
    ├── nextStream/
    └── currentRequester/
```

## 3. DJ Handle System

DJs no longer share their license keys with viewers. Instead:

**For DJs:**
1. Sign in to the mobile or desktop app
2. Go to Settings
3. Enter your CueControl license key (DJRQ-XXXX-XXXX-XXXX)
4. Register a DJ Handle (e.g., `trinitro`)
5. Share your handle with viewers: **@trinitro**

**For Viewers:**
1. Sign in to the mobile app
2. Switch to Viewer/Request Mode
3. Enter the DJ's handle (e.g., `trinitro`)
4. Enter your name and song request
5. Submit - the app looks up the DJ and routes your request to their queue

**How Handle Lookup Works:**
```
Viewer enters: @trinitro
    ↓
App reads: /djHandles/trinitro
    ↓
Gets: { licenseKey: "DJRQ-Q448-YJQS-RKXJ", displayName: "DJ Trinitro" }
    ↓
Writes request to: /licenses/DJRQQ448YJQSRKXJ/requests/{id}
    ↓
Returns queue position to viewer
```

## 4. Handle Validation Rules

- Minimum 3 characters
- Lowercase letters, numbers, and underscores only
- Automatically normalized (trimmed, lowercased)
- Unique per DJ (checked before registration)

## 5. Build for TestFlight

After configuring Firebase:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build for iOS TestFlight
eas build --platform ios --profile preview
```

The build will create an IPA file that you can upload to TestFlight for testing.

## 6. Testing the Integration

Run this from the desktop app directory to test the full DJ handle flow:

```bash
cd "/Users/andrewkeim/Downloads/dj-request-system 2"
node -e "
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set, get } = require('firebase/database');

const config = {
  apiKey: 'AIzaSyBAOe5nEcgU4X3d0fqaiRCb551IgO7ZH4M',
  authDomain: 'cuecontrol-c22b4.firebaseapp.com',
  databaseURL: 'https://cuecontrol-c22b4-default-rtdb.firebaseio.com',
  projectId: 'cuecontrol-c22b4',
};

async function test() {
  const app = initializeApp(config);
  const db = getDatabase(app);

  // Test handle lookup
  const handleRef = ref(db, 'djHandles/your_test_handle');
  const snapshot = await get(handleRef);
  console.log('Handle data:', snapshot.val());
}
test();
"
```
