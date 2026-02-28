import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Gift, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserStatsModal({ userName, userEmail, onClose, currentUser }) {
  const [stats, setStats] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [tipping, setTipping] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const users = await base44.asServiceRole.entities.User.list();
      const targetUser = users.find(u => u.full_name === userName);
      if (targetUser) {
        const transactions = await base44.asServiceRole.entities.Transaction.filter({ user_email: targetUser.email });
        const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (t.amount || 0), 0);
        const wagered = transactions.filter(t => ['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type)).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
        
        setStats({
          ...targetUser,
          deposits,
          wagered,
          level: targetUser.level || 1,
          balance: targetUser.balance || 0,
          xp: targetUser.xp || 0
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, [userName]);

  const handleTip = async () => {
    if (!tipAmount || isNaN(tipAmount) || parseInt(tipAmount) <= 0) return;
    if (!currentUser || currentUser.balance < parseInt(tipAmount)) {
      alert('Insufficient balance');
      return;
    }

    setTipping(true);
    try {
      const amount = parseInt(tipAmount);
      await base44.auth.updateMe({ balance: currentUser.balance - amount });
      
      const targetUser = stats;
      if (targetUser) {
        await base44.asServiceRole.entities.User.update(targetUser.id, { balance: (targetUser.balance || 0) + amount });
        await base44.asServiceRole.entities.Transaction.create({
          user_email: targetUser.email,
          type: 'tip_received',
          amount,
          description: `Tip from ${currentUser.full_name}`,
          balance_after: (targetUser.balance || 0) + amount
        });
      }
      
      alert(`Tipped $${amount}!`);
      setTipAmount('');
      onClose();
    } catch (err) {
      alert('Failed to send tip');
    }
    setTipping(false);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a2e] rounded-xl p-6 text-white">Loading...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-b from-[#1a1a2e] to-[#16161f] rounded-xl border border-white/10 max-w-md w-full p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{userName}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {stats && (
          <div className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Level</p>
                <p className="text-xl font-bold text-violet-400">{stats.level}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Balance</p>
                <p className="text-xl font-bold text-amber-400">${stats.balance?.toLocaleString()}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Wagered</p>
                <p className="text-xl font-bold text-blue-400">${stats.wagered?.toLocaleString()}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Deposits</p>
                <p className="text-xl font-bold text-green-400">${stats.deposits?.toLocaleString()}</p>
              </div>
            </div>

            {/* Tip Section */}
            {currentUser?.email !== stats.email && (
              <div className="border-t border-white/10 pt-5">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
                  Send Tip
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  />
                  <button
                    onClick={handleTip}
                    disabled={tipping || !tipAmount}
                    className="bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
                  >
                    <Gift className="w-4 h-4" /> Tip
                  </button>
                </div>
                {currentUser && (
                  <p className="text-xs text-white/40 mt-2">Your balance: ${currentUser.balance?.toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}