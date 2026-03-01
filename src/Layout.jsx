import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LiveChat from './components/game/LiveChat';
import ProfileModal from './components/game/ProfileModal';
import {
  Box, Swords, Coins, TrendingUp, Gift, Award, Users,
  Menu, X, Home, LogOut, Zap, ChevronLeft,
  ChevronRight, Wallet, Plus, Shield
} from 'lucide-react';

const getNavSections = (userRole) => [
  {
    label: 'GAMES',
    items: [
      { name: 'Battles', icon: Swords, page: 'Battles' },
      { name: 'Cases', icon: Box, page: 'Cases' },
      { name: 'Coinflip', icon: Coins, page: 'Coinflip' },
      { name: 'Crash', icon: TrendingUp, page: 'Crash' },
    ]
  },
  {
    label: 'REWARDS',
    items: [
      { name: 'Referrals', icon: Users, page: 'Referrals' },
      { name: 'Rewards', icon: Gift, page: 'Rewards' },
      { name: 'Leaderboard', icon: Award, page: 'Leaderboard' },
    ]
  },
  ...(userRole === 'admin' ? [{
    label: 'ADMIN',
    items: [
      { name: 'Admin Panel', icon: Shield, page: 'Admin' },
    ]
  }] : []),
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  const reloadUser = () => {
    base44.auth.me().then(setUser).catch(() => {});
  };

  useEffect(() => {
    reloadUser();
    // Poll every 3 seconds for balance/xp/avatar updates
    const interval = setInterval(reloadUser, 3000);
    // Also subscribe to User entity changes for instant updates
    const unsub = base44.entities.User.subscribe((event) => {
      if (event.type === 'update') reloadUser();
    });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPageName]);

  const xpProgress = user ? ((user.xp || 0) % 500) / 5 : 0;
  const level = user?.level || 1;

  const SidebarContent = ({ collapsed }) => (
    <>
      {/* Logo */}
      <div className={`flex items-center border-b border-[#00d9ff]/10 ${collapsed ? 'px-3 py-4 justify-center' : 'px-5 py-4'}`}>
        <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#9d4edd] flex items-center justify-center flex-shrink-0 glow-cyan group-hover:glow-cyan-lg smooth-transition">
            <Box className="w-5 h-5 text-[#0a0a15]" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-base font-bold text-[#00d9ff] tracking-widest">LOOTVERSE</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-3">
        {getNavSections(user?.role).map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[#00d9ff]/40 tracking-[0.15em] uppercase px-4 mb-1.5">{section.label}</p>
            )}
            {section.items.map((item) => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 mx-2 mb-0.5 rounded-lg smooth-transition
                    ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
                    ${active
                      ? 'bg-[#00d9ff]/15 text-[#00d9ff] border border-[#00d9ff]/30'
                      : 'text-[#a0a0b0] hover:text-[#00d9ff] hover:bg-[#00d9ff]/5 border border-transparent'
                    }`}
                >
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#ff006e]' : ''}`} />
                  {!collapsed && <span className="text-[13px] font-medium">{item.name}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff006e]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>


    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0805] via-[#1a1815] to-[#0d0c0a] flex text-[#fafaf8]">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] border-r border-[#00d9ff]/10 fixed h-full z-40 transition-all duration-300
          ${sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'}`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#242456] border border-[#00d9ff]/20 flex items-center justify-center text-[#00d9ff]/40 hover:text-[#00d9ff] smooth-transition z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Top Header Bar */}
      <div
        className={`fixed top-0 right-0 z-30 h-14 bg-gradient-to-r from-[#1a1a2e] to-[#242456] border-b border-[#00d9ff]/10 flex items-center px-4 gap-3 smooth-transition
          ${sidebarCollapsed ? 'left-[60px]' : 'left-[220px]'} hidden lg:flex`}
      >
        <div className="flex-1" />

        {/* Level + XP bar */}
        {user && (
          <div className="flex items-center gap-2.5 bg-[#1a1a2e] border border-[#00d9ff]/15 rounded-lg px-3 py-1.5 smooth-transition hover:border-[#00d9ff]/30">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00d9ff] to-[#9d4edd] flex items-center justify-center text-[10px] font-bold text-[#0a0a15] flex-shrink-0">
              {level}
            </div>
            <div className="flex flex-col gap-0.5 w-24">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00d9ff]/60">Level {level}</span>
                <span className="text-[10px] text-[#00d9ff]/40">{Math.round(xpProgress)}%</span>
              </div>
              <div className="h-1 bg-[#00d9ff]/10 rounded-full overflow-hidden w-full">
                <div
                  className="h-full bg-gradient-to-r from-[#00d9ff] to-[#9d4edd] rounded-full smooth-transition"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Balance */}
        {user && (
          <div className="flex items-center gap-1.5 bg-[#1a1a2e] border border-[#00d9ff]/15 rounded-lg pl-2 pr-1 py-1 smooth-transition hover:border-[#00d9ff]/30">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#9d4edd] flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#0a0a15]">$</span>
            </div>
            <span className="text-sm font-bold text-[#00d9ff]">{(user.balance || 0).toLocaleString()}</span>
            <Link to={createPageUrl('Deposit')}>
              <div className="ml-1 bg-[#00d9ff]/20 hover:bg-[#00d9ff]/30 smooth-transition rounded-md px-2 py-1 flex items-center gap-1 border border-[#00d9ff]/30">
                <Wallet className="w-3 h-3 text-[#00d9ff]" />
                <span className="text-[11px] font-semibold text-[#00d9ff]">Wallet</span>
              </div>
            </Link>
          </div>
        )}

        {/* Avatar */}
        {user && (
          <button
            onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#9d4edd] overflow-hidden flex items-center justify-center text-xs font-bold text-[#0a0a15] glow-cyan hover:glow-cyan-lg smooth-transition"
            title="Open profile"
          >
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : (user.full_name?.[0]?.toUpperCase() || '?')}
          </button>
        )}
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gradient-to-r from-[#1a1815] to-[#242220] border-b border-[#d4af37]/10 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#b0a89f] hover:text-[#d4af37] smooth-transition">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center glow-gold group-hover:glow-gold-lg smooth-transition">
            <Box className="w-3.5 h-3.5 text-[#0a0805]" />
          </div>
          <span className="font-bold text-[#d4af37] text-sm">LOOTVERSE</span>
        </Link>
        <div className="flex-1" />
        {user && (
          <div className="flex items-center gap-2">
            {/* Mobile level badge */}
            <div className="flex items-center gap-1.5 bg-[#1a1815] border border-[#d4af37]/15 rounded-lg px-2 py-1 smooth-transition">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center text-[9px] font-bold text-[#0a0805]">
                {level}
              </div>
              <div className="w-16 h-1.5 bg-[#d4af37]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded-full smooth-transition"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
            {/* Mobile balance */}
            <div className="flex items-center gap-1 bg-[#1a1815] border border-[#d4af37]/15 rounded-lg px-2 py-1.5 smooth-transition">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center">
                <span className="text-[8px] font-bold text-[#0a0805]">$</span>
              </div>
              <span className="text-xs font-bold text-[#d4af37]">{(user.balance || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-[#1a1815] to-[#0f0e0a] border-r border-[#d4af37]/10 pt-14 flex flex-col overflow-y-auto">
            <nav className="flex-1 py-3">
              {getNavSections(user?.role).map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="text-[10px] font-semibold text-[#d4af37]/40 tracking-[0.15em] uppercase px-4 mb-1.5">{section.label}</p>
                  {section.items.map((item) => {
                    const active = currentPageName === item.page;
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-[13px] font-medium smooth-transition
                          ${active ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30' : 'text-[#b0a89f] hover:text-[#d4af37] hover:bg-[#d4af37]/5 border border-transparent'}`}
                      >
                        <item.icon className={`w-[18px] h-[18px] ${active ? 'text-[#f4c430]' : ''}`} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Profile Modal */}
      {profileOpen && user && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}

      {/* Main Content + Chat Panel */}
      <div
        className={`flex flex-1 min-h-screen pt-14 smooth-transition
          ${sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'}`}
      >
        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-5 lg:p-6">
            {children}
          </div>
        </main>

        {/* Right Chat Panel - desktop only */}
        <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 bg-gradient-to-b from-[#1a1815]/50 to-[#0f0e0a]/50 border-l border-[#d4af37]/10">
          <LiveChat onClose={null} />
        </aside>
      </div>
    </div>
  );
}