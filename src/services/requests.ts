import { ref, set, update, remove, onValue, get } from 'firebase/database';
import { getFirebaseDatabase } from './firebase';
import { Request } from '../types/request';

// License key is stored and passed in from the component/context level
let currentLicenseKey: string | null = null;

export function setCurrentLicenseKey(key: string | null) {
  currentLicenseKey = key;
}

export function getCurrentLicenseKey(): string | null {
  return currentLicenseKey;
}

// Convert license key to Firebase-safe path (remove dashes)
function licenseKeyToPath(licenseKey: string): string {
  return licenseKey.replace(/-/g, '');
}

function getLicenseRequestsPath(): string {
  if (!currentLicenseKey) throw new Error('License key not set');
  return `licenses/${licenseKeyToPath(currentLicenseKey)}/requests`;
}

function getLicenseNextStreamPath(): string {
  if (!currentLicenseKey) throw new Error('License key not set');
  return `licenses/${licenseKeyToPath(currentLicenseKey)}/nextStream`;
}

export function subscribeToRequests(
  callback: (requests: Request[]) => void
): () => void {
  const db = getFirebaseDatabase();

  if (!db || !currentLicenseKey) {
    callback([]);
    return () => {};
  }

  const requestsRef = ref(db, getLicenseRequestsPath());
  const unsubscribe = onValue(requestsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const requestsArray = Object.entries(data).map(([key, value]) => ({
        ...(value as Request),
        id: parseInt(key) || (value as Request).id,
      })).sort((a, b) => a.id - b.id);
      callback(requestsArray);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
}

export async function addRequest(request: Omit<Request, 'id'>): Promise<number> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const basePath = getLicenseRequestsPath();
  const id = Date.now();
  const requestRef = ref(db, `${basePath}/${id}`);

  const cleanRequest: Record<string, unknown> = {};
  Object.entries(request).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanRequest[key] = value;
    }
  });

  await set(requestRef, {
    ...cleanRequest,
    id,
    timestamp: Date.now(),
  });
  return id;
}

export async function updateRequestStatus(id: number, played: boolean): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const basePath = getLicenseRequestsPath();
  const requestRef = ref(db, `${basePath}/${id}`);
  await update(requestRef, { played, timestamp: Date.now() });
}

export async function updateRequest(
  id: number,
  updates: { request?: string; notes?: string }
): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const cleanUpdates: Record<string, unknown> = { timestamp: Date.now() };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  const basePath = getLicenseRequestsPath();
  const requestRef = ref(db, `${basePath}/${id}`);
  await update(requestRef, cleanUpdates);
}

export async function deleteRequest(id: number): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const basePath = getLicenseRequestsPath();
  const requestRef = ref(db, `${basePath}/${id}`);
  await remove(requestRef);
}

export async function deleteAllRequests(): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const basePath = getLicenseRequestsPath();
  const requestsRef = ref(db, basePath);
  await set(requestsRef, {});
}

export async function getQueuePosition(): Promise<number> {
  const db = getFirebaseDatabase();
  if (!db || !currentLicenseKey) return 0;

  const requestsRef = ref(db, getLicenseRequestsPath());
  const snapshot = await get(requestsRef);
  const data = snapshot.val();
  if (!data) return 1;

  const unplayedCount = Object.values(data).filter(
    (r: any) => !r.played
  ).length;
  return unplayedCount + 1;
}

// Send a request to a specific DJ's queue by their license key
export async function sendRequestToDJ(
  djLicenseKey: string,
  request: { username: string; track: string }
): Promise<number> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const id = Date.now();
  const licensePath = djLicenseKey.replace(/-/g, '');
  const requestRef = ref(db, `licenses/${licensePath}/requests/${id}`);

  await set(requestRef, {
    id,
    username: request.username,
    request: request.track,
    played: false,
    platform: 'mobile',
    timestamp: Date.now(),
  });

  return id;
}

