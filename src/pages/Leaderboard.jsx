import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Flame, Gift, AlertCircle, RefreshCw, Trophy, Timer, Star, ChevronUp } from 'lucide-react';

/* ─── PRIZE CONFIG ───────────────────────────────────────────────── */
const PRIZE_CONFIG = {
  monthly: {
    label: 'Monthly Race',
    icon: Crown,
    accentColor: '#fbbf24',
    accentGlow: 'rgba(251,191,36,',
    altColor: '#a855f7',
    totalPool: 500000,
    prizes: [225000, 125000, 75000],
    top10Prize: 25000, // split among 4–10
    top10Count: 7,
    description: '500K Coin Prize Pool',
    resets: 'Resets monthly · Last day of month',
  },
  weekly: {
    label: 'Weekly Race',
    icon: Flame,
    accentColor: '#f97316',
    accentGlow: 'rgba(249,115,22,',
    altColor: '#ec4899',
    totalPool: 45000,
    prizes: [20250, 11250, 6750], // same proportional split: 45%, 25%, 15%
    top10Prize: 2250, // split among 4–10 (5% each of pool = 2250)
    top10Count: 7,
    description: '45K Coin Prize Pool',
    resets: 'Resets every Sunday · Keep climbing!',
  },
};

/* ─── RANK PRIZE HELPER ──────────────────────────────────────────── */
function getPrize(tab, rank) {
  const cfg = PRIZE_CONFIG[tab];
  if (rank <= 3) return cfg.prizes[rank - 1];
  if (rank <= 10) return Math.floor(cfg.top10Prize / cfg.top10Count);
  return 0;
}

/* ─── CSS ──────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.lb-root {
  font-family: 'Syne', sans-serif;
  background: #050008;
  min-height: 100vh;
}

/* ── Scan line ── */
@keyframes lb-scan {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 0.6; }
  95%  { opacity: 0.6; }
  100% { top: 100%; opacity: 0; }
}
.lb-scan {
  position: absolute; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(251,191,36,0.35), rgba(168,85,247,0.25), transparent);
  animation: lb-scan 8s linear infinite; pointer-events: none;
}

/* ── Grid bg ── */
@keyframes lb-grid-pulse {
  0%,100% { opacity: 0.03; }
  50%     { opacity: 0.065; }
}
.lb-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(251,191,36,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251,191,36,0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: lb-grid-pulse 6s ease-in-out infinite;
}

/* ── Particles ── */
@keyframes lb-rise {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  8%   { opacity: 1; }
  90%  { opacity: 0.4; }
  100% { transform: translateY(-110px) translateX(var(--dx)) scale(0.3); opacity: 0; }
}
.lb-pt {
  position: absolute; border-radius: 50%; pointer-events: none;
  animation: lb-rise var(--d) ease-out infinite var(--dl);
}

/* ── Crown float ── */
@keyframes lb-float {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-7px); }
}
.lb-float { animation: lb-float 3.5s ease-in-out infinite; }

/* ── Rank 1 pulse ── */
@keyframes lb-glow1 {
  0%,100% { box-shadow: 0 0 0 2px rgba(251,191,36,0.3), 0 0 30px rgba(251,191,36,0.25), 0 0 60px rgba(251,191,36,0.08); }
  50%     { box-shadow: 0 0 0 3px rgba(251,191,36,0.55), 0 0 50px rgba(251,191,36,0.45), 0 0 100px rgba(251,191,36,0.15); }
}
.lb-glow1 { animation: lb-glow1 2.8s ease-in-out infinite; }

/* ── Number glow ── */
@keyframes lb-num-glow {
  0%,100% { text-shadow: 0 0 8px currentColor; }
  50%     { text-shadow: 0 0 22px currentColor, 0 0 44px currentColor; }
}
.lb-num-glow { animation: lb-num-glow 2s ease-in-out infinite; }

/* ── Shimmer card ── */
.lb-shimmer { position: relative; overflow: hidden; }
.lb-shimmer::after {
  content: ''; position: absolute; top: 0; left: 0; width: 30%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
  animation: lb-sw 5s ease-in-out infinite; pointer-events: none; border-radius: inherit;
}
@keyframes lb-sw {
  0%   { transform: translateX(-200%) skewX(-15deg); }
  100% { transform: translateX(500%) skewX(-15deg); }
}

