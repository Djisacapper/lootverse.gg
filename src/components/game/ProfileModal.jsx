import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, LogOut, Settings, History, Wallet } from 'lucide-react';
import { getXpForLevel, getXpProgressForLevel } from './useWallet';

export default function ProfileModal({ user, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const level = user?.level || 1;
  const xpProgress = getXpProgressForLevel(level, user?.xp || 0);

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
    <div className="fixed inset-0 z-50 bg-black/50 lg:bg-transparent lg:fixed lg:inset-auto lg:top-14 lg:right-0 lg:bottom-auto lg:w-96 lg:h-auto lg:rounded-b-lg lg:rounded-r-lg">
      {/* Mobile overlay */}
      <div className="lg:hidden absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full lg:h-auto lg:max-h-[calc(100vh-56px)] bg-[#16161f] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-bold text-white">{user?.full_name || 'Player'}</h3>
                <span className="text-violet-400 font-semibold">#{level}</span>
              </div>
              <p className="text-sm text-white/40 mb-2">{user?.email}</p>
              <div className="flex items-center gap-2">
                <div className="text-yellow-400 text-sm font-semibold">${(user?.balance || 0).toLocaleString()}</div>
                <span className="text-white/25">•</span>
                <div className="text-sm text-white/40">{(user?.xp || 0).toLocaleString()} XP</div>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">Wager</span>
              <span className="text-xs text-white/40">{Math.round(xpProgress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-1">
              {getXpForLevel(level).toLocaleString()} XP to level up
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Deposits</p>
                  <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                    <span className="text-yellow-400">💰</span>
                    {(user?.total_deposits || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Wagered</p>
                  <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                    <span className="text-yellow-400">💰</span>
                    {(user?.total_wagered || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Withdrawals</p>
                  <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                    <span className="text-yellow-400">💰</span>
                    {(user?.total_withdrawals || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/40 text-xs mb-3 font-semibold">Account Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Member Since</span>
                    <span className="text-white">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Status</span>
                    <span className="text-green-400 font-semibold">Active</span>
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