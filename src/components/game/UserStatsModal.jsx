import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserStatsModal({ userName, userEmail, onClose, currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const response = await base44.functions.invoke('getUserStats', { userName });
      setStats(response.data);
      setLoading(false);
    };
    fetchStats();
  }, [userName]);

  const handleTip = async () => {
    if (!tipAmount || isNaN(tipAmount) || parseInt(tipAmount) <= 0) {
      alert('Invalid amount');
      return;
    }
    const amount = parseInt(tipAmount);
    if (!currentUser || (currentUser.balance || 0) < amount) {
      alert('Insufficient balance');
      return;
    }

    setTipping(true);
    try {
      // Deduct from sender
      await base44.auth.updateMe({ balance: (currentUser.balance || 0) - amount });
      
      // Send to recipient
      await base44.functions.invoke('processTip', {
        recipientEmail: stats.email,
        amount,
        senderName: currentUser.full_name
      });
      
      alert(`Tipped $${amount}!`);
      setTipAmount('');
      setTipping(false);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to send tip');
      setTipping(false);
    }
  };

  const copyId = () => {
    if (stats?.id) {
      navigator.clipboard.writeText(stats.id);
      alert('ID copied!');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a2e] rounded-xl p-6 text-white">Loading...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-sm overflow-y-auto max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">User profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {stats && (
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-4xl flex-shrink-0">
                😎
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-lg">{stats.level}</span>
                  <span className="text-white/60 text-sm">{userName}</span>
                </div>
                <p className="text-xs text-white/40 mb-3">ID: #{stats.id?.slice(-4) || '687'} <button onClick={copyId} className="text-white/50 hover:text-white/70"><Copy className="w-3 h-3 inline ml-1" /></button></p>
                {currentUser?.email !== stats.email && (
                  <button
                    onClick={() => setTipping(!tipping)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                  >
                    Tip User
                  </button>
                )}
              </div>
            </div>

            {/* Tip Input */}
            {currentUser?.email !== stats.email && (
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="Tip amount"
                    min="1"
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleTip}
                    disabled={tipping || !tipAmount}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    {tipping ? 'Sending...' : 'Tip'}
                  </button>
                </div>
                {currentUser && (
                  <p className="text-[10px] text-white/40">Your balance: ${(currentUser.balance || 0).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Game Stats */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">GAME STATS</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-white/40 mb-1">FAVORITE</p>
                  <p className="text-xs font-bold text-white capitalize">{stats.favoriteGame || 'Battles'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 mb-1">BIGGEST WIN</p>
                  <p className="text-xs font-bold text-amber-400">💰 {(stats.biggestWin || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 mb-1">WIN RATE</p>
                  <p className="text-xs font-bold text-green-400">{stats.winRate || '0'}%</p>
                </div>
              </div>
            </div>

            {/* Total Wagered */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">TOTAL WAGERED</p>
              <p className="text-2xl font-bold text-white">💰 {(stats.wagered || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}