import { ref, set, update, remove, onValue, get } from 'firebase/database';
import { getFirebaseDatabase } from './firebase';
import { getCurrentLicenseKey } from './requests';
import { Request } from '../types/request';

// Convert license key to Firebase-safe path (remove dashes)
function licenseKeyToPath(licenseKey: string): string {
  return licenseKey.replace(/-/g, '');
}

function getLicenseNextStreamPath(): string {
  const licenseKey = getCurrentLicenseKey();
  if (!licenseKey) throw new Error('License key not set');
  return `licenses/${licenseKeyToPath(licenseKey)}/nextStream`;
}

function getLicenseRequestsPath(): string {
  const licenseKey = getCurrentLicenseKey();
  if (!licenseKey) throw new Error('License key not set');
  return `licenses/${licenseKeyToPath(licenseKey)}/requests`;
}

export function subscribeToNextStream(
  callback: (requests: Request[]) => void
): () => void {
  const db = getFirebaseDatabase();
  const licenseKey = getCurrentLicenseKey();

  if (!db || !licenseKey) {
    callback([]);
    return () => {};
  }

  const nextStreamRef = ref(db, getLicenseNextStreamPath());
  const unsubscribe = onValue(nextStreamRef, (snapshot) => {
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

export async function updateNextStreamRequest(
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

  const basePath = getLicenseNextStreamPath();
  const requestRef = ref(db, `${basePath}/${id}`);
  await update(requestRef, cleanUpdates);
}

export async function deleteNextStreamRequest(id: number): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const basePath = getLicenseNextStreamPath();
  const requestRef = ref(db, `${basePath}/${id}`);
  await remove(requestRef);
}

export async function moveFromNextStream(id: number): Promise<void> {
  const db = getFirebaseDatabase();
  if (!db) throw new Error('Not connected to Firebase');

  const nextStreamPath = getLicenseNextStreamPath();
  const requestsPath = getLicenseRequestsPath();

  // Get the request first
  const nextStreamRef = ref(db, `${nextStreamPath}/${id}`);
  const snapshot = await get(nextStreamRef);
  const request = snapshot.val();

  if (!request) throw new Error('Request not found');

  // Add to main requests
  const requestRef = ref(db, `${requestsPath}/${id}`);
  await set(requestRef, {
    ...request,
    played: false,
    timestamp: Date.now(),
  });

  // Remove from next stream
  await remove(nextStreamRef);
}
