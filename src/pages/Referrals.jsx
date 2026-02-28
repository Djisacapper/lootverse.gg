import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { Copy, Check, Users, TrendingUp, DollarSign, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TIERS = [
  { name: 'Tier 1', commission: 2.5, maxDeposited: 25000, color: '#8b5cf6' },
  { name: 'Tier 2', commission: 5.0, maxDeposited: 100000, color: '#6366f1' },
  { name: 'Tier 3', commission: 7.5, maxDeposited: 500000, color: '#f59e0b' },
  { name: 'Tier 4', commission: 10, maxDeposited: Infinity, color: '#f97316' },
];

function getTier(totalDeposited) {
  return TIERS.find(t => totalDeposited < t.maxDeposited) || TIERS[TIERS.length - 1];
}

function generateCode(name, email) {
  const base = (name || email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase();
  const rand = Math.floor(Math.random() * 999);
  return `${base}${rand}`;
}

export default function Referrals() {
  const { user, reloadUser } = useWallet();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTiers, setShowTiers] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [timeRange, setTimeRange] = useState('All');

  useEffect(() => {
    if (!user) return;
    // Auto-generate affiliate code if user doesn't have one
    if (!user.affiliate_code) {
      const code = generateCode(user.full_name, user.email);
      base44.auth.updateMe({ affiliate_code: code }).then(() => reloadUser?.());
    } else {
      setCodeInput(user.affiliate_code);
    }

    base44.entities.Referral.filter({ referrer_email: user.email }).then((data) => {
      setReferrals(data || []);
      setLoading(false);
    });
  }, [user?.email]);

  useEffect(() => {
    if (user?.affiliate_code) setCodeInput(user.affiliate_code);
  }, [user?.affiliate_code]);

  const totalDeposited = user?.total_deposited || 0;
  const totalEarnings = user?.affiliate_earnings || 0;
  const claimable = user?.affiliate_earnings_claimable || 0;
  const tier = getTier(totalDeposited);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const tierProgress = nextTier
    ? Math.min((totalDeposited / tier.maxDeposited) * 100, 100)
    : 100;

  const affiliateLink = user?.affiliate_code
    ? `${window.location.origin}?ref=${user.affiliate_code}`
    : '';

  const handleSaveCode = async () => {
    if (!codeInput.trim() || codeInput === user?.affiliate_code) return;
    setSavingCode(true);
    await base44.auth.updateMe({ affiliate_code: codeInput.trim().toLowerCase().replace(/\s+/g, '') });
    await reloadUser?.();
    setSavingCode(false);
    toast.success('Affiliate code saved!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    if (claimable <= 0) return;
    setClaiming(true);
    await base44.auth.updateMe({
      balance: (user.balance || 0) + claimable,
      affiliate_earnings_claimable: 0,
    });
    await reloadUser?.();
    setClaiming(false);
    toast.success(`Claimed ${claimable.toLocaleString()} coins!`);
  };

  // Build earnings chart data from referrals
  const chartData = referrals.length > 0
    ? referrals.map((r, i) => ({ name: `Ref ${i + 1}`, earnings: r.earnings || 0 }))
    : [{ name: 'No data', earnings: 0 }];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Affiliates</h1>
        <p className="text-white/40 text-sm">Earn commissions by referring new players</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Tier Card */}
          <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}44` }}>
              <TrendingUp className="w-8 h-8" style={{ color: tier.color }} />
            </div>
            <div>
              <p className="text-xl font-black text-white">{tier.name}</p>
              <p className="text-sm text-white/40">{tier.commission}% commission</p>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-xs text-white/30 mb-1.5">
                <span>${totalDeposited.toLocaleString()}</span>
                <span>{nextTier ? `$${tier.maxDeposited.toLocaleString()}` : 'MAX'}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${tierProgress}%`, background: tier.color }} />
              </div>
            </div>
            <button
              onClick={() => setShowTiers(!showTiers)}
              className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm text-white/60 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              View Tiers <ChevronRight className={`w-4 h-4 transition-transform ${showTiers ? 'rotate-90' : ''}`} />
            </button>
            {showTiers && (
              <div className="w-full space-y-2 pt-1">
                {TIERS.map((t) => (
                  <div key={t.name} className={`flex justify-between items-center px-3 py-2 rounded-lg text-xs ${t.name === tier.name ? 'bg-white/10 border border-white/10' : 'text-white/40'}`}>
                    <span className="font-bold" style={{ color: t.name === tier.name ? t.color : undefined }}>{t.name}</span>
                    <span>{t.commission}% — up to ${t.maxDeposited === Infinity ? '∞' : t.maxDeposited.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affiliate Code */}
          <div className="glass rounded-2xl p-5 border border-white/5 space-y-3">
            <p className="text-sm font-semibold text-white">Your Referral Code</p>
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="bg-white/5 border-white/10 text-white rounded-xl flex-1"
                placeholder="yourcode"
              />
              <Button onClick={handleSaveCode} disabled={savingCode || codeInput === user?.affiliate_code}
                className="bg-green-500 hover:bg-green-400 text-white rounded-xl px-4 font-bold">
                {savingCode ? '...' : 'Save'}
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={affiliateLink}
                readOnly
                className="bg-white/5 border-white/10 text-white/50 text-xs rounded-xl flex-1"
              />
              <button onClick={handleCopy}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/60 hover:text-white transition-all">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Overview */}
          <div>
            <p className="text-lg font-bold text-white mb-3">Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-4 border border-white/5">
                <p className="text-xs text-white/40 mb-1">Referrals</p>
                <p className="text-2xl font-black text-white">{referrals.length} Users</p>
              </div>
              <div className="glass rounded-xl p-4 border border-white/5">
                <p className="text-xs text-white/40 mb-1">Total Deposited</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">$</span>
                  </div>
                  <p className="text-2xl font-black text-white">{totalDeposited.toLocaleString()}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 border border-white/5">
                <p className="text-xs text-white/40 mb-1">Total Earnings</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">$</span>
                  </div>
                  <p className="text-2xl font-black text-white">{totalEarnings.toLocaleString()}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 border border-white/5 bg-green-500/5 border-green-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-green-400/70 mb-1">Available Earnings</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">$</span>
                      </div>
                      <p className="text-2xl font-black text-white">{claimable.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button onClick={handleClaim} disabled={claimable <= 0 || claiming}
                    className="bg-green-500 hover:bg-green-400 text-white rounded-xl px-4 font-bold disabled:opacity-40">
                    {claiming ? '...' : 'Claim'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-bold text-white">Statistics</p>
              <div className="flex gap-1">
                {['1D', '7D', '1M', '3M', 'All'].map((r) => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                      ${timeRange === r ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">$</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Earnings Over Time</p>
                <p className="text-xl font-black text-white">{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
            {referrals.length === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-white/20 text-sm">No earnings data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" fill="url(#earningsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Referred Users List */}
          {referrals.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Users className="w-4 h-4 text-white/40" />
                <p className="text-sm font-semibold text-white/60">Referred Users</p>
              </div>
              <div className="divide-y divide-white/[0.03] max-h-48 overflow-y-auto">
                {referrals.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                      {r.referred_email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <p className="text-sm text-white/60 flex-1 truncate">{r.referred_email}</p>
                    <span className="text-xs font-bold text-amber-400">{(r.earnings || 0).toLocaleString()} earned</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}