/* ── Pulse ring ── */
@keyframes lb-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
.lb-ring {
  position: absolute; inset: -6px; border-radius: 50%;
  border: 1px solid rgba(251,191,36,0.5);
  animation: lb-ring 2s ease-out infinite;
}

/* ── Prize badge flash ── */
@keyframes lb-prize-flash {
  0%,100% { background: rgba(251,191,36,0.08); }
  50%     { background: rgba(251,191,36,0.16); }
}
.lb-prize-flash { animation: lb-prize-flash 3s ease-in-out infinite; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 4px; }

/* ── Tab button ── */
.lb-tab {
  padding: 10px 24px; border-radius: 12px; border: none; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  transition: all 0.22s; display: flex; align-items: center; gap: 7px;
  letter-spacing: 0.02em;
}
.lb-tab:hover { filter: brightness(1.15); }

/* ── Progress bar ── */
@keyframes lb-bar-fill {
  from { width: 0%; }
}
.lb-bar-fill { animation: lb-bar-fill 1.2s cubic-bezier(0.22,1,0.36,1) forwards; }
`;

/* ─── Particles Component ────────────────────────────────────────── */
function Particles({ count = 12, accent = '#fbbf24' }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${6 + Math.random() * 88}%`,
      bottom: `${Math.random() * 20}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3.5 + Math.random() * 5}s`,
      dl: `${-Math.random() * 7}s`,
      dx: `${(Math.random() - 0.5) * 50}px`,
    }))
  ).current;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="lb-pt" style={{
          left: p.left, bottom: p.bottom, width: p.size, height: p.size,
          background: accent, boxShadow: `0 0 ${p.size * 5}px ${accent}`,
          '--d': p.d, '--dl': p.dl, '--dx': p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ user, size = 44, rank }) {
  const hasImg = user?.avatar_url && user.avatar_url !== 'null';
  const gradients = {
    1: 'linear-gradient(135deg,#fef3c7,#fbbf24 45%,#92400e)',
    2: 'linear-gradient(135deg,#e2e8f0,#94a3b8 45%,#1e293b)',
    3: 'linear-gradient(135deg,#fed7aa,#f97316 45%,#7c2d12)',
    default: 'linear-gradient(135deg,#7c3aed,#4338ca)',
  };
  const rings = { 1: '#fbbf24', 2: '#94a3b8', 3: '#f97316', default: 'rgba(168,85,247,0.5)' };
  const grad = gradients[rank] || gradients.default;
  const ring = rings[rank] || rings.default;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {rank === 1 && <div className="lb-ring" />}
      <div className={rank === 1 ? 'lb-glow1' : ''} style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 800, color: '#fff',
        boxShadow: `0 0 0 2px ${ring}`,
        fontFamily: "'Syne', sans-serif",
      }}>
        {hasImg
          ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (user?.username?.[0]?.toUpperCase() || '?')}
      </div>
    </div>
  );
}

