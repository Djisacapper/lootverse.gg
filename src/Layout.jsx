import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LiveChat from './components/game/LiveChat';
import ProfileModal from './components/game/ProfileModal';
import { Menu, X, ChevronLeft, ChevronRight, Wallet, MessageCircle } from 'lucide-react';

const LOGO_URL = 'https://i.imgur.com/kdQd9ES.png';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; }
body, #root {
  font-family: 'Nunito', sans-serif;
  background: #04000a;
}

/* grain texture — subtle depth */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.022;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px;
}

/* xp bar */
.xp-bar {
  background: linear-gradient(90deg, #a855f7, #fbbf24);
  transition: width 0.6s cubic-bezier(.4,0,.2,1);
}

/* ── NAV LINKS ── */
.nav-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px 8px 12px;
  margin: 1px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,.3);
  position: relative;
  border: 1px solid transparent;
  overflow: hidden;
}

.nav-link:hover {
  color: rgba(255,255,255,.72);
  background: rgba(168,85,247,.07);
  border-color: rgba(168,85,247,.1);
}

.nav-link.active {
  color: #fff;
  background: rgba(168,85,247,.12);
  border-color: rgba(168,85,247,.22);
}

/* gold-to-purple left pip on active */
.nav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: linear-gradient(to bottom, #fbbf24, #a855f7);
  border-radius: 0 3px 3px 0;
}

.nav-link.collapsed {
  justify-content: center;
  padding: 9px 0;
  margin: 1px 6px;
}

/* nav icon styling */
.nav-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: rgba(255,255,255,.22);
  transition: color 0.16s;
}
.nav-link:hover .nav-icon { color: rgba(168,85,247,.8); }
.nav-link.active .nav-icon { color: #c084fc; }

/* section labels */
.sidebar-section-label {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(168,85,247,.25);
  padding: 0 18px;
  margin: 16px 0 4px;
}

/* balance chip */
.balance-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(251,191,36,.06);
  border: 1px solid rgba(251,191,36,.14);
}

/* mobile chat slide-up */
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.mobile-chat-sheet {
  animation: slideUp 0.26s cubic-bezier(.4,0,.2,1) forwards;
}

