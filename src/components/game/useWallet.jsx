import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useWallet() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    setBalance(me.balance || 0);
    setXp(me.xp || 0);
    setLevel(me.level || 1);
    setLoading(false);
    return me;
  }, []);

  useEffect(() => {
    loadUser();
    // Poll every 5s so avatar/username changes propagate
    const interval = setInterval(loadUser, 5000);
    const unsub = base44.entities.User.subscribe((event) => {
      if (event.type === 'update') loadUser();
    });
    return () => { clearInterval(interval); unsub(); };
  }, [loadUser]);

  // Always fetch fresh balance from server to avoid stale closure issues
  const updateBalance = useCallback(async (amount, type, description) => {
    const me = await base44.auth.me();
    const currentBalance = me.balance || 0;
    const newBalance = currentBalance + amount;
    await base44.auth.updateMe({ balance: newBalance });
    setBalance(newBalance);

    await base44.entities.Transaction.create({
      user_email: me.email,
      type,
      amount,
      balance_after: newBalance,
      description
    });

    return newBalance;
  }, []);

  const addXp = useCallback(async (amount) => {
    const me = await base44.auth.me();
    const currentXp = me.xp || 0;
    const newXp = currentXp + amount;
    const newLevel = Math.min(calculateLevelFromXp(newXp), 200);
    await base44.auth.updateMe({ xp: newXp, level: newLevel });
    setXp(newXp);
    setLevel(newLevel);
  }, []);

  // Rakeback rates per wager (very small %)
  // instant: 0.5%, daily: 0.3%, weekly: 0.2%, monthly: 0.1%
  const addRakeback = useCallback(async (wagerAmount) => {
    if (!wagerAmount || wagerAmount <= 0) return;
    const me = await base44.auth.me();
    await base44.auth.updateMe({
      rakeback_instant: Math.floor((me.rakeback_instant || 0) + wagerAmount * 0.005),
      rakeback_daily:   Math.floor((me.rakeback_daily   || 0) + wagerAmount * 0.003),
      rakeback_weekly:  Math.floor((me.rakeback_weekly  || 0) + wagerAmount * 0.002),
      rakeback_monthly: Math.floor((me.rakeback_monthly || 0) + wagerAmount * 0.001),
    });
  }, []);

  const xpProgress = level >= 200 ? 100 : getXpProgressForLevel(level, xp);

  return { user, balance, xp, level, xpProgress, loading, updateBalance, addXp, addRakeback, reload: loadUser };
}

export function getXpForLevel(level) {
  return Math.floor(500 * level + 100 * (level * (level - 1) / 2));
}

export function calculateLevelFromXp(totalXp) {
  let level = 1;
  let xpSpent = 0;
  
  while (level < 200 && xpSpent + getXpForLevel(level) <= totalXp) {
    xpSpent += getXpForLevel(level);
    level++;
  }
  
  return level;
}

export function getXpProgressForLevel(level, totalXp) {
  if (level >= 200) return 100;
  
  let xpSpent = 0;
  for (let i = 1; i < level; i++) {
    xpSpent += getXpForLevel(i);
  }
  
  const xpNeededForLevel = getXpForLevel(level);
  const xpInCurrentLevel = totalXp - xpSpent;
  return (xpInCurrentLevel / xpNeededForLevel) * 100;
}

export function getRarityColor(rarity) {
  const colors = {
    common: 'from-zinc-400 to-zinc-500',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-orange-500',
  };
  return colors[rarity] || colors.common;
}

export function getRarityBorder(rarity) {
  const colors = {
    common: 'border-zinc-400/40',
    uncommon: 'border-green-400/40',
    rare: 'border-blue-400/40',
    epic: 'border-purple-400/40',
    legendary: 'border-amber-400/40',
  };
  return colors[rarity] || colors.common;
}

export function getRarityGlow(rarity) {
  const colors = {
    common: 'shadow-lg shadow-zinc-400/40',
    uncommon: 'shadow-lg shadow-green-400/50',
    rare: 'shadow-lg shadow-blue-400/60',
    epic: 'shadow-lg shadow-purple-400/70',
    legendary: 'shadow-xl shadow-amber-400/80',
  };
  return colors[rarity] || colors.common;
}

export function rollItem(items) {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((sum, item) => sum + (item.drop_rate || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= (item.drop_rate || 1);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}