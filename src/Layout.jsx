import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LiveChat from './components/game/LiveChat';
import ProfileModal from './components/game/ProfileModal';
import {
  Swords, Coins, TrendingUp, Gift, Award, Users,
  Menu, X, ChevronLeft, ChevronRight, Wallet,
  Shield, MessageCircle, Home, ScrollText, Box,
} from 'lucide-react';

const LOGO_URL = 'https://i.imgur.com/kdQd9ES.png';

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
  background:linear-gradient(90deg,transparent,rgba(168,85,247,.15),transparent);
  animation:scan 8s linear infinite; pointer-events:none;
}

@keyframes logo-pulse {
  0%,100%{ box-shadow: 0 0 0 0 rgba(168,85,247,.4); }
  50%    { box-shadow: 0 0 0 6px rgba(168,85,247,0); }
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
  0%,100%{ box-shadow: inset 0 0 0 0 rgba(168,85,247,0); }
  50%    { box-shadow: inset 0 0 20px rgba(168,85,247,.04); }
}
.nav-active { animation: nav-glow 3s ease-in-out infinite; }

@keyframes gold-pulse-border {
  0%,100%{ border-color: rgba(168,85,247,.15); }
  50%    { border-color: rgba(168,85,247,.35); }
}
.balance-chip { animation: gold-pulse-border 3s ease-in-out infinite; }

@keyframes chat-btn-pulse {
  0%,100%{ box-shadow: 0 0 0 0 rgba(168,85,247,.5); }
  50%    { box-shadow: 0 0 0 10px rgba(168,85,247,0); }
}
.chat-btn-pulse { animation: chat-btn-pulse 2s ease-in-out infinite; }

/* Mobile chat slide-up sheet */
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.mobile-chat-sheet {
  animation: slideUp 0.28s cubic-bezier(.4,0,.2,1) forwards;
}

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
  color: rgba(192,132,252,.9);
  background: rgba(168,85,247,.06);
  border-color: rgba(168,85,247,.12);
}
.nav-link.active {
  color: #c084fc;
  background: linear-gradient(90deg,rgba(168,85,247,.12),rgba(251,191,36,.06));
  border-color: rgba(168,85,247,.25);
}
.nav-link.active::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
  background: linear-gradient(to bottom, #c084fc, #fbbf24);
  border-radius: 0 2px 2px 0;
}
.nav-link.collapsed { justify-content: center; margin: 2px 6px; padding: 10px 0; }
.nav-link.expanded  { padding: 9px 12px; }