/* ─── Prize Pool Banner ──────────────────────────────────────────── */
function PrizePoolBanner({ tab }) {
  const cfg = PRIZE_CONFIG[tab];
  const Icon = cfg.icon;
  const prizes = [
    { place: '1st', coins: cfg.prizes[0], color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', medal: '🥇' },
    { place: '2nd', coins: cfg.prizes[1], color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', medal: '🥈' },
    { place: '3rd', coins: cfg.prizes[2], color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', medal: '🥉' },
    { place: '4–10', coins: `${(Math.floor(cfg.top10Prize / cfg.top10Count)).toLocaleString()} each`, color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', medal: '⭐' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 20,
        background: `linear-gradient(145deg, rgba(5,0,15,0.98) 0%, rgba(12,0,25,0.98) 100%)`,
        border: `1px solid ${cfg.accentColor}30`,
        boxShadow: `0 0 0 1px ${cfg.accentColor}12, 0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)`,
        padding: '24px 24px 20px',
      }}>
      <div className="lb-scan" />
      <div className="lb-grid" />
      <Particles accent={cfg.accentColor} count={8} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="lb-float" style={{
            width: 42, height: 42, borderRadius: 14,
            background: `${cfg.accentColor}18`, border: `1px solid ${cfg.accentColor}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${cfg.accentColor}20`,
          }}>
            <Icon style={{ width: 20, height: 20, color: cfg.accentColor }} />
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{cfg.label}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{cfg.resets}</p>
          </div>
        </div>
        {/* Total pool pill */}
        <div className="lb-prize-flash" style={{
          padding: '8px 16px', borderRadius: 12,
          border: `1px solid ${cfg.accentColor}35`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <Gift style={{ width: 14, height: 14, color: cfg.accentColor }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: cfg.accentColor, fontFamily: "'Space Mono', monospace" }}>
            {cfg.totalPool.toLocaleString()}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em' }}>COINS</span>
        </div>
      </div>

      {/* Prize breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative', zIndex: 2 }}>
        {prizes.map((p, i) => (
          <motion.div
            key={p.place}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
            style={{
              background: p.bg, border: `1px solid ${p.border}`,
              borderRadius: 14, padding: '12px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              textAlign: 'center',
            }}>
            <span style={{ fontSize: 20 }}>{p.medal}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.place}</span>
            <span style={{ fontSize: typeof p.coins === 'string' ? 11 : 14, fontWeight: 800, color: p.color, fontFamily: "'Space Mono', monospace", lineHeight: 1.2 }}>
              {typeof p.coins === 'number' ? p.coins.toLocaleString() : p.coins}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Hero Podium ────────────────────────────────────────────────── */
const PODIUM = [
  { rank: 1, height: 148, width: 96, medal: '👑', label: '1st', grad: 'linear-gradient(to top,#78350f,#d97706,#fde68a)', color: '#fbbf24', order: 1 },
  { rank: 2, height: 108, width: 82, medal: '🥈', label: '2nd', grad: 'linear-gradient(to top,#1e293b,#475569,#e2e8f0)', color: '#94a3b8', order: 0 },
  { rank: 3, height: 84,  width: 72, medal: '🥉', label: '3rd', grad: 'linear-gradient(to top,#7c2d12,#ea580c,#fed7aa)', color: '#f97316', order: 2 },
];

function HeroPodium({ users, tab }) {
  const cfg = PRIZE_CONFIG[tab];
  const displayOrder = [PODIUM[1], PODIUM[0], PODIUM[2]]; // 2nd, 1st, 3rd

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 20,
      background: 'linear-gradient(160deg,#06000f 0%,#0c001a 50%,#04000c 100%)',
      border: '1px solid rgba(251,191,36,0.1)',
      boxShadow: '0 0 0 1px rgba(168,85,247,0.06), 0 32px 80px rgba(0,0,0,0.85)',
      padding: '36px 24px 0',
    }}>
      <div className="lb-grid" />
      <div className="lb-scan" />
      <Particles accent="#fbbf24" count={9} />
      <Particles accent="#a855f7" count={7} />

      {/* Decorative corner accents */}
      {[['top:0,left:0', '90deg'], ['top:0,right:0', '180deg'], ['bottom:0,left:0', '0deg'], ['bottom:0,right:0', '270deg']].map(([pos, rot], i) => {
        const s = pos.split(',').reduce((acc, p) => { const [k,v] = p.split(':'); acc[k] = v; return acc; }, {});
        return (
          <div key={i} style={{ position: 'absolute', ...Object.fromEntries(Object.entries(s).map(([k,v]) => [k, v])), width: 24, height: 24, zIndex: 1, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderTop: '1px solid rgba(251,191,36,0.3)', borderLeft: '1px solid rgba(251,191,36,0.3)', transform: `rotate(${rot})`, borderRadius: '2px 0 0 0' }} />
          </div>
        );
      })}

      {/* Title */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 30 }}>
        <div className="lb-float" style={{ display: 'inline-block', marginBottom: 10 }}>
          <Trophy style={{ width: 28, height: 28, color: '#fbbf24', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.7))' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Top Champions</h2>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          Ranked by wager volume
        </p>
      </div>

      {/* Podium blocks */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, position: 'relative', zIndex: 2 }}>
        {displayOrder.map((cfg_p) => {
          const u = users[cfg_p.rank - 1];
          const prize = getPrize(tab, cfg_p.rank);
          if (!u) return <div key={cfg_p.rank} style={{ width: cfg_p.width + 32 }} />;
          return (
            <motion.div
              key={cfg_p.rank}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: cfg_p.rank * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: cfg_p.width + 32 }}>

              {/* Medal */}
              <div style={{ fontSize: cfg_p.rank === 1 ? 28 : 22, marginBottom: 8 }}>{cfg_p.medal}</div>

              {/* Avatar */}
              <Avatar user={u} size={cfg_p.rank === 1 ? 72 : 56} rank={cfg_p.rank} />

              {/* Username */}
              <p style={{
                fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 3,
                maxWidth: cfg_p.width + 16, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', textAlign: 'center', letterSpacing: '-0.01em',
              }}>{u.username || 'Player'}</p>

              {/* Wager */}
              <p style={{ fontSize: 11, fontWeight: 700, color: cfg_p.color, marginBottom: 2, fontFamily: "'Space Mono', monospace" }}>
                ${(u.total_wagered || 0).toLocaleString()}
              </p>

              {/* Prize */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12,
                padding: '3px 10px', borderRadius: 8,
                background: `${cfg_p.color}15`, border: `1px solid ${cfg_p.color}30`,
              }}>
                <Gift style={{ width: 9, height: 9, color: cfg_p.color }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: cfg_p.color, fontFamily: "'Space Mono', monospace" }}>
                  {prize.toLocaleString()}
                </span>
              </div>

              {/* Podium block */}
              <motion.div
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + cfg_p.rank * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: '100%', height: cfg_p.height, borderRadius: '12px 12px 0 0',
                  background: cfg_p.grad, transformOrigin: 'bottom',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 -8px 32px ${cfg_p.color}35, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  position: 'relative', overflow: 'hidden',
                }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.25) 100%)',
                }} />
                <span className="lb-num-glow" style={{
                  fontSize: 22, fontWeight: 800, color: cfg_p.color,
                  position: 'relative', zIndex: 1, fontFamily: "'Syne', sans-serif",
                }}>{cfg_p.label}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom glow line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.5),rgba(168,85,247,0.4),transparent)',
      }} />
    </div>
  );
}

