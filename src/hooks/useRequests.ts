import { useState, useEffect, useMemo } from 'react';
import { subscribeToRequests, getCurrentLicenseKey } from '../services/requests';
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
      const unsubscribe = subscribeToRequests((data) => {
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
      // Unplayed first, then by ID
      if (a.played !== b.played) return a.played ? 1 : -1;
      return a.id - b.id;
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
