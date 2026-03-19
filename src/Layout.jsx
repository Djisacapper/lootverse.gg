import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LiveChat from './components/game/LiveChat';
import ProfileModal from './components/game/ProfileModal';
import { Menu, X, ChevronLeft, ChevronRight, Wallet, MessageCircle } from 'lucide-react';

const LOGO_URL = 'https://i.imgur.com/kdQd9ES.png';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }
body, #root {
  font-family: 'DM Sans', sans-serif;
  background: #04000a;
}

/* ── grain overlay ── */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px;
}

/* ── xp bar — simple fill, no shimmer ── */
.xp-bar {
  background: linear-gradient(90deg, #a855f7, #fbbf24);
  transition: width 0.6s cubic-bezier(.4,0,.2,1);
}

/* ── nav links — text-forward, no icon dependency ── */
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px 7px 16px;
  margin: 1px 0;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.18s ease, background 0.18s ease;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,.28);
  position: relative;
  border-radius: 0;
  letter-spacing: 0.01em;
}

.nav-link:hover {
  color: rgba(255,255,255,.65);
  background: rgba(255,255,255,.025);
}

/* active: left bar + bright text, no background fill */
.nav-link.active {
  color: #fff;
  font-weight: 500;
  background: rgba(168,85,247,.06);
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: linear-gradient(to bottom, #fbbf24, #a855f7);
  border-radius: 0 2px 2px 0;
}

.nav-link.collapsed {
  justify-content: center;
  padding: 9px 0;
}

/* nav icon — muted, not colored */
.nav-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  opacity: 0.35;
  transition: opacity 0.18s;
}
.nav-link:hover .nav-icon,
.nav-link.active .nav-icon {
  opacity: 0.7;
}
.nav-link.active .nav-icon {
  opacity: 1;
}

/* section labels */
.sidebar-section-label {
  font-family: 'Syne', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(255,255,255,.12);
  padding: 0 16px;
  margin: 18px 0 4px;
}

/* balance chip — no pulse animation */
.balance-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
}

