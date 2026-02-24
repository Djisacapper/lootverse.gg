import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import WalletBar from './components/game/WalletBar';
import {
  Box, Swords, Coins, TrendingUp, Gift, Award, Users,
  Menu, X, Home, Backpack, BarChart3, LogOut, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Cases', icon: Box, page: 'Cases' },
  { name: 'Battles', icon: Swords, page: 'Battles' },
  { name: 'Coinflip', icon: Coins, page: 'Coinflip' },
  { name: 'Crash', icon: TrendingUp, page: 'Crash' },
  { name: 'Upgrade', icon: Zap, page: 'Upgrade' },
  { name: 'Inventory', icon: Backpack, page: 'Inventory' },
  { name: 'Rewards', icon: Gift, page: 'Rewards' },
  { name: 'Leaderboard', icon: Award, page: 'Leaderboard' },
  { name: 'Referrals', icon: Users, page: 'Referrals' },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPageName]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0c0c14] border-r border-white/5 fixed h-full z-40">
        <div className="p-6 border-b border-white/5">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center glow-purple">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">LOOTVERSE</h1>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Next-Gen Cases</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }`}
              >
                <item.icon className={`w-4.5 h-4.5 ${active ? 'text-violet-400' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name || 'Player'}</p>
                <p className="text-[11px] text-white/30 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-2 text-xs text-white/30 hover:text-red-400 transition-colors w-full px-2 py-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/60 hover:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">LOOTVERSE</span>
            </Link>
          </div>
          {user && (
            <WalletBar balance={user.balance} level={user.level} xpProgress={((user.xp || 0) % 500) / 5} compact />
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0c0c14] border-r border-white/5 pt-16 overflow-y-auto">
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-violet-500/15 text-violet-300'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}