/* deposit button shimmer on hover */
.deposit-btn {
  position: relative;
  overflow: hidden;
}
.deposit-btn::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: -60%;
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  transform: skewX(-20deg);
  transition: left 0s;
}
.deposit-btn:hover::after {
  left: 130%;
  transition: left 0.5s ease;
}

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,.15); border-radius: 3px; }
::-webkit-scrollbar-track { background: transparent; }
`;

/* ── CUSTOM NAV ICONS
   Hand-crafted SVG paths — more distinctive than generic Lucide stroke set
─────────────────────────────────────────────────────────────────────────── */
const NavIcons = {
  Home: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 2L2 7v7h4v-4h4v4h4V7L8 2z" fill="currentColor" fillOpacity=".85" />
    </svg>
  ),
  Battles: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M11.5 1.5l3 3-1.5 1.5-1-1-5.5 5.5 1 1-1.5 1.5-3-3 1.5-1.5 1 1 5.5-5.5-1-1 1.5-1.5z" fill="currentColor" fillOpacity=".85"/>
      <path d="M2 12.5l1.5 1.5 1-1-1.5-1.5L2 12.5z" fill="currentColor" fillOpacity=".5"/>
    </svg>
  ),
  Cases: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="1.5" y="5.5" width="13" height="9" rx="1.5" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".8"/>
      <path d="M5.5 5.5V4a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".8"/>
      <path d="M1.5 9h13" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".5"/>
      <rect x="6.5" y="8" width="3" height="2" rx=".75" fill="currentColor" fillOpacity=".6"/>
    </svg>
  ),
  Coinflip: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <circle cx="8" cy="8" r="5.5" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".8"/>
      <circle cx="8" cy="8" r="3" fill="currentColor" fillOpacity=".25"/>
      <path d="M8 5v6M6 6.5l2-1.5 2 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".9"/>
    </svg>
  ),
  Crash: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M2 12.5L5.5 8.5l3 2 5-6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".85"/>
      <path d="M10 3.5h3.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".85"/>
      <circle cx="5.5" cy="8.5" r="1" fill="currentColor" fillOpacity=".6"/>
    </svg>
  ),
  Referrals: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <circle cx="5" cy="5.5" r="2.2" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".8"/>
      <circle cx="11" cy="5.5" r="2.2" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".8"/>
      <path d="M1 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".8"/>
      <path d="M11 9.5c1.5.5 2.5 1.8 2.8 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".55"/>
    </svg>
  ),
  Rewards: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 2l1.4 2.8 3.1.45-2.25 2.2.53 3.1L8 9l-2.78 1.55.53-3.1L3.5 5.25l3.1-.45L8 2z" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.05" strokeLinejoin="round" strokeOpacity=".85"/>
      <path d="M5.5 13.5h5M8 10.5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".6"/>
    </svg>
  ),
  Leaderboard: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="1.5" y="9.5" width="3" height="5" rx="1" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.05" strokeOpacity=".75"/>
      <rect x="6.5" y="6" width="3" height="8.5" rx="1" fill="currentColor" fillOpacity=".3" stroke="currentColor" strokeWidth="1.05" strokeOpacity=".85"/>
      <rect x="11.5" y="2.5" width="3" height="12" rx="1" fill="currentColor" fillOpacity=".4" stroke="currentColor" strokeWidth="1.05" strokeOpacity=".9"/>
    </svg>
  ),
  Terms: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".75"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".7"/>
    </svg>
  ),
  Admin: () => (
    <svg viewBox="0 0 16 16" fill="none" className="nav-icon">
      <path d="M8 1.5L14 4v4c0 3.3-2.4 5.7-6 6.5C2.4 13.7 2 11.3 2 8V4L8 1.5z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeOpacity=".8"/>
      <path d="M5.5 8l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" strokeOpacity=".9"/>
    </svg>
  ),
};

const NAV_SECTIONS = (role) => [
  {
    label: 'Games',
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
    label: 'Legal',
    items: [
      { name: 'Terms of Service', Icon: NavIcons.Terms, page: 'TermsOfService' },
    ],
  },
  ...(role === 'admin' ? [{
    label: 'Staff',
    items: [{ name: 'Admin', Icon: NavIcons.Admin, page: 'Admin' }],
  }] : []),
];

function CoinIcon({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 6px rgba(251,191,36,.4)',
    }}>
      <span style={{ fontSize: size * 0.44, fontWeight: 900, color: '#000', lineHeight: 1, fontFamily: 'Nunito, sans-serif' }}>$</span>
    </div>
  );
}

const LogoImg = React.memo(function LogoImg({ size, borderRadius }) {
  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      overflow: 'hidden',
      boxShadow: '0 0 18px rgba(168,85,247,.45)',
      background: '#0e0020',
    }}>
      <img src={LOGO_URL} alt="Amethyst.GG" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
});

const StableAvatar = React.memo(({ avatarUrl, name, size, fontSize, onClick, style = {} }) => {
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevUrl = useRef(avatarUrl);

  useEffect(() => {
    if (prevUrl.current !== avatarUrl) { prevUrl.current = avatarUrl; setImgLoaded(false); }
  }, [avatarUrl]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setImgLoaded(true);
  }, []);

  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#a855f7,#fbbf24)',
      border: '2px solid rgba(168,85,247,.3)',
      cursor: onClick ? 'pointer' : 'default', padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 900, color: '#fff',
      fontFamily: 'Nunito, sans-serif',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      transition: 'border-color 0.18s',
      ...style,
    }}>
      <span style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>{initial}</span>
      {avatarUrl && (
        <img ref={imgRef} src={avatarUrl} alt=""
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
  const [user,           setUser]           = useState(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [chatOpen,       setChatOpen]       = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const userRef = useRef(null);

  const reloadUser = () => base44.auth.me().then(fresh => {
    const prev = userRef.current;
    if (!prev ||
      prev.balance !== fresh.balance || prev.xp !== fresh.xp ||
      prev.level !== fresh.level || prev.avatar_url !== fresh.avatar_url ||
      prev.username !== fresh.username || prev.full_name !== fresh.full_name ||
      prev.is_anonymous !== fresh.is_anonymous || prev.role !== fresh.role ||
      prev.email !== fresh.email
    ) { userRef.current = fresh; setUser(fresh); }
  }).catch(() => {});

  useEffect(() => {
    reloadUser();
    const interval = setInterval(reloadUser, 3000);
    const unsub = base44.entities.User.subscribe(e => { if (e.type === 'update') reloadUser(); });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [currentPageName]);

  const handleProfileSaved = (updatedUser) => {
    // Always do a live reload so sidebar, chat, etc. show new username/avatar instantly
    reloadUser();
    if (updatedUser) {
      const merged = { ...userRef.current, ...updatedUser };
      userRef.current = merged;
      setUser(merged);
    }
  };

  const xpProgress  = user ? ((user.xp || 0) % 500) / 5 : 0;
  const level       = user?.level || 1;
  const displayName = getDisplayName(user);
  const sidebarW    = sidebarCollapsed ? 60 : 214;

  /* ── USER CARD ── */
  const UserCard = ({ compact = false }) => (
    <div style={{
      margin: compact ? '0 8px 10px' : '0 10px 14px',
      padding: compact ? '9px 10px' : '11px 12px',
      borderRadius: 12,
      background: 'linear-gradient(135deg, rgba(168,85,247,.07) 0%, rgba(251,191,36,.04) 100%)',
      border: '1px solid rgba(168,85,247,.14)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <StableAvatar
          avatarUrl={user.avatar_url}
          name={displayName}
          size={compact ? 28 : 32}
          fontSize={11}
          onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, fontWeight: 800,
            color: 'rgba(255,255,255,.82)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {displayName}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: 'rgba(168,85,247,.5)',
            marginTop: 1,
          }}>
            Level {level}
          </div>
        </div>
        {/* level badge */}
        <div style={{
          padding: '2px 8px', borderRadius: 6,
          background: 'rgba(168,85,247,.15)',
          border: '1px solid rgba(168,85,247,.28)',
          fontSize: 9, fontWeight: 800,
          color: '#c084fc',
          fontFamily: 'Nunito, sans-serif',
          letterSpacing: '.04em',
        }}>
          Lv{level}
        </div>
      </div>

      {/* XP bar — static gradient, no shimmer */}
      <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div className="xp-bar" style={{ height: '100%', width: `${xpProgress}%`, borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>XP Progress</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(192,132,252,.4)' }}>{Math.round(xpProgress)}%</span>
      </div>
    </div>
  );

  /* ── SIDEBAR INNER ── */
  const SidebarInner = ({ collapsed }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '17px 0' : '15px 16px',
        borderBottom: '1px solid rgba(168,85,247,.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, flexShrink: 0,
      }}>
        <Link to={createPageUrl('Home')} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <LogoImg size={36} borderRadius={10} />
          {!collapsed && (
            <div>
              <div style={{
                fontSize: 14, fontWeight: 900, letterSpacing: '.1em',
                fontFamily: 'Nunito, sans-serif',
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 28%, #e879f9 62%, #a855f7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Amethyst.GG</div>
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '.12em',
                color: 'rgba(255,255,255,.18)', marginTop: 1,
                fontFamily: 'Nunito, sans-serif',
              }}>PLAY · WIN · EARN</div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 10px' }}>
        {NAV_SECTIONS(user?.role).map(section => (
          <div key={section.label}>
            {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
            {collapsed  && <div style={{ height: 10 }} />}
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
                  {!collapsed && <span style={{ flex: 1 }}>{item.name}</span>}
                  {!collapsed && active && (
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#fbbf24',
                      boxShadow: '0 0 5px rgba(251,191,36,.7)',
                      flexShrink: 0,
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
      {user && collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
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
    <div style={{ minHeight: '100vh', background: '#04000a', display: 'flex', fontFamily: 'Nunito, sans-serif' }}>
      <style>{CSS}</style>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: 'linear-gradient(180deg, #08001a 0%, #04000a 100%)',
        borderRight: '1px solid rgba(168,85,247,.09)',
        transition: 'width .28s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'none',
      }} className="lv-sidebar">
        <SidebarInner collapsed={sidebarCollapsed} />
        <button onClick={() => setSidebarCollapsed(v => !v)} style={{
          position: 'absolute', right: -11, top: 68,
          width: 22, height: 22, borderRadius: '50%',
          background: '#0e0020',
          border: '1px solid rgba(168,85,247,.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50,
          color: 'rgba(192,132,252,.5)',
        }}>
          {sidebarCollapsed
            ? <ChevronRight style={{ width: 11, height: 11 }} />
            : <ChevronLeft  style={{ width: 11, height: 11 }} />}
        </button>
      </aside>

      {/* ── Desktop Header ── */}
      <header style={{
        display: 'none',
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: sidebarW, height: 54,
        background: 'linear-gradient(90deg, #08001a, #0a0015)',
        borderBottom: '1px solid rgba(168,85,247,.09)',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        transition: 'left .28s cubic-bezier(.4,0,.2,1)',
      }} className="lv-header">

        {/* page name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            height: 16, width: 2, borderRadius: 2,
            background: 'linear-gradient(to bottom, #fbbf24, #a855f7)', opacity: .55,
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,.2)',
            letterSpacing: '.1em', textTransform: 'uppercase',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {currentPageName || ''}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} className="deposit-btn" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(168,85,247,.3)',
            }}>
              <Wallet style={{ width: 13, height: 13, color: '#fff' }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '.04em', fontFamily: 'Nunito, sans-serif' }}>
                Deposit
              </span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip">
            <CoinIcon size={16} />
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24', minWidth: 48, fontFamily: 'Nunito, sans-serif' }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {/* ── Mobile Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 54,
        background: 'linear-gradient(90deg, #08001a, #0a0015)',
        borderBottom: '1px solid rgba(168,85,247,.09)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      }} className="lv-mobile-header">

        <button onClick={() => setMobileOpen(v => !v)} style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'rgba(168,85,247,.08)',
          border: '1px solid rgba(168,85,247,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(192,132,252,.7)', cursor: 'pointer',
          transition: 'background 0.15s',
        }}>
          {mobileOpen ? <X style={{ width: 14, height: 14 }} /> : <Menu style={{ width: 14, height: 14 }} />}
        </button>

        <Link to={createPageUrl('Home')} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            overflow: 'hidden',
            boxShadow: '0 0 12px rgba(168,85,247,.45)',
            background: '#0e0020',
          }}>
            <img src={LOGO_URL} alt="Amethyst.GG" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <span style={{
            fontSize: 13, fontWeight: 900, letterSpacing: '.1em',
            fontFamily: 'Nunito, sans-serif',
            background: 'linear-gradient(90deg, #fbbf24, #a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Amethyst.GG</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {user && (
            <Link to={createPageUrl('Deposit')} className="deposit-btn" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              textDecoration: 'none',
              boxShadow: '0 0 12px rgba(168,85,247,.35)',
            }}>
              <Wallet style={{ width: 12, height: 12, color: '#fff' }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', fontFamily: 'Nunito, sans-serif' }}>Deposit</span>
            </Link>
          )}
        </div>

        {user && (
          <div className="balance-chip" style={{ padding: '5px 10px' }}>
            <CoinIcon size={13} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', fontFamily: 'Nunito, sans-serif' }}>
              {(user.balance || 0).toLocaleString()}
            </span>
          </div>
        )}

        <button
          onClick={() => setMobileChatOpen(v => !v)}
          style={{
            width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
            background: mobileChatOpen ? 'rgba(168,85,247,.2)' : 'rgba(168,85,247,.08)',
            borderWidth: 1, borderStyle: 'solid',
            borderColor: mobileChatOpen ? 'rgba(168,85,247,.45)' : 'rgba(168,85,247,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: mobileChatOpen ? '#c084fc' : 'rgba(192,132,252,.55)',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          }}
        >
          <MessageCircle style={{ width: 14, height: 14 }} />
        </button>
      </header>

      {/* ── Mobile Nav Drawer ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 240,
            background: 'linear-gradient(180deg, #08001a 0%, #04000a 100%)',
            borderRight: '1px solid rgba(168,85,247,.1)',
            paddingTop: 54, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <nav style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
              {NAV_SECTIONS(user?.role).map(section => (
                <div key={section.label}>
                  <div className="sidebar-section-label">{section.label}</div>
                  {section.items.map(item => {
                    const active = currentPageName === item.page;
                    return (
                      <Link key={item.page} to={createPageUrl(item.page)}
                        className={`nav-link ${active ? 'active' : ''}`}>
                        <item.Icon />
                        <span style={{ flex: 1 }}>{item.name}</span>
                        {active && (
                          <div style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: '#fbbf24', boxShadow: '0 0 5px rgba(251,191,36,.7)',
                          }} />
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
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)' }}
            onClick={() => setMobileChatOpen(false)}
          />
          <div className="mobile-chat-sheet" style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            height: '75vh',
            background: 'linear-gradient(180deg, #0d0020 0%, #08001a 100%)',
            borderTop: '1px solid rgba(168,85,247,.15)',
            borderRadius: '20px 20px 0 0',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 -8px 40px rgba(168,85,247,.12)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px 10px',
              borderBottom: '1px solid rgba(168,85,247,.08)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle style={{ width: 13, height: 13, color: '#c084fc' }} />
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: 'rgba(255,255,255,.55)',
                  letterSpacing: '.08em',
                  fontFamily: 'Nunito, sans-serif',
                }}>LIVE CHAT</span>
              </div>
              <button onClick={() => setMobileChatOpen(false)} style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,.38)',
              }}>
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
        paddingTop: 54,
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
          height: 'calc(100vh - 54px)', position: 'sticky', top: 54,
          background: 'linear-gradient(180deg, #08001a 0%, #04000a 100%)',
          borderLeft: '1px solid rgba(168,85,247,.07)',
          transition: 'width .28s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden', width: chatOpen ? 260 : 0,
        }} className="lv-chat">
          <LiveChat onClose={() => setChatOpen(false)} />
        </aside>

        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} style={{
            display: 'none', position: 'fixed', bottom: 20, right: 20, zIndex: 50,
            width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(168,85,247,.45)',
          }} className="lv-chat-btn">
            <MessageCircle style={{ width: 19, height: 19, color: '#fff' }} />
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