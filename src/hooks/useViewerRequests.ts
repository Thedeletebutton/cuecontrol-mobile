import { useState, useEffect, useMemo } from 'react';
import { subscribeToRequestsByLicenseKey } from '../services/requests';
import { subscribeToNextStreamByLicenseKey } from '../services/nextStream';
import { Request } from '../types/request';

export function useViewerRequests(licenseKey: string | null) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!licenseKey) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRequestsByLicenseKey(licenseKey, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [licenseKey]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (a.played !== b.played) return a.played ? 1 : -1;
      const orderA = a.order !== undefined ? a.order : a.id;
      const orderB = b.order !== undefined ? b.order : b.id;
      return orderA - orderB;
    });
  }, [requests]);

  const totalCount = requests.length;
  const unplayedCount = requests.filter((r) => !r.played).length;
  const playedCount = requests.filter((r) => r.played).length;

  return {
    requests: sortedRequests,
    loading,
    totalCount,
    unplayedCount,
    playedCount,
  };
}

export function useViewerNextStream(licenseKey: string | null) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!licenseKey) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNextStreamByLicenseKey(licenseKey, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [licenseKey]);

  return {
    requests,
    loading,
    count: requests.length,
  };
}
