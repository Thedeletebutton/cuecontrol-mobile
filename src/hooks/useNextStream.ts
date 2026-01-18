import { useState, useEffect } from 'react';
import { subscribeToNextStream } from '../services/nextStream';
import { getCurrentLicenseKey } from '../services/requests';
import { Request } from '../types/request';

export function useNextStream(licenseKey?: string | null) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use passed licenseKey or get from service
  const effectiveLicenseKey = licenseKey ?? getCurrentLicenseKey();

  useEffect(() => {
    // Don't subscribe if no license key
    if (!effectiveLicenseKey) {
      setRequests([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    try {
      const unsubscribe = subscribeToNextStream((data) => {
        setRequests(data);
        setLoading(false);
        setError(null);
      });

      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load next stream');
      setLoading(false);
      return () => {};
    }
  }, [effectiveLicenseKey]);

  return {
    requests,
    loading,
    error,
    count: requests.length,
  };
}
