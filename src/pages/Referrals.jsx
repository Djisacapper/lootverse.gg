import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Users, Copy, Gift, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Referrals() {
  const { user } = useWallet();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.Referral.filter({ referrer_email: user.email }).then((data) => {
      setReferrals(data);
      setLoading(false);
    });
  }, [user]);

  const referralLink = user ? `${window.location.origin}?ref=${encodeURIComponent(user.email)}` : '';
  const totalEarnings = referrals.reduce((sum, r) => sum + (r.earnings || 0), 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Referrals</h1>
        <p className="text-white/40 text-sm">Invite friends and earn 5% of their deposits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/5 text-center">
          <Users className="w-8 h-8 text-violet-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{referrals.length}</p>
          <p className="text-xs text-white/30 mt-1">Total Referrals</p>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5 text-center">
          <Gift className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-amber-400">{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-white/30 mt-1">Total Earnings</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-violet-400" /> Your Referral Link
        </h3>
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="bg-white/5 border-white/10 text-white/70 text-sm rounded-xl"
          />
          <Button
            onClick={handleCopy}
            className={`rounded-xl px-4 ${copied ? 'bg-green-600' : 'bg-violet-600 hover:bg-violet-500'}`}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-white/20 mt-2">Share this link and earn 5% of everything your referrals deposit</p>
      </div>

      {/* Referral List */}
      {loading ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No referrals yet</p>
          <p className="text-white/20 text-sm mt-1">Share your link to start earning</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/60 mb-2">Your Referrals</h3>
          {referrals.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex items-center justify-between border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                  {r.referred_email?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-white/60">{r.referred_email}</span>
              </div>
              <span className="text-sm font-bold text-amber-400">{(r.earnings || 0).toLocaleString()} earned</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}