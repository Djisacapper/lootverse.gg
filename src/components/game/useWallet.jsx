import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const Users = base44.entities.User;

export default function useWallet() {
  const { isAuthenticated, user: authUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ── Guard: don't attempt fetch if not authenticated ──
    if (!isAuthenticated || !authUser) {
      setWallet(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await Users.filter({ created_by: authUser.email });
        if (!cancelled) {
          setWallet(data?.[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          // Silently swallow auth errors — user simply isn't logged in yet
          if (
            err?.message?.toLowerCase().includes('authentication') ||
            err?.message?.toLowerCase().includes('unauthorized') ||
            err?.status === 401
          ) {
            setWallet(null);
          } else {
            setError(err?.message || 'Failed to load wallet');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWallet();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authUser]);

  return { wallet, loading, error };
}