.sidebar-section-label {
  font-size: 9px; font-weight: 800; letter-spacing: .18em;
  text-transform: uppercase; color: rgba(192,132,252,.25);
  padding: 0 16px; margin: 14px 0 4px;
  font-family: 'Nunito', sans-serif;
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,.15); border-radius: 3px; }
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
  {
    label: 'Legal',
    items: [
      { name: 'Terms of Service', icon: ScrollText, page: 'TermsOfService' },
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

const LogoImg = React.memo(function LogoImg({ size, borderRadius }) {
  return (
    <div
      className="logo-pulse"
      style={{
        width: size, height: size, borderRadius, flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(168,85,247,.5)',
        background: '#0e0020',
      }}
    >
      <img
        src={LOGO_URL}
        alt="Amethyst.GG"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
});

const StableAvatar = React.memo(({ avatarUrl, name, size, fontSize, onClick, style = {} }) => {
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevUrl = useRef(avatarUrl);

  useEffect(() => {
    if (prevUrl.current !== avatarUrl) {
      prevUrl.current = avatarUrl;
      setImgLoaded(false);
    }
  }, [avatarUrl]);

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
        background: 'linear-gradient(135deg,#a855f7,#fbbf24)',
        border: 'none', cursor: onClick ? 'pointer' : 'default', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 900, color: '#fff',
        boxShadow: '0 0 12px rgba(168,85,247,.4)',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        ...style,
      }}
    >
      <span style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>{initial}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Derive the best display name from a user object.
// Priority: username > full_name > email prefix > 'Player'
// This is the single source of truth — used in sidebar + mobile strip.
// ─────────────────────────────────────────────────────────────────────────────
function getDisplayName(user) {
  if (!user) return 'Player';
  if (user.is_anonymous) return `Anonymous #${user.id?.slice(-4) || '????'}`;
  return user.username || user.full_name || user.email?.split('@')[0] || 'Player';
}

export default function Layout({ children, currentPageName }) {
  const [user,             setUser]             = useState(null);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen,      setProfileOpen]      = useState(false);
  // Desktop chat panel
  const [chatOpen,         setChatOpen]         = useState(true);
  // Mobile chat sheet (bottom drawer)
  const [mobileChatOpen,   setMobileChatOpen]   = useState(false);

  const userRef = useRef(null);

  // ── Reload user from API, only trigger re-render when something changed ──
  const reloadUser = () => base44.auth.me().then(fresh => {
    const prev = userRef.current;
    if (
      !prev ||
      prev.balance    !== fresh.balance    ||
      prev.xp         !== fresh.xp         ||
      prev.level      !== fresh.level      ||
      prev.avatar_url !== fresh.avatar_url ||
      prev.username   !== fresh.username   ||   // ← now watching username
      prev.full_name  !== fresh.full_name  ||
      prev.is_anonymous !== fresh.is_anonymous ||
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
    const unsub = base44.entities.User.subscribe(e => {
      if (e.type === 'update') reloadUser();
    });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [currentPageName]);

  // ── When ProfileSettings calls onSaved, merge updated fields immediately ──
  // No waiting for the next poll — the sidebar updates instantly.
  const handleProfileSaved = (updatedUser) => {
    if (!updatedUser) { reloadUser(); return; }
    const merged = { ...userRef.current, ...updatedUser };
    userRef.current = merged;
    setUser(merged);
  };

  const xpProgress = user ? ((user.xp || 0) % 500) / 5 : 0;
  const level      = user?.level || 1;
  const displayName = getDisplayName(user);
  const sidebarW   = sidebarCollapsed ? 60 : 210;

  // ── User card shared between desktop sidebar + mobile drawer ──────────────
  const UserCard = ({ compact = false }) => (
    <div style={{
      margin: '0 10px 12px', padding: compact ? '8px 10px' : '10px 12px', borderRadius: 12,
      background: 'rgba(168,85,247,.05)', border: '1px solid rgba(168,85,247,.1)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: compact ? 7 : 9, marginBottom: 8 }}>
        <StableAvatar
          avatarUrl={user.avatar_url}
          name={displayName}
          size={compact ? 26 : 30}
          fontSize={10}
          onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* ← Shows username, not email */}
          <div style={{
            fontSize: 11, fontWeight: 800,
            color: 'rgba(255,255,255,.8)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(192,132,252,.5)' }}>Level {level}</div>
        </div>
        <div style={{
          padding: '2px 7px', borderRadius: 100, fontSize: 9, fontWeight: 800,
          background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.3)',
          color: '#c084fc',
        }}>Lv{level}</div>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div className="xp-bar" style={{ height: '100%', width: `${xpProgress}%`, borderRadius: 99, transition: 'width .5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>XP Progress</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(192,132,252,.4)' }}>{Math.round(xpProgress)}%</span>
      </div>
    </div>
  );

  const SidebarInner = ({ collapsed }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', position:'relative', overflow:'hidden' }}>
      <div className="sidebar-scan" />

      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 0' : '16px 18px',
        borderBottom: '1px solid rgba(168,85,247,.08)',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
      }}>
        <Link to={createPageUrl('Home')} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <LogoImg size={36} borderRadius={10} />
          {!collapsed && (
            <div>
              <div style={{
                fontSize: 14, fontWeight: 900, letterSpacing: '.12em',
                background: 'linear-gradient(90deg,#c084fc,#a855f7 40%,#fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Amethyst.GG</div>
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
                    color: active ? '#c084fc' : 'rgba(255,255,255,.3)',
                    transition: 'color .22s',
                  }} />
                  {!collapsed && item.name}
                  {!collapsed && active && (
                    <div style={{
                      marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                      background: '#fbbf24', boxShadow: '0 0 6px #fbbf24',
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User card */}
      {user && !collapsed && <UserCard />}

      {/* Collapsed avatar */}
      {user && collapsed && (
        <div style={{ display:'flex', justifyContent:'center', paddingBottom: 14 }}>
          <StableAvatar
            avatarUrl={user.avatar_url}
            name={displayName}
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

      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: 'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
        borderRight: '1px solid rgba(168,85,247,.08)',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'none',
      }} className="lv-sidebar">
        <SidebarInner collapsed={sidebarCollapsed} />
        <button onClick={() => setSidebarCollapsed(v => !v)} style={{
          position:'absolute', right:-12, top:68,
          width:24, height:24, borderRadius:'50%',
          background:'#0e0020', border:'1px solid rgba(168,85,247,.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', zIndex:50, color:'rgba(192,132,252,.5)',
        }}>
          {sidebarCollapsed
            ? <ChevronRight style={{ width:12, height:12 }} />
            : <ChevronLeft  style={{ width:12, height:12 }} />}
        </button>
      </aside>

      {/* ── Desktop Top Header ─────────────────────────────────────── */}
      <header style={{
        display: 'none',
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: sidebarW, height: 54,
        background: 'linear-gradient(90deg,#08001a,#0a0015)',
        borderBottom: '1px solid rgba(168,85,247,.08)',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        transition: 'left .3s cubic-bezier(.4,0,.2,1)',
      }} className="lv-header">

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ height:18, width:2, borderRadius:2, background:'linear-gradient(to bottom,#c084fc,#fbbf24)', opacity:.6 }} />
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.2)', letterSpacing:'.1em', textTransform:'uppercase' }}>
            {currentPageName || ''}
          </span>
        </div>

        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display:'flex', alignItems:'center', gap:7, padding:'6px 16px', borderRadius:10,
              background:'linear-gradient(135deg,#a855f7,#7c3aed)',
              textDecoration:'none',
              boxShadow:'0 0 20px rgba(168,85,247,.35)',
            }}>
              <Wallet style={{ width:14, height:14, color:'#fff' }} />
              <span style={{ fontSize:12, fontWeight:900, color:'#fff', letterSpacing:'.04em' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip" style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:10,
            background:'rgba(168,85,247,.07)', border:'1px solid rgba(168,85,247,.15)',
          }}>
            <CoinIcon size={16} />
            <span style={{ fontSize:14, fontWeight:900, color:'#fbbf24', minWidth:50 }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {/* ── Mobile Header ──────────────────────────────────────────── */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50, height:54,
        background:'linear-gradient(90deg,#08001a,#0a0015)',
        borderBottom:'1px solid rgba(168,85,247,.08)',
        display:'flex', alignItems:'center', padding:'0 14px', gap:10,
      }} className="lv-mobile-header">

        <button onClick={() => setMobileOpen(v => !v)} style={{
          width:32, height:32, borderRadius:9,
          background:'rgba(168,85,247,.08)', border:'1px solid rgba(168,85,247,.15)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'rgba(192,132,252,.7)', cursor:'pointer',
        }}>
          {mobileOpen ? <X style={{ width:15, height:15 }} /> : <Menu style={{ width:15, height:15 }} />}
        </button>

        <Link to={createPageUrl('Home')} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{
            width:28, height:28, borderRadius:8, flexShrink:0,
            overflow:'hidden', boxShadow:'0 0 14px rgba(168,85,247,.5)', background:'#0e0020',
          }}>
            <img src={LOGO_URL} alt="Amethyst.GG" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
          <span style={{
            fontSize:12, fontWeight:900, letterSpacing:'.12em',
            background:'linear-gradient(90deg,#c084fc,#fbbf24)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>Amethyst.GG</span>
        </Link>

        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8,
              background:'linear-gradient(135deg,#a855f7,#7c3aed)',
              textDecoration:'none', boxShadow:'0 0 12px rgba(168,85,247,.4)',
            }}>
              <Wallet style={{ width:12, height:12, color:'#fff' }} />
              <span style={{ fontSize:11, fontWeight:900, color:'#fff' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip" style={{
            display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8,
            background:'rgba(168,85,247,.07)', border:'1px solid rgba(168,85,247,.15)',
          }}>
            <CoinIcon size={13} />
            <span style={{ fontSize:11, fontWeight:900, color:'#fbbf24' }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}

        {/* ── Mobile Chat Button (in header) ── */}
        <button
          onClick={() => setMobileChatOpen(v => !v)}
          style={{
            width:32, height:32, borderRadius:9, border:'none', cursor:'pointer',
            background: mobileChatOpen ? 'rgba(168,85,247,.25)' : 'rgba(168,85,247,.08)',
            borderWidth:1, borderStyle:'solid',
            borderColor: mobileChatOpen ? 'rgba(168,85,247,.5)' : 'rgba(168,85,247,.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color: mobileChatOpen ? '#c084fc' : 'rgba(192,132,252,.6)',
            flexShrink: 0,
          }}
          className={!mobileChatOpen ? 'chat-btn-pulse' : ''}
          title="Open Chat"
        >
          <MessageCircle style={{ width:15, height:15 }} />
        </button>
      </header>

      {/* ── Mobile Nav Drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{
            position:'absolute', left:0, top:0, bottom:0, width:240,
            background:'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
            borderRight:'1px solid rgba(168,85,247,.1)',
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
                          <item.icon style={{ width:16, height:16, flexShrink:0, color: active ? '#c084fc' : 'rgba(255,255,255,.3)' }} />
                          {item.name}
                          {active && <div style={{ marginLeft:'auto', width:5, height:5, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 6px #fbbf24' }} />}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile user card — shows username, not email */}
            {user && <UserCard compact />}
          </aside>
        </div>
      )}

      {/* ── Mobile Chat Sheet (bottom slide-up) ───────────────────── */}
      {mobileChatOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:60 }} className="lv-mobile-chat-overlay">
          {/* Dim backdrop — tap to close */}
          <div
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)' }}
            onClick={() => setMobileChatOpen(false)}
          />
          <div
            className="mobile-chat-sheet"
            style={{
              position:'absolute', left:0, right:0, bottom:0,
              height:'75vh',
              background:'linear-gradient(180deg,#0d0020 0%,#08001a 100%)',
              borderTop:'1px solid rgba(168,85,247,.15)',
              borderRadius:'20px 20px 0 0',
              display:'flex', flexDirection:'column',
              overflow:'hidden',
              boxShadow:'0 -8px 40px rgba(168,85,247,.15)',
            }}
          >
            {/* Drag handle + header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 16px 10px',
              borderBottom:'1px solid rgba(168,85,247,.08)',
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <MessageCircle style={{ width:14, height:14, color:'#c084fc' }} />
                <span style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.7)', letterSpacing:'.06em' }}>LIVE CHAT</span>
              </div>
              <button
                onClick={() => setMobileChatOpen(false)}
                style={{
                  width:28, height:28, borderRadius:8, border:'none', cursor:'pointer',
                  background:'rgba(255,255,255,.05)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'rgba(255,255,255,.4)',
                }}
              >
                <X style={{ width:14, height:14 }} />
              </button>
            </div>

            {/* LiveChat fills the rest */}
            <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <LiveChat onClose={() => setMobileChatOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Modal ─────────────────────────────────────────── */}
      {profileOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={handleProfileSaved}  // ← instant local update, no poll wait
        />
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div style={{
        display:'flex', flex:1, minHeight:'100vh',
        paddingTop:54,
        marginLeft: sidebarW,
        transition:'margin-left .3s cubic-bezier(.4,0,.2,1)',
      }} className="lv-main">
        <main style={{ flex:1, minWidth:0, overflowY:'auto' }}>
          <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 20px 40px' }}>
            {children}
          </div>
        </main>

        {/* Desktop Chat Panel */}
        <aside style={{
          display:'none', flexShrink:0,
          height:'calc(100vh - 54px)', position:'sticky', top:54,
          background:'linear-gradient(180deg,#08001a 0%,#04000a 100%)',
          borderLeft:'1px solid rgba(168,85,247,.07)',
          transition:'width .3s cubic-bezier(.4,0,.2,1)',
          overflow:'hidden', width: chatOpen ? 260 : 0,
        }} className="lv-chat">
          <LiveChat onClose={() => setChatOpen(false)} />
        </aside>

        {/* Desktop re-open chat button */}
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
          .lv-sidebar           { display: flex !important; flex-direction: column; }
          .lv-header            { display: flex !important; }
          .lv-mobile-header     { display: none !important; }
          .lv-main              { margin-left: ${sidebarW}px !important; }
          .lv-chat              { display: flex !important; flex-direction: column; }
          .lv-chat-btn          { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .lv-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}