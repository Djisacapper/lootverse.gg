import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, LogOut, Settings, History, Wallet, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import { getXpForLevel, getXpProgressForLevel } from './useWallet';
import GameHistoryView from './GameHistoryView';

export default function ProfileModal({ user, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ deposits: 0, wagered: 0, withdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const level = user?.level || 1;
  const xpProgress = getXpProgressForLevel(level, user?.xp || 0);

  useEffect(() => {
    const fetchStats = async () => {
      const transactions = await base44.entities.Transaction.filter({ user_email: user?.email });
      const deposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const wagered = transactions
        .filter(t => ['case_purchase', 'battle_entry', 'coinflip_bet', 'crash_bet'].includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      const withdrawals = transactions
        .filter(t => t.type === 'item_sell')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats({ deposits, wagered, withdrawals });
      setLoading(false);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Game History' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    onClose();
    base44.auth.logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-b from-[#1a1a2e] to-[#16161f] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Profile</h2>
              <p className="text-white/40 text-sm">Your account overview</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 shadow-lg shadow-violet-500/30">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-3 mb-1">
                <h3 className="text-2xl font-bold text-white">{user?.full_name || 'Player'}</h3>
                <span className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold text-sm">Level {level}</span>
              </div>
              <p className="text-sm text-white/40 mb-3">{user?.email}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-400 text-lg">💰</span>
                  <span className="text-yellow-400 font-bold">${(user?.balance || 0).toLocaleString()}</span>
                </div>
                <span className="text-white/20">•</span>
                <div className="text-sm text-white/50">{(user?.xp || 0).toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Wager Progress</span>
              <span className="text-sm font-bold text-violet-400">{Math.round(xpProgress)}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-700 shadow-lg shadow-violet-500/50"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              {getXpForLevel(level).toLocaleString()} XP needed for next level
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 grid grid-cols-4 bg-white/[0.02]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-xs lg:text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-violet-500 text-white bg-white/[0.05]'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Deposits</p>
                    <ArrowDown className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-green-400 flex items-baseline gap-1">
                    ${loading ? '...' : stats.deposits.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/30 mt-2">Total added</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Wagered</p>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-400 flex items-baseline gap-1">
                    ${loading ? '...' : stats.wagered.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/30 mt-2">Total bet</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Withdrawn</p>
                    <ArrowUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-purple-400 flex items-baseline gap-1">
                    ${loading ? '...' : stats.withdrawals.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/30 mt-2">Total sold</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Account Status</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-white/60 text-sm">Member Since</span>
                    <span className="text-white font-medium">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs font-semibold">Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Game history coming soon</p>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Transaction history coming soon</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Settings coming soon</p>
            </div>
          )}
        </div>

        {/* Footer - Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}