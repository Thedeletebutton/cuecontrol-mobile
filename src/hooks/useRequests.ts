import { useState, useEffect, useMemo } from 'react';
import { subscribeToRequestsByLicenseKey, getCurrentLicenseKey } from '../services/requests';
import { Request } from '../types/request';

export function useRequests(licenseKey?: string | null) {
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
      const unsubscribe = subscribeToRequestsByLicenseKey(effectiveLicenseKey, (data) => {
        setRequests(data);
        setLoading(false);
        setError(null);
      });

      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setLoading(false);
      return () => {};
    }
  }, [effectiveLicenseKey]);

  const totalCount = requests.length;
  const unplayedCount = requests.filter((r) => !r.played).length;
  const playedCount = requests.filter((r) => r.played).length;

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      // Unplayed first, then by order field (fallback to id)
      if (a.played !== b.played) return a.played ? 1 : -1;
      const orderA = a.order !== undefined ? a.order : a.id;
      const orderB = b.order !== undefined ? b.order : b.id;
      return orderA - orderB;
    });
  }, [requests]);

  return {
    requests: sortedRequests,
    loading,
    error,
    totalCount,
    unplayedCount,
    playedCount,
  };
}
