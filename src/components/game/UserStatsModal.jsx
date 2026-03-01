import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import Portal from '../Portal';
import { safeAvatarUrl } from './usePlayerAvatars';

export default function UserStatsModal({ userName, userEmail, onClose, currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipping, setTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await base44.functions.invoke('getPlayerStats', { userEmail });
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    // Subscribe to transaction updates for real-time stats
    const unsubTrans = base44.entities.Transaction.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        fetchStats();
      }
    });
    
    return () => unsubTrans();
  }, [userName, userEmail]);

  const handleTip = async () => {
    if (!currentUser || (currentUser.level || 0) < 5) {
      alert('You must reach level 5 to tip other players');
      return;
    }
    if (!tipAmount || isNaN(tipAmount) || parseInt(tipAmount) <= 0) {
      alert('Invalid amount');
      return;
    }
    const amount = parseInt(tipAmount);
    if ((currentUser.balance || 0) < amount) {
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

  const canTip = stats && currentUser?.email !== stats.email && (currentUser?.level || 0) >= 5;

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
    <Portal>
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-sm max-h-[85vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a2e]/95 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">User profile</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {stats && (
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 overflow-hidden">
                {stats.avatar_url && stats.avatar_url !== 'null' && stats.avatar_url !== 'undefined' && stats.avatar_url.trim() !== ''
                  ? <img src={stats.avatar_url} alt="" className="w-full h-full object-cover" />
                  : (userName?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold text-lg">{stats.level}</span>
                  <span className="text-white font-semibold truncate">{userName}</span>
                </div>
                <p className="text-xs text-white/40">ID: #{stats.id?.slice(-4) || '480'} <button onClick={copyId} className="text-white/50 hover:text-white/70 ml-1"><Copy className="w-3 h-3 inline" /></button></p>
                {stats.balance !== undefined && (
                  <p className="text-xs text-amber-400 font-semibold mt-1">💰 ${(stats.balance || 0).toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Tip Button */}
            {stats && currentUser?.email !== stats.email && (
              <div className="space-y-2">
                {(currentUser?.level || 0) < 5 ? (
                  <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/50">Reach level 5 to tip players</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="Amount"
                      min="1"
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors"
                    />
                    <button
                      onClick={handleTip}
                      disabled={tipping || !tipAmount}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:from-white/20 disabled:to-white/20 text-white px-5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap shadow-lg shadow-blue-500/30"
                    >
                      {tipping ? 'Sending...' : '✈️ Tip'}
                    </button>
                  </div>
                )}
                {currentUser && (
                  <p className="text-[10px] text-white/40">Balance: ${(currentUser.balance || 0).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Stats Section */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-4">STATS</p>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-[10px] text-white/50 mb-2">FAVORITE GAME</p>
                  <p className="text-sm font-bold text-white capitalize">{stats.favoriteGame || 'Mines'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 mb-2">LUCKIEST WIN</p>
                  <p className="text-sm font-bold text-white">{stats.luckiestWin || '64.50'}x</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 mb-2">BIGGEST WIN</p>
                  <p className="text-sm font-bold text-amber-400">💰 {(stats.biggestWin || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Game Stats Grid */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-4">GAME STATS</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60 text-xs">Cases</span>
                  <span className="text-amber-400 font-semibold text-xs">💰 {(stats.cases || 0).toLocaleString()}</span>
                  <span className="text-white/60 text-xs">Battles</span>
                  <span className="text-amber-400 font-semibold text-xs">💰 {(stats.battles || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-xs">Coinflip</span>
                  <span className="text-amber-400 font-semibold text-xs">💰 {(stats.coinflip || 0).toLocaleString()}</span>
                  <span className="text-white/60 text-xs">Crash</span>
                  <span className="text-amber-400 font-semibold text-xs">💰 {(stats.crash || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Wagered */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">TOTAL WAGERED</p>
              <p className="text-lg font-bold text-amber-400 text-right">💰 {(stats.wagered || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
        </motion.div>
      </div>
    </Portal>
  );
}