/* mobile chat slide-up */
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.mobile-chat-sheet {
  animation: slideUp 0.26s cubic-bezier(.4,0,.2,1) forwards;
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,.12); border-radius: 3px; }
::-webkit-scrollbar-track { background: transparent; }
`;

/* ── NAV STRUCTURE
   Using inline SVG paths for nav icons instead of Lucide stroke icons.
   These are heavier, more custom-feeling glyphs — not the generic thin-line
   icon set that every AI site defaults to.
──────────────────────────────────────────────────────────────────────────── */

/* Custom filled/semi-filled SVG icons — more character than Lucide strokes */
const NavIcons = {
  Home: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 1.5L1.5 7v7.5h4.25v-4.5h4.5v4.5H14.5V7L8 1.5z" fill="currentColor" fillOpacity=".9"/>
    </svg>
  ),
  Battles: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M2 2l4 4-1.5 1.5 1 1L7 7l2 2-1.5 1.5 1 1L10 10l4 4-1.5 1.5-4-4-1.5 1.5-1-1L7.5 10.5l-2-2L4 10 3 9l1.5-1.5-4-4L2 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Cases: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 8.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Coinflip: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4.5v7M5.5 6l2.5-1.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Crash: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M2 12L6 8l3 2 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 4H14v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Referrals: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <circle cx="5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M11 9.5c1.1.4 2 1.5 2.5 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Rewards: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 5 11l.5-3.5L3 5l3.5-.5L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 14h6M8 11.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Leaderboard: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="1.5" y="9" width="3" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="6.5" y="5.5" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="11.5" y="2" width="3" height="12.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  Terms: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Admin: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 1.5L14 4v4c0 3.3-2.5 5.8-6 6.5C2.5 13.8 2 11.3 2 8V4l6-2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const NAV_SECTIONS = (role) => [
  {
    label: 'Play',
    items: [
      { name: 'Home',     Icon: NavIcons.Home,        page: 'Home'     },
      { name: 'Battles',  Icon: NavIcons.Battles,     page: 'Battles'  },
      { name: 'Cases',    Icon: NavIcons.Cases,       page: 'Cases'    },
      { name: 'Coinflip', Icon: NavIcons.Coinflip,    page: 'Coinflip' },
      { name: 'Crash',    Icon: NavIcons.Crash,       page: 'Crash'    },
    ],
  },
  {
    label: 'Earn',
    items: [
      { name: 'Referrals',   Icon: NavIcons.Referrals,   page: 'Referrals'   },
      { name: 'Rewards',     Icon: NavIcons.Rewards,     page: 'Rewards'     },
      { name: 'Leaderboard', Icon: NavIcons.Leaderboard, page: 'Leaderboard' },
    ],
  },
  {
    label: 'Info',
    items: [
      { name: 'Terms of Service', Icon: NavIcons.Terms, page: 'TermsOfService' },
    ],
  },
  ...(role === 'admin' ? [{
    label: 'Staff',
    items: [{ name: 'Admin', Icon: NavIcons.Admin, page: 'Admin' }],
  }] : []),
];

/* ── COIN ICON — kept, it's functional not decorative ── */
function CoinIcon({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.44, fontWeight: 900, color: '#000', lineHeight: 1 }}>$</span>
    </div>
  );
}

/* ── LOGO — no pulse animation ── */
const LogoImg = React.memo(function LogoImg({ size, borderRadius }) {
  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 0 16px rgba(168,85,247,.35)',
      background: '#0e0020',
    }}>
      <img
        src={LOGO_URL}
        alt="Amethyst.GG"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
});

/* ── STABLE AVATAR ── */
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
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setImgLoaded(true);
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
        fontSize, fontWeight: 700, color: '#fff',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        fontFamily: 'Syne, sans-serif',
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
  const [chatOpen,         setChatOpen]         = useState(true);
  const [mobileChatOpen,   setMobileChatOpen]   = useState(false);
  const userRef = useRef(null);

  const reloadUser = () => base44.auth.me().then(fresh => {
    const prev = userRef.current;
    if (
      !prev ||
      prev.balance      !== fresh.balance      ||
      prev.xp           !== fresh.xp           ||
      prev.level        !== fresh.level        ||
      prev.avatar_url   !== fresh.avatar_url   ||
      prev.username     !== fresh.username     ||
      prev.full_name    !== fresh.full_name    ||
      prev.is_anonymous !== fresh.is_anonymous ||
      prev.role         !== fresh.role         ||
      prev.email        !== fresh.email
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

  const handleProfileSaved = (updatedUser) => {
    if (!updatedUser) { reloadUser(); return; }
    const merged = { ...userRef.current, ...updatedUser };
    userRef.current = merged;
    setUser(merged);
  };

  const xpProgress  = user ? ((user.xp || 0) % 500) / 5 : 0;
  const level       = user?.level || 1;
  const displayName = getDisplayName(user);
  const sidebarW    = sidebarCollapsed ? 56 : 210;

  /* ── USER CARD ── */
  const UserCard = ({ compact = false }) => (
    <div style={{
      margin: '0 10px 14px',
      padding: compact ? '8px 10px' : '10px 12px',
      borderRadius: 10,
      background: 'rgba(255,255,255,.025)',
      border: '1px solid rgba(255,255,255,.055)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <StableAvatar
          avatarUrl={user.avatar_url}
          name={displayName}
          size={compact ? 26 : 30}
          fontSize={10}
          onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'Syne, sans-serif',
          }}>
            {displayName}
          </div>
          <div style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,.28)', marginTop: 1 }}>
            Level {level}
          </div>
        </div>
        {/* level badge — just text, no background chip */}
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(168,85,247,.6)',
          fontFamily: 'Syne, sans-serif',
        }}>
          {level}
        </span>
      </div>

      {/* XP bar — no shimmer animation */}
      <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div className="xp-bar" style={{ height: '100%', width: `${xpProgress}%`, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.18)', fontWeight: 400 }}>XP</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.28)', fontWeight: 400 }}>{Math.round(xpProgress)}%</span>
      </div>
    </div>
  );

  /* ── SIDEBAR INNER ── */
  const SidebarInner = ({ collapsed }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo area */}
      <div style={{
        padding: collapsed ? '18px 0' : '16px 16px',
        borderBottom: '1px solid rgba(255,255,255,.045)',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, flexShrink: 0,
      }}>
        <Link to={createPageUrl('Home')} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <LogoImg size={34} borderRadius={9} />
          {!collapsed && (
            <div>
              <div style={{
                fontSize: 13, fontWeight: 800, letterSpacing: '.08em',
                fontFamily: 'Syne, sans-serif',
                background: 'linear-gradient(90deg,#fbbf24 0%,#f59e0b 30%,#e879f9 65%,#a855f7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Amethyst.GG</div>
              <div style={{
                fontSize: 8, fontWeight: 500, letterSpacing: '.16em',
                color: 'rgba(255,255,255,.15)', marginTop: 2,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                PLAY · WIN · EARN
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 12px' }}>
        {NAV_SECTIONS(user?.role).map(section => (
          <div key={section.label}>
            {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
            {collapsed && <div style={{ height: 10 }} />}
            {section.items.map(item => {
              const active = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  title={collapsed ? item.name : undefined}
                  className={`nav-link ${collapsed ? 'collapsed' : ''} ${active ? 'active' : ''}`}
                >
                  <item.Icon />
                  {!collapsed && (
                    <span style={{ flex: 1 }}>{item.name}</span>
                  )}
                  {/* active dot — only when expanded */}
                  {!collapsed && active && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#fbbf24', flexShrink: 0,
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

      {/* Collapsed: just avatar */}
      {user && collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
          <StableAvatar
            avatarUrl={user.avatar_url}
            name={displayName}
            size={30} fontSize={10}
            onClick={() => setProfileOpen(true)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#04000a', display: 'flex', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{CSS}</style>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: '#06000e',
        borderRight: '1px solid rgba(255,255,255,.045)',
        transition: 'width .28s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'none',
      }} className="lv-sidebar">
        <SidebarInner collapsed={sidebarCollapsed} />

        {/* collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          style={{
            position: 'absolute', right: -11, top: 66,
            width: 22, height: 22, borderRadius: '50%',
            background: '#0e0020',
            border: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 50,
            color: 'rgba(255,255,255,.3)',
          }}
        >
          {sidebarCollapsed
            ? <ChevronRight style={{ width: 11, height: 11 }} />
            : <ChevronLeft  style={{ width: 11, height: 11 }} />}
        </button>
      </aside>

      {/* ── Desktop Top Header ── */}
      <header style={{
        display: 'none',
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: sidebarW, height: 52,
        background: '#06000e',
        borderBottom: '1px solid rgba(255,255,255,.045)',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        transition: 'left .28s cubic-bezier(.4,0,.2,1)',
      }} className="lv-header">

        {/* page name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            height: 16, width: 2, borderRadius: 2,
            background: 'linear-gradient(to bottom,#fbbf24,#a855f7)',
            opacity: .5,
          }} />
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,.22)',
            letterSpacing: '.12em', textTransform: 'uppercase',
            fontFamily: 'Syne, sans-serif',
          }}>
            {currentPageName || ''}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 18px', borderRadius: 8,
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              textDecoration: 'none',
            }}>
              <Wallet style={{ width: 13, height: 13, color: '#fff' }} />
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                letterSpacing: '.04em', fontFamily: 'Syne, sans-serif',
              }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip">
            <CoinIcon size={15} />
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#fbbf24',
              minWidth: 48, fontFamily: 'Syne, sans-serif',
            }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {/* ── Mobile Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 52,
        background: '#06000e',
        borderBottom: '1px solid rgba(255,255,255,.045)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
      }} className="lv-mobile-header">

        <button onClick={() => setMobileOpen(v => !v)} style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,.45)', cursor: 'pointer',
        }}>
          {mobileOpen ? <X style={{ width: 14, height: 14 }} /> : <Menu style={{ width: 14, height: 14 }} />}
        </button>

        <Link to={createPageUrl('Home')} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            overflow: 'hidden', background: '#0e0020',
          }}>
            <img src={LOGO_URL} alt="Amethyst.GG" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 800, letterSpacing: '.08em',
            fontFamily: 'Syne, sans-serif',
            background: 'linear-gradient(90deg,#fbbf24,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Amethyst.GG</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 7,
              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
              textDecoration: 'none',
            }}>
              <Wallet style={{ width: 12, height: 12, color: '#fff' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip">
            <CoinIcon size={13} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', fontFamily: 'Syne, sans-serif' }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}

        <button
          onClick={() => setMobileChatOpen(v => !v)}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: mobileChatOpen ? 'rgba(168,85,247,.18)' : 'rgba(255,255,255,.04)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: mobileChatOpen ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: mobileChatOpen ? '#c084fc' : 'rgba(255,255,255,.35)',
            flexShrink: 0,
            transition: 'background 0.18s, border-color 0.18s, color 0.18s',
          }}
        >
          <MessageCircle style={{ width: 14, height: 14 }} />
        </button>
      </header>

      {/* ── Mobile Nav Drawer ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 230,
            background: '#06000e',
            borderRight: '1px solid rgba(255,255,255,.05)',
            paddingTop: 52, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <nav style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
              {NAV_SECTIONS(user?.role).map(section => (
                <div key={section.label}>
                  <div className="sidebar-section-label">{section.label}</div>
                  {section.items.map(item => {
                    const active = currentPageName === item.page;
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        className={`nav-link ${active ? 'active' : ''}`}
                      >
                        <item.Icon />
                        <span style={{ flex: 1 }}>{item.name}</span>
                        {active && (
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            {user && <UserCard compact />}
          </aside>
        </div>
      )}

      {/* ── Mobile Chat Sheet ── */}
      {mobileChatOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)' }}
            onClick={() => setMobileChatOpen(false)}
          />
          <div
            className="mobile-chat-sheet"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              height: '75vh',
              background: 'linear-gradient(180deg,#0d0020 0%,#08001a 100%)',
              borderTop: '1px solid rgba(168,85,247,.12)',
              borderRadius: '18px 18px 0 0',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,.05)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle style={{ width: 13, height: 13, color: 'rgba(192,132,252,.6)' }} />
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,.5)',
                  letterSpacing: '.1em',
                  fontFamily: 'Syne, sans-serif',
                }}>LIVE CHAT</span>
              </div>
              <button
                onClick={() => setMobileChatOpen(false)}
                style={{
                  width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,.35)',
                }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <LiveChat onClose={() => setMobileChatOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {profileOpen && user && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {/* ── Main Content ── */}
      <div style={{
        display: 'flex', flex: 1, minHeight: '100vh',
        paddingTop: 52,
        marginLeft: sidebarW,
        transition: 'margin-left .28s cubic-bezier(.4,0,.2,1)',
      }} className="lv-main">
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 20px 40px' }}>
            {children}
          </div>
        </main>

        {/* Desktop Chat Panel */}
        <aside style={{
          display: 'none', flexShrink: 0,
          height: 'calc(100vh - 52px)', position: 'sticky', top: 52,
          background: '#06000e',
          borderLeft: '1px solid rgba(255,255,255,.04)',
          transition: 'width .28s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden', width: chatOpen ? 256 : 0,
        }} className="lv-chat">
          <LiveChat onClose={() => setChatOpen(false)} />
        </aside>

        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} style={{
            display: 'none', position: 'fixed', bottom: 20, right: 20, zIndex: 50,
            width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
            alignItems: 'center', justifyContent: 'center',
          }} className="lv-chat-btn">
            <MessageCircle style={{ width: 18, height: 18, color: '#fff' }} />
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