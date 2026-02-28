import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { Zap, Clock, Calendar, CalendarDays, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Cooldown durations in ms
const COOLDOWNS = { daily: 24 * 60 * 60 * 1000, weekly: 7 * 24 * 60 * 60 * 1000, monthly: 30 * 24 * 60 * 60 * 1000 };

function formatTimeLeft(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 24) return `${Math.ceil(ms / 86400000)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const COIN_ICON = () => (
  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
    <span className="text-[9px] font-black text-white">$</span>
  </div>
);

const RAKEBACK_TIERS = [
  { key: 'instant', label: 'Instant Rakeback', icon: '🟣', desc: 'Claimable', color: 'from-fuchsia-600/30 to-purple-900/30', border: 'border-fuchsia-500/20' },
  { key: 'daily', label: 'Daily Rakeback', icon: '⬡', desc: 'Claimable', color: 'from-slate-600/30 to-slate-900/30', border: 'border-slate-500/20' },
  { key: 'weekly', label: 'Weekly Rakeback', icon: '🔵', desc: 'Claimable', color: 'from-blue-600/30 to-blue-900/30', border: 'border-blue-500/20' },
  { key: 'monthly', label: 'Monthly Rakeback', icon: '🟡', desc: 'Claimable', color: 'from-yellow-600/30 to-yellow-900/30', border: 'border-yellow-500/20' },
];

export default function Rewards() {
  const { user, reload: reloadUser, updateBalance } = useWallet();
  const [refCode, setRefCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rakeback, setRakeback] = useState({ instant: 0, daily: 0, weekly: 0, monthly: 0 });
  const [claiming, setClaiming] = useState({});
  const [now, setNow] = useState(Date.now());

  // Tick every second to update cooldown timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getCooldownLeft = (key) => {
    if (key === 'instant') return 0;
    const claimedAt = user?.[`rakeback_${key}_claimed_at`];
    if (!claimedAt) return 0;
    return Math.max(0, COOLDOWNS[key] - (now - new Date(claimedAt).getTime()));
  };

  // Load rakeback from user data
  useEffect(() => {
    if (!user) return;
    setRakeback({
      instant: user.rakeback_instant || 0,
      daily: user.rakeback_daily || 0,
      weekly: user.rakeback_weekly || 0,
      monthly: user.rakeback_monthly || 0,
    });
  }, [user]);

  const totalClaimed = user?.total_rakeback_claimed || 0;
  const totalPending = 0;
  const totalClaimable = Object.values(rakeback).reduce((a, b) => a + b, 0);

  const handleClaimRefCode = async () => {
    if (!refCode.trim() || !user) return;
    const code = refCode.trim().toLowerCase();

    // Can't use your own code
    if (user.affiliate_code && code === user.affiliate_code.toLowerCase()) {
      toast.error("You can't use your own referral code!");
      return;
    }

    setSubmitting(true);
    try {
      // Find user with this affiliate code
      const users = await base44.entities.User.list();
      const referrer = users.find(u => u.affiliate_code?.toLowerCase() === code);
      if (!referrer) {
        toast.error('Referral code not found');
        setSubmitting(false);
        return;
      }

      // Update current user's referred_by
      await base44.auth.updateMe({ referred_by: code });

      // Create referral record
      await base44.entities.Referral.create({
        referrer_email: referrer.email,
        referred_email: user.email,
        earnings: 0,
        status: 'active',
      });

      await reloadUser?.();
      setRefCode('');
      toast.success('Referral code applied successfully!');
    } catch (e) {
      toast.error('Failed to apply code');
    }
    setSubmitting(false);
  };

  const handleClaimRakeback = async (key) => {
    const amount = rakeback[key];
    if (!amount || amount <= 0) return;
    if (getCooldownLeft(key) > 0) return;
    setClaiming(c => ({ ...c, [key]: true }));
    const updateKey = `rakeback_${key}`;
    const updates = {
      [updateKey]: 0,
      total_rakeback_claimed: (user?.total_rakeback_claimed || 0) + amount,
    };
    if (key !== 'instant') updates[`rakeback_${key}_claimed_at`] = new Date().toISOString();
    await base44.auth.updateMe(updates);
    await updateBalance(amount, 'daily_reward', `${key} rakeback claimed`);
    await reloadUser?.();
    setRakeback(r => ({ ...r, [key]: 0 }));
    setClaiming(c => ({ ...c, [key]: false }));
    toast.success(`Claimed ${amount.toLocaleString()} coins!`);
  };

  const alreadyHasCode = !!user?.referred_by;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Rewards</h1>
        <p className="text-white/40 text-sm">Claim rakeback and apply your referral code</p>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl p-6 border border-white/10"
        style={{ background: 'linear-gradient(135deg, #1a1030 0%, #0f0a20 100%)' }}>
        <h2 className="text-2xl font-black text-white mb-1">
          Receive up to <span className="text-fuchsia-400">5%</span> on<br />
          deposits from your friends
        </h2>
        <p className="text-white/40 text-sm mb-5">Reward system which gives everyone a free chance to play and win BIG!</p>
        {alreadyHasCode ? (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-white/50 text-sm">Referral code applied:</span>
            <span className="text-green-400 font-bold">{user.referred_by}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="Enter referral code"
                className="bg-white/[0.07] border-white/10 text-white rounded-xl pr-10"
              />
              <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            </div>
            <Button
              onClick={handleClaimRefCode}
              disabled={!refCode.trim() || submitting}
              className="bg-green-400 hover:bg-green-300 text-black font-bold rounded-xl px-5 disabled:opacity-40"
            >
              {submitting ? '...' : 'Claim Coins'}
            </Button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 border border-white/5">
          <p className="text-xs text-white/40 mb-2">Total Claimed</p>
          <div className="flex items-center gap-1.5">
            <COIN_ICON />
            <span className="text-xl font-black text-white">{totalClaimed.toLocaleString()}</span>
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/5">
          <p className="text-xs text-white/40 mb-2">Total Pending</p>
          <div className="flex items-center gap-1.5">
            <COIN_ICON />
            <span className="text-xl font-black text-white">{totalPending.toLocaleString()}</span>
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-green-500/20 bg-green-500/5">
          <p className="text-xs text-green-400/70 mb-2">Total Claimable</p>
          <div className="flex items-center gap-1.5">
            <COIN_ICON />
            <span className="text-xl font-black text-white">{totalClaimable.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Rakeback Section */}
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Rakeback</h3>
        <p className="text-white/40 text-sm mb-4">For every bet you will receive a portion back.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RAKEBACK_TIERS.map((tier) => {
            const amount = rakeback[tier.key] || 0;
            const cooldownLeft = getCooldownLeft(tier.key);
            const onCooldown = cooldownLeft > 0;
            return (
              <div key={tier.key}
                className={`rounded-2xl p-4 border bg-gradient-to-b ${tier.color} ${tier.border} flex flex-col items-center gap-3 text-center`}>
                <div className="text-3xl mt-1">{tier.icon}</div>
                <div>
                  <p className="text-sm font-bold text-white">{tier.label}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <p className="text-xs text-white/40">{tier.desc}:</p>
                    <COIN_ICON />
                    <p className="text-xs font-bold text-white">{amount.toLocaleString()}</p>
                  </div>
                </div>
                {onCooldown ? (
                  <div className="w-full py-2 rounded-xl text-xs font-bold text-white/50 bg-white/5 border border-white/10 text-center">
                    ⏳ {formatTimeLeft(cooldownLeft)}
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaimRakeback(tier.key)}
                    disabled={amount <= 0 || claiming[tier.key]}
                    className="w-full py-2 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(90deg, #e040fb, #f06292)' }}
                  >
                    {claiming[tier.key] ? '...' : 'Claim now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}