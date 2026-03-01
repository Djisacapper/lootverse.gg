import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Given an array of player objects (with .email), fetches the latest avatar_url
 * and username from the User entity and returns an enriched array.
 * 
 * Works for any game mode (Battles, Crash bets, Coinflip, etc.)
 */
export function usePlayerAvatars(players) {
  const [enriched, setEnriched] = useState(players || []);
  const lastEmailKey = useRef('');

  useEffect(() => {
    if (!players || players.length === 0) {
      setEnriched([]);
      return;
    }

    const realEmails = players
      .filter(p => p && p.email && !p.isBot && !p.email.startsWith('bot_') && !p.email.includes('@system'))
      .map(p => p.email);

    const emailKey = realEmails.sort().join(',');
    if (emailKey === lastEmailKey.current) return;
    lastEmailKey.current = emailKey;

    if (realEmails.length === 0) {
      setEnriched(players);
      return;
    }

    // Fetch fresh avatars via backend function
    base44.functions.invoke('getUserAvatars', { emails: realEmails })
      .then(response => {
        const userMap = response?.data?.users || {};
        setEnriched(
          players.map(p => {
            if (!p || p.isBot || !p.email || !userMap[p.email]) return p;
            const fresh = userMap[p.email];
            return {
              ...p,
              avatar_url: fresh.avatar_url || p.avatar_url || null,
              name: p.name || fresh.username || p.name,
            };
          })
        );
      })
      .catch(() => {
        // If backend function fails, just use what we have
        setEnriched(players);
      });
  }, [JSON.stringify((players || []).map(p => p?.email))]);

  return enriched;
}

/** Sanitize an avatar URL — returns null if it's a falsy/string-null value */
export function safeAvatarUrl(url) {
  if (!url || url === 'null' || url === 'undefined' || url === '') return null;
  return url;
}