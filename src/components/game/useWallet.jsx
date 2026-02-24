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
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const updateBalance = useCallback(async (amount, type, description) => {
    const newBalance = balance + amount;
    await base44.auth.updateMe({ balance: newBalance });
    setBalance(newBalance);

    await base44.entities.Transaction.create({
      user_email: user.email,
      type,
      amount,
      balance_after: newBalance,
      description
    });

    return newBalance;
  }, [balance, user]);

  const addXp = useCallback(async (amount) => {
    const newXp = (xp || 0) + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    await base44.auth.updateMe({ xp: newXp, level: newLevel });
    setXp(newXp);
    setLevel(newLevel);
  }, [xp]);

  const xpProgress = ((xp % 500) / 500) * 100;

  return { user, balance, xp, level, xpProgress, loading, updateBalance, addXp, reload: loadUser };
}

export function getXpForLevel(level) {
  return level * 500;
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
    common: 'shadow-zinc-400/20',
    uncommon: 'shadow-green-400/20',
    rare: 'shadow-blue-400/20',
    epic: 'shadow-purple-400/30',
    legendary: 'shadow-amber-400/40',
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