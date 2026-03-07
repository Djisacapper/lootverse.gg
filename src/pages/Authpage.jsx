import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

import {
  Box, Swords, Coins, TrendingUp, Gift, Award, Users,
  Menu, X, ChevronLeft, ChevronRight, Wallet,
  Shield, MessageCircle, Home,
} from 'lucide-react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; }
body, #root { font-family: 'Nunito', sans-serif; background: #04000a; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; } 95%{ opacity:1; }
  100%{ top:100%; opacity:0; }
}
.sidebar-scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.15),transparent);
  animation:scan 8s linear infinite; pointer-events:none;
}

@keyframes logo-pulse {
  0%,100%{ box-shadow: 0 0 0 0 rgba(251,191,36,.3); }
  50%    { box-shadow: 0 0 0 6px rgba(251,191,36,0); }
}
.logo-pulse { animation: logo-pulse 2.5s ease-in-out infinite; }

@keyframes xp-shimmer {
  0%  { background-position: -200% center; }
  100%{ background-position: 200% center; }
}
.xp-bar {
  background: linear-gradient(90deg, #a855f7, #fbbf24, #f59e0b, #a855f7);
  background-size: 200% auto;
  animation: xp-shimmer 3s linear infinite;
}

@keyframes nav-glow {
  0%,100%{ box-shadow: inset 0 0 0 0 rgba(251,191,36,0); }
  50%    { box-shadow: inset 0 0 20px rgba(251,191,36,.04); }
}
.nav-active { animation: nav-glow 3s ease-in-out infinite; }

@keyframes gold-pulse-border {
  0%,100%{ border-color: rgba(251,191,36,.15); }
  50%    { border-color: rgba(251,191,36,.35); }
}
.balance-chip { animation: gold-pulse-border 3s ease-in-out infinite; }

@keyframes chat-btn-pulse {
  0%,100%{ box-shadow: 0 0 0 0 rgba(168,85,247,.5); }
  50%    { box-shadow: 0 0 0 10px rgba(168,85,247,0); }
}
.chat-btn-pulse { animation: chat-btn-pulse 2s ease-in-out infinite; }

.nav-link {
  display: flex; align-items: center; gap: 10px;
  margin: 1px 8px; border-radius: 10px; cursor: pointer;
  text-decoration: none; transition: all .22s ease;
  border: 1px solid transparent;
  font-family: 'Nunito', sans-serif;
  font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,.35);
  position: relative; overflow: hidden;
}
.nav-link:hover {
  color: rgba(251,191,36,.9);
  background: rgba(251,191,36,.06);
  border-color: rgba(251,191,36,.12);
}
.nav-link.active {
  color: #fbbf24;
  background: linear-gradient(90deg,rgba(251,191,36,.12),rgba(168,85,247,.06));
  border-color: rgba(251,191,36,.25);
}
.nav-link.active::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
  background: linear-gradient(to bottom, #fbbf24, #a855f7);
  border-radius: 0 2px 2px 0;
}
.nav-link.collapsed { justify-content: center; margin: 2px 6px; padding: 10px 0; }
.nav-link.expanded  { padding: 9px 12px; }

.sidebar-section-label {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  text-transform: uppercase; color: rgba(251,191,36,.25);
  padding: 0 16px; margin: 14px 0 4px;
  font-family: 'Nunito', sans-serif;
}