// Get queue position for a specific DJ's queue by license key
export async function getDJQueuePosition(djLicenseKey: string): Promise<number> {
  const db = getFirebaseDatabase();
  if (!db) return 0;

  const licensePath = djLicenseKey.replace(/-/g, '');
  const requestsRef = ref(db, `licenses/${licensePath}/requests`);
  const snapshot = await get(requestsRef);
  const data = snapshot.val();
  if (!data) return 1;

  const unplayedCount = Object.values(data).filter(
    (r: any) => !r.played
  ).length;
  return unplayedCount + 1;
}

// Validate license key format (DJRQ-XXXX-XXXX-XXXX)
export function validateLicenseKeyFormat(licenseKey: string): boolean {
  const regex = /^DJRQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(licenseKey.toUpperCase());
}

// DJ Handle functions - allows viewers to find DJs by handle instead of license key

// Register or update a DJ's handle
export async function registerDJHandle(
  handle: string,
  licenseKey: string,
  displayName?: string
): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const normalizedHandle = handle.toLowerCase().trim();
  if (!normalizedHandle || normalizedHandle.length < 3) {
    throw new Error('Handle must be at least 3 characters');
  }

  // Only allow alphanumeric and underscores
  if (!/^[a-z0-9_]+$/.test(normalizedHandle)) {
    throw new Error('Handle can only contain letters, numbers, and underscores');
  }

  const handleRef = ref(db, `djHandles/${normalizedHandle}`);
  await set(handleRef, {
    licenseKey: licenseKey.toUpperCase(),
    displayName: displayName || handle,
    updatedAt: Date.now(),
  });

  // Also store handle reference on the license for reverse lookup
  const licensePath = licenseKey.replace(/-/g, '');
  const licenseHandleRef = ref(db, `licenses/${licensePath}/handle`);
  await set(licenseHandleRef, normalizedHandle);
}

// Look up a DJ's license key by their handle
export async function lookupDJByHandle(
  handle: string
): Promise<{ licenseKey: string; displayName: string } | null> {
  const db = getFirebaseDatabase();
  if (!db) return null;

  const normalizedHandle = handle.toLowerCase().trim();
  const handleRef = ref(db, `djHandles/${normalizedHandle}`);
  const snapshot = await get(handleRef);
  const data = snapshot.val();

  if (!data || !data.licenseKey) return null;

  return {
    licenseKey: data.licenseKey,
    displayName: data.displayName || handle,
  };
}

// Check if a handle is available
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const db = getFirebaseDatabase();
  if (!db) return false;

  const normalizedHandle = handle.toLowerCase().trim();
  const handleRef = ref(db, `djHandles/${normalizedHandle}`);
  const snapshot = await get(handleRef);
  return !snapshot.exists();
}

// Get DJ's current handle from their license
export async function getDJHandle(licenseKey: string): Promise<string | null> {
  const db = getFirebaseDatabase();
  if (!db) return null;

  const licensePath = licenseKey.replace(/-/g, '');
  const handleRef = ref(db, `licenses/${licensePath}/handle`);
  const snapshot = await get(handleRef);
  return snapshot.val() || null;
}

// Send a request to a DJ by their handle (for viewers)
export async function sendRequestByHandle(
  handle: string,
  request: { username: string; track: string }
): Promise<{ id: number; queuePosition: number; djDisplayName: string }> {
  const djInfo = await lookupDJByHandle(handle);
  if (!djInfo) {
    throw new Error('DJ not found. Please check the handle and try again.');
  }

  const id = await sendRequestToDJ(djInfo.licenseKey, request);
  const queuePosition = await getDJQueuePosition(djInfo.licenseKey);

  return {
    id,
    queuePosition,
    djDisplayName: djInfo.displayName,
  };
}

export async function moveToNextStream(id: number): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const requestsPath = getLicenseRequestsPath();
  const nextStreamPath = getLicenseNextStreamPath();

  // Get the request first
  const requestRef = ref(db, `${requestsPath}/${id}`);
  const snapshot = await get(requestRef);
  const request = snapshot.val();

  if (!request) throw new Error('Request not found');

  // Add to next stream
  const nextStreamRef = ref(db, `${nextStreamPath}/${id}`);
  await set(nextStreamRef, {
    ...request,
    played: false,
    timestamp: Date.now(),
  });

  // Remove from requests
  await remove(requestRef);
}
