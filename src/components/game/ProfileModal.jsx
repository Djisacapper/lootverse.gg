import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, LogOut, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import { getXpForLevel, getXpProgressForLevel } from './useWallet';
import GameHistoryView from './GameHistoryView';
import TransactionsView from './TransactionsView';

/* ── CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

.pm-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(3, 0, 14, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.pm-modal {
  position: relative;
  width: 100%; max-width: 660px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(160deg, #0e0820 0%, #080416 50%, #050212 100%);
  border: 1px solid rgba(157, 78, 221, 0.3);
  box-shadow:
    0 0 0 1px rgba(245,200,66,.06),
    0 0 80px rgba(123,47,247,.2),
    0 0 200px rgba(157,78,221,.08),
    0 40px 120px rgba(0,0,0,.85);
  font-family: 'DM Sans', sans-serif;
}

/* Top accent bar */
.pm-accent-bar {
  height: 2px;
  background: linear-gradient(90deg, transparent, #9d4edd, #f5c842, #9d4edd, transparent);
  flex-shrink: 0;
}

/* Header */
.pm-header {
  padding: 26px 28px 22px;
  border-bottom: 1px solid rgba(157,78,221,.12);
  flex-shrink: 0;
  position: relative;
}

.pm-header-title-row {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px;
}

.pm-title {
  font-family: 'Cinzel', serif;
  font-size: 22px; font-weight: 900;
  letter-spacing: .1em;
  background: linear-gradient(135deg, #f5c842 20%, #c084fc 70%, #9d4edd 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.pm-subtitle {
  font-size: 11px; color: rgba(192,132,252,.35); font-weight: 600; letter-spacing: .1em; text-transform: uppercase; margin-top: 3px;
}

.pm-close-btn {
  background: rgba(157,78,221,.1); border: 1px solid rgba(157,78,221,.2);
  border-radius: 10px; padding: 8px; cursor: pointer; color: rgba(192,132,252,.5);
  transition: all .2s; display: flex; align-items: center; justify-content: center;
}
.pm-close-btn:hover {
  background: rgba(157,78,221,.2); border-color: rgba(245,200,66,.3); color: #f5c842;
  box-shadow: 0 0 16px rgba(157,78,221,.2);
}

/* Avatar */
.pm-avatar-wrap {
  display: flex; align-items: center; gap: 18px;
}
.pm-avatar {
  width: 72px; height: 72px; border-radius: 16px;
  background: linear-gradient(135deg, #9d4edd, #6d28d9);
  border: 2px solid rgba(245,200,66,.3);
  box-shadow: 0 0 24px rgba(157,78,221,.35), 0 0 48px rgba(157,78,221,.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 900; color: #f5c842;
  overflow: hidden; flex-shrink: 0;
  font-family: 'Cinzel', serif;
}
.pm-avatar img { width: 100%; height: 100%; object-fit: cover; }

.pm-user-name {
  font-size: 20px; font-weight: 800; color: #f0eaff; margin-bottom: 4px; font-family: 'Cinzel', serif; letter-spacing: .04em;
}
.pm-user-email { font-size: 12px; color: rgba(192,132,252,.3); margin-bottom: 10px; font-weight: 500; }

.pm-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pm-level-badge {
  padding: 4px 12px; border-radius: 8px;
  background: rgba(157,78,221,.15); border: 1px solid rgba(157,78,221,.35);
  color: #c084fc; font-size: 11px; font-weight: 800; letter-spacing: .06em;
}
.pm-balance-badge {
  padding: 4px 12px; border-radius: 8px;
  background: rgba(245,200,66,.1); border: 1px solid rgba(245,200,66,.25);
  color: #f5c842; font-size: 12px; font-weight: 800;
}
.pm-xp-badge { font-size: 11px; color: rgba(192,132,252,.35); font-weight: 600; }

/* XP Bar */
.pm-xp-wrap {
  margin-top: 16px; padding: 14px 16px; border-radius: 12px;
  background: rgba(157,78,221,.06); border: 1px solid rgba(157,78,221,.15);
}
.pm-xp-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.pm-xp-label { font-size: 10px; font-weight: 700; color: rgba(192,132,252,.4); letter-spacing: .12em; text-transform: uppercase; }
.pm-xp-pct { font-size: 12px; font-weight: 800; color: #f5c842; }
.pm-xp-track { height: 6px; border-radius: 6px; background: rgba(157,78,221,.12); overflow: hidden; }
.pm-xp-fill {
  height: 100%; border-radius: 6px;
  background: linear-gradient(90deg, #9d4edd, #c084fc, #f5c842);
  transition: width .7s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 0 12px rgba(157,78,221,.5);
}
.pm-xp-sub { font-size: 10px; color: rgba(192,132,252,.25); margin-top: 6px; font-weight: 600; }

/* Tabs */
.pm-tabs {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid rgba(157,78,221,.12);
  background: rgba(157,78,221,.03);
  flex-shrink: 0;
}
.pm-tab {
  padding: 13px 8px; font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 800; text-align: center;
  background: transparent; border: none; cursor: pointer;
  border-bottom: 2px solid transparent;
  letter-spacing: .04em; transition: all .2s;
  color: rgba(192,132,252,.3);
}
.pm-tab:hover { color: rgba(192,132,252,.7); background: rgba(157,78,221,.05); }
.pm-tab.active {
  color: #f5c842;
  border-bottom-color: #f5c842;
  background: rgba(245,200,66,.04);
}

/* Content */
.pm-content {
  flex: 1; overflow-y: auto; padding: 22px 24px;
  scrollbar-width: thin; scrollbar-color: rgba(157,78,221,.2) transparent;
}
.pm-content::-webkit-scrollbar { width: 4px; }
.pm-content::-webkit-scrollbar-thumb { background: rgba(157,78,221,.2); border-radius: 4px; }

/* Stat cards */
.pm-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
.pm-stat-card {
  padding: 16px 14px; border-radius: 14px;
  display: flex; flex-direction: column; gap: 6px;
}
.pm-stat-card.green {
  background: linear-gradient(135deg, rgba(16,185,129,.08), rgba(5,150,105,.04));
  border: 1px solid rgba(16,185,129,.2);
}
.pm-stat-card.gold {
  background: linear-gradient(135deg, rgba(245,200,66,.08), rgba(212,162,0,.04));
  border: 1px solid rgba(245,200,66,.2);
}
.pm-stat-card.purple {
  background: linear-gradient(135deg, rgba(157,78,221,.1), rgba(109,40,217,.05));
  border: 1px solid rgba(157,78,221,.25);
}
.pm-stat-top { display: flex; align-items: center; justify-content: space-between; }
.pm-stat-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: rgba(192,132,252,.4); }
.pm-stat-value { font-size: 20px; font-weight: 900; font-family: 'Cinzel', serif; letter-spacing: .02em; }
.pm-stat-value.green { color: #34d399; }
.pm-stat-value.gold { color: #f5c842; }
.pm-stat-value.purple { color: #c084fc; }
.pm-stat-sub { font-size: 10px; color: rgba(192,132,252,.25); font-weight: 600; }

/* Account status card */
.pm-info-card {
  padding: 16px; border-radius: 14px;
  background: rgba(157,78,221,.05); border: 1px solid rgba(157,78,221,.15);
}
.pm-info-card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: rgba(192,132,252,.35); margin-bottom: 14px; }
.pm-info-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid rgba(157,78,221,.08);
}
.pm-info-row:last-child { border-bottom: none; }
.pm-info-key { font-size: 13px; color: rgba(192,132,252,.45); font-weight: 600; }
.pm-info-val { font-size: 13px; color: #f0eaff; font-weight: 700; }
.pm-active-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 20px;
  background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.25);
}
.pm-active-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #34d399;
  animation: pm-pulse 2s ease-in-out infinite;
}
@keyframes pm-pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
.pm-active-text { font-size: 11px; font-weight: 800; color: #34d399; letter-spacing: .06em; }

/* Footer */
.pm-footer {
  padding: 14px 24px; border-top: 1px solid rgba(157,78,221,.12);
  flex-shrink: 0;
}
.pm-logout-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border-radius: 12px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: .04em;
  background: rgba(255,78,106,.06); border: 1px solid rgba(255,78,106,.2);
  color: rgba(255,78,106,.6); transition: all .2s;
}
.pm-logout-btn:hover {
  background: rgba(255,78,106,.12); border-color: rgba(255,78,106,.4); color: #ff4e6a;
  box-shadow: 0 0 20px rgba(255,78,106,.1);
}

/* Gem decorations */
@keyframes pm-gem-float {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: .18; }
  50% { transform: translateY(-8px) rotate(8deg); opacity: .3; }
}
.pm-gem-deco {
  position: absolute; pointer-events: none;
  animation: pm-gem-float 6s ease-in-out infinite;
}
`;

/* ── Tiny gem SVG decoration ── */
const GemDeco = ({ size, color, style }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ ...style, filter: `drop-shadow(0 0 ${size * 0.4}px ${color})` }}>
    <defs>
      <linearGradient id={`gdeco-${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
        <stop offset="50%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0a001e" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <polygon points="50,5 88,28 88,72 50,96 12,72 12,28" fill={`url(#gdeco-${color.replace('#','')})`} stroke={color} strokeWidth="2" strokeOpacity="0.4" />
    <polygon points="50,5 88,28 50,50" fill="white" fillOpacity="0.12" />
  </svg>
);

export default function ProfileModal({ user, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ deposits: 0, wagered: 0, withdrawals: 0 });
  const [loading, setLoading] = useState(true);
  const level = user?.level || 1;
  const xpProgress = getXpProgressForLevel(level, user?.xp || 0);

  useEffect(() => {
    const fetchStats = async () => {
      const transactions = await base44.entities.Transaction.filter({ user_email: user?.email });
      const deposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + (t.amount || 0), 0);
      const wagered = transactions.filter(t => ['case_purchase','battle_entry','coinflip_bet','crash_bet'].includes(t.type)).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const withdrawals = transactions.filter(t => t.type === 'item_sell').reduce((s, t) => s + (t.amount || 0), 0);
      setStats({ deposits, wagered, withdrawals });
      setLoading(false);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleLogout = () => { onClose(); base44.auth.logout(); };

  return (
    <div className="pm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <div className="pm-modal">
        {/* Gem decorations */}
        <GemDeco size={36} color="#9d4edd" style={{ position: 'absolute', top: 14, right: 60, animationDelay: '0s' }} />
        <GemDeco size={22} color="#f5c842" style={{ position: 'absolute', top: 60, right: 24, animationDelay: '1.5s' }} />
        <GemDeco size={18} color="#c084fc" style={{ position: 'absolute', bottom: 80, left: 14, animationDelay: '3s' }} />

        <div className="pm-accent-bar" />

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-title-row">
            <div>
              <div className="pm-title">PROFILE</div>
              <div className="pm-subtitle">✦ Your account overview ✦</div>
            </div>
            <button className="pm-close-btn" onClick={onClose}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Avatar + info */}
          <div className="pm-avatar-wrap">
            <div className="pm-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" />
                : (user?.full_name?.[0]?.toUpperCase() || '?')}
            </div>
            <div style={{ flex: 1 }}>
              <div className="pm-user-name">
                {user?.is_anonymous ? `Anonymous #${user?.id?.slice(-4) || '????'}` : (user?.username || user?.full_name || 'Player')}
              </div>
              <div className="pm-user-email">{user?.email}</div>
              <div className="pm-badges">
                <span className="pm-level-badge">LVL {level}</span>
                <span className="pm-balance-badge">💰 ${(user?.balance || 0).toLocaleString()}</span>
                <span className="pm-xp-badge">{(user?.xp || 0).toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="pm-xp-wrap">
            <div className="pm-xp-label-row">
              <span className="pm-xp-label">Wager Progress</span>
              <span className="pm-xp-pct">{Math.round(xpProgress)}%</span>
            </div>
            <div className="pm-xp-track">
              <div className="pm-xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="pm-xp-sub">{getXpForLevel(level).toLocaleString()} XP needed for next level</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`pm-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pm-content">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="pm-stats-grid">
                <div className="pm-stat-card green">
                  <div className="pm-stat-top">
                    <span className="pm-stat-label">Deposits</span>
                    <ArrowDown style={{ width: 14, height: 14, color: '#34d399' }} />
                  </div>
                  <div className="pm-stat-value green">${loading ? '—' : stats.deposits.toLocaleString()}</div>
                  <div className="pm-stat-sub">Total added</div>
                </div>
                <div className="pm-stat-card gold">
                  <div className="pm-stat-top">
                    <span className="pm-stat-label">Wagered</span>
                    <TrendingUp style={{ width: 14, height: 14, color: '#f5c842' }} />
                  </div>
                  <div className="pm-stat-value gold">${loading ? '—' : stats.wagered.toLocaleString()}</div>
                  <div className="pm-stat-sub">Total bet</div>
                </div>
                <div className="pm-stat-card purple">
                  <div className="pm-stat-top">
                    <span className="pm-stat-label">Withdrawn</span>
                    <ArrowUp style={{ width: 14, height: 14, color: '#c084fc' }} />
                  </div>
                  <div className="pm-stat-value purple">${loading ? '—' : stats.withdrawals.toLocaleString()}</div>
                  <div className="pm-stat-sub">Total sold</div>
                </div>
              </div>

              <div className="pm-info-card">
                <div className="pm-info-card-title">Account Status</div>
                <div className="pm-info-row">
                  <span className="pm-info-key">Member Since</span>
                  <span className="pm-info-val">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="pm-info-row">
                  <span className="pm-info-key">Affiliate Code</span>
                  <span className="pm-info-val" style={{ color: '#f5c842', fontFamily: 'monospace', letterSpacing: '.08em' }}>{user?.affiliate_code || '—'}</span>
                </div>
                <div className="pm-info-row">
                  <span className="pm-info-key">Status</span>
                  <div className="pm-active-pill">
                    <div className="pm-active-dot" />
                    <span className="pm-active-text">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && <GameHistoryView userEmail={user?.email} />}
          {activeTab === 'transactions' && <TransactionsView userEmail={user?.email} />}
          {activeTab === 'settings' && <ProfileSettings user={user} onSaved={() => {}} />}
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button className="pm-logout-btn" onClick={handleLogout}>
            <LogOut style={{ width: 15, height: 15 }} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}