/* Stable avatar — reserves space before image loads, no layout jump */
.lv-avatar {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; overflow: hidden; flex-shrink: 0;
  position: relative;
}
.lv-avatar img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover;
  /* Fade in once loaded — never flashes white or disappears */
  opacity: 0; transition: opacity 0.2s ease;
}
.lv-avatar img.loaded { opacity: 1; }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(251,191,36,.15); border-radius: 3px; }
::-webkit-scrollbar-track { background: transparent; }
`;

const NAV_SECTIONS = (role) => [
  {
    label: 'Games',
    items: [
      { name: 'Home',     icon: Home,       page: 'Home'     },
      { name: 'Battles',  icon: Swords,     page: 'Battles'  },
      { name: 'Cases',    icon: Box,        page: 'Cases'    },
      { name: 'Coinflip', icon: Coins,      page: 'Coinflip' },
      { name: 'Crash',    icon: TrendingUp, page: 'Crash'    },
    ],
  },
  {
    label: 'Earn',
    items: [
      { name: 'Referrals',   icon: Users,  page: 'Referrals'   },
      { name: 'Rewards',     icon: Gift,   page: 'Rewards'     },
      { name: 'Leaderboard', icon: Award,  page: 'Leaderboard' },
    ],
  },
  ...(role === 'admin' ? [{
    label: 'Staff',
    items: [{ name: 'Admin', icon: Shield, page: 'Admin' }],
  }] : []),
];

function CoinIcon({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 8px rgba(251,191,36,.55)',
    }}>
      <span style={{ fontSize: size * 0.45, fontWeight: 900, color: '#000' }}>$</span>
    </div>
  );
}

/* ── Stable Avatar component ──────────────────────────────────────
   Uses a persistent <img> that fades in once loaded. The fallback
   initial letter sits underneath and is only visible before load.
   Critically: we never unmount/remount the img when user state
   updates — the src only changes if the actual avatar_url changes.
────────────────────────────────────────────────────────────────── */
const StableAvatar = React.memo(({ avatarUrl, name, size, fontSize, gradient, boxShadow, onClick, style = {} }) => {
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevUrl = useRef(avatarUrl);

  // Only reset loaded state when the URL genuinely changes
  useEffect(() => {
    if (prevUrl.current !== avatarUrl) {
      prevUrl.current = avatarUrl;
      setImgLoaded(false);
    }
  }, [avatarUrl]);

  // If img is already complete when mounted (browser cache), mark loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, []);

  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: gradient || 'linear-gradient(135deg,#fbbf24,#a855f7)',
        border: 'none', cursor: onClick ? 'pointer' : 'default', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 900, color: '#000',
        boxShadow: boxShadow || '0 0 12px rgba(251,191,36,.4)',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        ...style,
      }}
    >
      {/* Fallback initial — always rendered underneath */}
      <span style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>{initial}</span>

      {/* Avatar image — fades in over the initial, never causes a flash */}
      {avatarUrl && (
        <img
          ref={imgRef}
          src={avatarUrl}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 2,
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(false)}
        />
      )}
    </button>
  );
});

export default function Layout({ children, currentPageName }) {
  const [user,             setUser]             = useState(null);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen,      setProfileOpen]      = useState(false);
  const [chatOpen,         setChatOpen]         = useState(true);

  // FIX: Track previous user data in a ref so we only call setUser
  // when something meaningful actually changed. This stops the 3-second
  // polling from triggering re-renders (and avatar blinks) on every tick.
  const userRef = useRef(null);

  const reloadUser = () => base44.auth.me().then(fresh => {
    const prev = userRef.current;
    if (
      !prev ||
      prev.balance    !== fresh.balance    ||
      prev.xp         !== fresh.xp         ||
      prev.level      !== fresh.level      ||
      prev.avatar_url !== fresh.avatar_url ||
      prev.full_name  !== fresh.full_name  ||
      prev.role       !== fresh.role       ||
      prev.email      !== fresh.email
    ) {
      userRef.current = fresh;
      setUser(fresh);
    }
  }).catch(() => {});

  useEffect(() => {
    reloadUser();
    const interval = setInterval(reloadUser, 3000);
    const unsub = base44.entities.User.subscribe(e => { if (e.type === 'update') reloadUser(); });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [currentPageName]);

  const xpProgress = user ? ((user.xp || 0) % 500) / 5 : 0;
  const level      = user?.level || 1;
  const sidebarW   = sidebarCollapsed ? 60 : 210;

  /* ── Sidebar inner ── */
  const SidebarInner = ({ collapsed }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative', overflow:'hidden' }}>
      <div className="sidebar-scan" />

      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 0' : '16px 18px',
        borderBottom: '1px solid rgba(251,191,36,.08)',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
      }}>
        <Link to={createPageUrl('Home')} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div className="logo-pulse" style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#fbbf24,#f59e0b,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(251,191,36,.35)',
          }}>
            <Box style={{ width: 18, height: 18, color: '#000' }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{
                fontSize: 14, fontWeight: 900, letterSpacing: '.18em',
                background: 'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>LOOTVERSE</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.2)', marginTop: 1 }}>
                PLAY · WIN · EARN
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0 12px' }}>
        {NAV_SECTIONS(user?.role).map(section => (
          <div key={section.label}>
            {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
            {collapsed  && <div style={{ height: 12 }} />}
            {section.items.map(item => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={collapsed ? item.name : undefined}
                  className={`nav-link ${collapsed ? 'collapsed' : 'expanded'} ${active ? 'active nav-active' : ''}`}
                >
                  <item.icon style={{
                    width: 16, height: 16, flexShrink: 0,
                    color: active ? '#fbbf24' : 'rgba(255,255,255,.3)',
                    transition: 'color .22s',
                  }} />
                  {!collapsed && item.name}
                  {!collapsed && active && (
                    <div style={{
                      marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                      background: '#a855f7', boxShadow: '0 0 6px #a855f7',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User card — bottom of sidebar */}
      {user && !collapsed && (
        <div style={{
          margin: '0 10px 12px', padding: '10px 12px', borderRadius: 12,
          background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.1)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
            <StableAvatar
              avatarUrl={user.avatar_url}
              name={user.full_name || user.email}
              size={30} fontSize={11}
              onClick={() => setProfileOpen(true)}
            />
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.full_name || user.email?.split('@')[0] || 'Player'}
              </div>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(251,191,36,.5)' }}>Level {level}</div>
            </div>
            <div style={{
              padding:'2px 7px', borderRadius:100, fontSize:9, fontWeight:800,
              background:'rgba(168,85,247,.15)', border:'1px solid rgba(168,85,247,.3)',
              color:'#c084fc',
            }}>Lv{level}</div>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
            <div className="xp-bar" style={{ height:'100%', width:`${xpProgress}%`, borderRadius:99, transition:'width .5s' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,.2)' }}>XP Progress</span>
            <span style={{ fontSize:8, fontWeight:700, color:'rgba(251,191,36,.4)' }}>{Math.round(xpProgress)}%</span>
          </div>
        </div>
      )}

      {/* Collapsed avatar */}
      {user && collapsed && (
        <div style={{ display:'flex', justifyContent:'center', paddingBottom:14 }}>
          <StableAvatar
            avatarUrl={user.avatar_url}
            name={user.full_name || user.email}
            size={32} fontSize={11}
            onClick={() => setProfileOpen(true)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#04000a', display:'flex', fontFamily:'Nunito,sans-serif' }}>
      <style>{CSS}</style>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: 'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
        borderRight: '1px solid rgba(251,191,36,.08)',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'none',
      }} className="lv-sidebar">
        <SidebarInner collapsed={sidebarCollapsed} />
        <button onClick={() => setSidebarCollapsed(v => !v)} style={{
          position:'absolute', right:-12, top:68,
          width:24, height:24, borderRadius:'50%',
          background:'#0e0020', border:'1px solid rgba(251,191,36,.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', zIndex:50, color:'rgba(251,191,36,.5)',
        }}>
          {sidebarCollapsed
            ? <ChevronRight style={{ width:12, height:12 }} />
            : <ChevronLeft  style={{ width:12, height:12 }} />}
        </button>
      </aside>

      {/* ── Desktop Top Header ── */}
      <header style={{
        display: 'none',
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: sidebarW, height: 54,
        background: 'linear-gradient(90deg,#08001a,#0a0015)',
        borderBottom: '1px solid rgba(251,191,36,.08)',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        transition: 'left .3s cubic-bezier(.4,0,.2,1)',
      }} className="lv-header">

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ height:18, width:2, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)', opacity:.6 }} />
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.2)', letterSpacing:'.1em', textTransform:'uppercase' }}>
            {currentPageName || ''}
          </span>
        </div>

        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display:'flex', alignItems:'center', gap:7, padding:'6px 16px', borderRadius:10,
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              textDecoration:'none',
              boxShadow:'0 0 20px rgba(251,191,36,.35)',
              transition:'transform .2s, box-shadow .2s',
            }}>
              <Wallet style={{ width:14, height:14, color:'#000' }} />
              <span style={{ fontSize:12, fontWeight:900, color:'#000', letterSpacing:'.04em' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip" style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:10,
            background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.15)',
          }}>
            <CoinIcon size={16} />
            <span style={{ fontSize:14, fontWeight:900, color:'#fbbf24', minWidth:50 }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {/* ── Mobile Header ── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50, height:54,
        background:'linear-gradient(90deg,#08001a,#0a0015)',
        borderBottom:'1px solid rgba(251,191,36,.08)',
        display:'flex', alignItems:'center', padding:'0 14px', gap:10,
      }} className="lv-mobile-header">
        <button onClick={() => setMobileOpen(v => !v)} style={{
          width:32, height:32, borderRadius:9,
          background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'rgba(251,191,36,.7)', cursor:'pointer',
        }}>
          {mobileOpen ? <X style={{ width:15, height:15 }} /> : <Menu style={{ width:15, height:15 }} />}
        </button>

        <Link to={createPageUrl('Home')} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{
            width:28, height:28, borderRadius:8, flexShrink:0,
            background:'linear-gradient(135deg,#fbbf24,#a855f7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 14px rgba(251,191,36,.4)',
          }}>
            <Box style={{ width:14, height:14, color:'#000' }} />
          </div>
          <span style={{
            fontSize:12, fontWeight:900, letterSpacing:'.15em',
            background:'linear-gradient(90deg,#fbbf24,#c084fc)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>LOOTVERSE</span>
        </Link>

        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8,
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              textDecoration:'none', boxShadow:'0 0 12px rgba(251,191,36,.3)',
            }}>
              <Wallet style={{ width:12, height:12, color:'#000' }} />
              <span style={{ fontSize:11, fontWeight:900, color:'#000' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip" style={{
            display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8,
            background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.15)',
          }}>
            <CoinIcon size={13} />
            <span style={{ fontSize:11, fontWeight:900, color:'#fbbf24' }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{
            position:'absolute', left:0, top:0, bottom:0, width:240,
            background:'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
            borderRight:'1px solid rgba(251,191,36,.1)',
            paddingTop:54, display:'flex', flexDirection:'column', overflow:'hidden',
          }}>
            <div style={{ position:'relative', overflow:'hidden', flex:1 }}>
              <div className="sidebar-scan" />
              <nav style={{ padding:'10px 0', overflowY:'auto', height:'100%' }}>
                {NAV_SECTIONS(user?.role).map(section => (
                  <div key={section.label}>
                    <div className="sidebar-section-label">{section.label}</div>
                    {section.items.map(item => {
                      const active = currentPageName === item.page;
                      return (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          className={`nav-link expanded ${active ? 'active nav-active' : ''}`}
                        >
                          <item.icon style={{ width:16, height:16, flexShrink:0, color: active ? '#fbbf24' : 'rgba(255,255,255,.3)' }} />
                          {item.name}
                          {active && <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 6px #a855f7' }} />}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile bottom user strip */}
            {user && (
              <div style={{ margin:'0 10px 12px', padding:'10px 12px', borderRadius:12, background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <StableAvatar
                    avatarUrl={user.avatar_url}
                    name={user.full_name || user.email}
                    size={28} fontSize={10}
                    onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
                  />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {user.full_name || user.email?.split('@')[0] || 'Player'}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(251,191,36,.4)', fontWeight:700 }}>Level {level}</div>
                  </div>
                  <div style={{ padding:'2px 7px', borderRadius:100, fontSize:9, fontWeight:800, background:'rgba(168,85,247,.15)', border:'1px solid rgba(168,85,247,.3)', color:'#c084fc' }}>Lv{level}</div>
                </div>
                <div style={{ height:3, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                  <div className="xp-bar" style={{ height:'100%', width:`${xpProgress}%`, borderRadius:99 }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:8, color:'rgba(255,255,255,.2)', fontWeight:700 }}>XP</span>
                  <span style={{ fontSize:8, color:'rgba(251,191,36,.4)', fontWeight:700 }}>{Math.round(xpProgress)}%</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {profileOpen && user && <ProfileModal user={user} onClose={() => setProfileOpen(false)} />}

      {/* ── Main ── */}
      <div style={{ display:'flex', flex:1, minHeight:'100vh', paddingTop:54, marginLeft: sidebarW, transition:'margin-left .3s cubic-bezier(.4,0,.2,1)' }} className="lv-main">
        <main style={{ flex:1, minWidth:0, overflowY:'auto' }}>
          <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 20px 40px' }}>
            {children}
          </div>
        </main>

        {/* Chat panel */}
        <aside style={{
          display:'none', flexShrink:0,
          height:'calc(100vh - 54px)', position:'sticky', top:54,
          background:'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
          borderLeft:'1px solid rgba(251,191,36,.07)',
          transition:'width .3s cubic-bezier(.4,0,.2,1)',
          overflow:'hidden', width: chatOpen ? 260 : 0,
        }} className="lv-chat">
          <LiveChat onClose={() => setChatOpen(false)} />
        </aside>

        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} style={{
            display:'none', position:'fixed', bottom:20, right:20, zIndex:50,
            width:46, height:46, borderRadius:'50%', border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#a855f7,#7c3aed)',
            alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 20px rgba(168,85,247,.5)',
          }} className="lv-chat-btn chat-btn-pulse">
            <MessageCircle style={{ width:20, height:20, color:'#fff' }} />
          </button>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lv-sidebar       { display: flex !important; flex-direction: column; }
          .lv-header        { display: flex !important; }
          .lv-mobile-header { display: none !important; }
          .lv-main          { margin-left: ${sidebarW}px !important; }
          .lv-chat          { display: flex !important; flex-direction: column; }
          .lv-chat-btn      { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .lv-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}