/* ─── Wager Progress Bar ─────────────────────────────────────────── */
function WagerBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
      <div className="lb-bar-fill" style={{
        height: '100%', borderRadius: 99, width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        boxShadow: `0 0 8px ${color}`,
      }} />
    </div>
  );
}

/* ─── List Row (#4–10) ───────────────────────────────────────────── */
function ListRow({ user: u, rank, tab, index, topWager }) {
  const [hov, setHov] = useState(false);
  const cfg = PRIZE_CONFIG[tab];
  const prize = getPrize(tab, rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="lb-shimmer"
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16,
        background: 'linear-gradient(145deg,#070010,#0e001e,#050009)',
        border: `1px solid ${hov ? cfg.accentColor + '30' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hov
          ? `0 0 0 1px ${cfg.accentColor}15, 0 16px 48px rgba(0,0,0,0.7), 0 0 30px ${cfg.accentColor}10`
          : '0 4px 20px rgba(0,0,0,0.6)',
        transition: 'border-color 0.22s, box-shadow 0.28s',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>

      {hov && <Particles accent={cfg.accentColor} count={4} />}

      {/* Top edge accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: hov
          ? `linear-gradient(90deg,transparent,${cfg.accentColor}50,${cfg.altColor}30,transparent)`
          : 'transparent',
        transition: 'background 0.3s',
      }} />

      {/* Rank badge */}
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: `${cfg.accentColor}08`,
        border: `1px solid ${cfg.accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 14, fontWeight: 800, color: cfg.accentColor,
          fontFamily: "'Space Mono', monospace",
        }}>#{rank}</span>
      </div>

      {/* Avatar */}
      <Avatar user={u} size={40} rank={rank} />

      {/* Name + wager bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, letterSpacing: '-0.01em' }}>
          {u.username || 'Player'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
          ${(u.total_wagered || 0).toLocaleString()} wagered
        </p>
        <WagerBar value={u.total_wagered || 0} max={topWager} color={cfg.accentColor} />
      </div>

      {/* Prize badge */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 10,
          background: `${cfg.accentColor}10`,
          border: `1px solid ${cfg.accentColor}25`,
        }}>
          <Gift style={{ width: 10, height: 10, color: cfg.accentColor }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: cfg.accentColor, fontFamily: "'Space Mono', monospace" }}>
            {prize.toLocaleString()}
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.06em', paddingRight: 2 }}>
          COINS
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Leaderboard() {
  useRequireAuth();
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('monthly');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.functions.invoke('syncLeaderboard', {});
      setTop10(result?.data?.entries || result?.entries || []);
    } catch (err) {
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = PRIZE_CONFIG[tab];
  const topWager = top10[0]?.total_wagered || 1;

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 18, fontFamily: "'Syne', sans-serif", background: '#050008',
    }}>
      <style>{CSS}</style>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #fbbf24', animation: 'lb-ring 1.2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid #a855f7', animation: 'lb-ring 1s ease-out 0.2s infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 20px #fbbf24' }} />
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Race…</p>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 16, fontFamily: "'Syne', sans-serif", background: '#050008',
    }}>
      <style>{CSS}</style>
      <AlertCircle style={{ width: 40, height: 40, color: 'rgba(248,113,113,0.7)' }} />
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{error}</p>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={loadData} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)',
        background: 'rgba(168,85,247,0.1)', color: '#c084fc',
        fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: 'pointer',
      }}>
        <RefreshCw style={{ width: 14, height: 14 }} /> Try Again
      </motion.button>
    </div>
  );

  /* ── Empty ── */
  if (top10.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: 12, fontFamily: "'Syne', sans-serif", background: '#050008',
    }}>
      <style>{CSS}</style>
      <Trophy style={{ width: 52, height: 52, color: 'rgba(251,191,36,0.2)' }} />
      <p style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.01em' }}>No players yet</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', fontWeight: 600, letterSpacing: '0.06em' }}>Be the first to wager!</p>
    </div>
  );

  return (
    <div className="lb-root">
      <style>{CSS}</style>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 30, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Leaderboard</h1>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 13, marginTop: 4, fontWeight: 600, letterSpacing: '0.04em' }}>
                Wager more · Rank higher · Earn bigger
              </p>
            </div>
            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.08, rotate: 30 }} whileTap={{ scale: 0.9 }}
              onClick={loadData}
              style={{
                width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
              <RefreshCw style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.4)' }} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{
            display: 'inline-flex', gap: 4, padding: 5, borderRadius: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            alignSelf: 'flex-start',
          }}>
          {[
            { val: 'monthly', label: 'Monthly Race', Icon: Crown,  active: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' } },
            { val: 'weekly',  label: 'Weekly Race',  Icon: Flame,  active: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)'  } },
          ].map(({ val, label, Icon, active }) => {
            const isActive = tab === val;
            return (
              <button key={val} className="lb-tab" onClick={() => setTab(val)} style={{
                background: isActive ? active.bg : 'transparent',
                border: isActive ? `1px solid ${active.border}` : '1px solid transparent',
                color: isActive ? active.color : 'rgba(255,255,255,0.3)',
                boxShadow: isActive ? `0 0 20px ${active.color}20` : 'none',
              }}>
                <Icon style={{ width: 14, height: 14 }} />
                {label}
              </button>
            );
          })}
        </motion.div>

        {/* ── Content (animated tab switch) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Prize Pool Banner */}
            <PrizePoolBanner tab={tab} />

            {/* Podium */}
            <HeroPodium users={top10} tab={tab} />

            {/* ── #4–10 ── */}
            {top10.length > 3 && (
              <div>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(to bottom,${cfg.accentColor},${cfg.altColor})` }} />
                  <ChevronUp style={{ width: 14, height: 14, color: cfg.accentColor }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Climbing the Ranks
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,0.06),transparent)' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.06em' }}>
                    ALL EARN {Math.floor(cfg.top10Prize / cfg.top10Count).toLocaleString()} COINS
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {top10.slice(3).map((u, i) => (
                    <ListRow
                      key={u.user_email || i}
                      user={u}
                      rank={i + 4}
                      tab={tab}
                      index={i}
                      topWager={topWager}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer note */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{
                padding: '12px 18px', borderRadius: 14,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <Timer style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.02em' }}>
                {tab === 'monthly'
                  ? 'Monthly race resets on the last day of each month. Top 10 wagers share the 500,000 coin prize pool.'
                  : 'Weekly race resets every Sunday. Top 10 wagers share the 45,000 coin prize pool.'}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}