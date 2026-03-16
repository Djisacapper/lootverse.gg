import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, X, Bot, Swords, Crown, Zap, ChevronDown, Users, Coins } from 'lucide-react';
import CasePickerModal from './CasePickerModal';
import { getRarityColor, getRarityGlow } from './useWallet';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');

.cb-root { font-family: 'Nunito', sans-serif; }

/* ── Animations ── */
@keyframes cb-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.45; }
  95% { opacity:.45; }
  100%{ top:100%; opacity:0; }
}
.cb-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,200,0,.2),transparent);
  animation:cb-scan 8s linear infinite; pointer-events:none; z-index:1;
}

@keyframes cb-shimmer {
  0%  { transform:translateX(-130%) skewX(-15deg); }
  100%{ transform:translateX(380%)  skewX(-15deg); }
}
.cb-shim::after {
  content:''; position:absolute; top:0; left:0; width:22%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,210,0,.035),transparent);
  animation:cb-shimmer 7s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes cb-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.4; }
  100% { transform:translateY(-90px) translateX(var(--dx)); opacity:0; }
}
.cb-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:cb-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes cb-grid-pulse {
  0%,100% { opacity:.025; }
  50%     { opacity:.055; }
}
.cb-grid-bg {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,200,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,200,0,.04) 1px, transparent 1px);
  background-size:28px 28px;
  animation:cb-grid-pulse 6s ease-in-out infinite;
}

@keyframes cb-float {
  0%,100% { transform:translateY(0px) rotate(-6deg); }
  50%     { transform:translateY(-10px) rotate(6deg); }
}
.cb-float { animation:cb-float 4.5s ease-in-out infinite; }

@keyframes cb-badge-glow {
  0%,100% { box-shadow: 0 0 8px rgba(251,191,36,.3); }
  50%     { box-shadow: 0 0 16px rgba(251,191,36,.6); }
}

@keyframes cb-card-in {
  from { opacity:0; transform:translateY(12px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.cb-card-in { animation:cb-card-in .35s cubic-bezier(.22,1,.36,1) both; }

/* ── Toggle ── */
.cb-toggle-track {
  width:40px; height:22px; border-radius:999px;
  position:relative; transition:background .25s; cursor:pointer; flex-shrink:0;
}
.cb-toggle-thumb {
  position:absolute; top:3px; width:16px; height:16px; border-radius:50%;
  background:#fff; transition:left .25s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 1px 4px rgba(0,0,0,.5);
}

/* ── Case card ── */
.cb-case-card {
  position:relative; border-radius:14px; overflow:hidden;
  background:linear-gradient(160deg,#0c001a,#120025,#070010);
  border:1px solid rgba(255,255,255,.07);
  transition:border-color .25s, box-shadow .25s, transform .2s;
  cursor:pointer;
}
.cb-case-card:hover {
  border-color:rgba(239,68,68,.5);
  box-shadow:0 0 24px rgba(239,68,68,.15), 0 8px 30px rgba(0,0,0,.7);
  transform:translateY(-2px) scale(1.02);
}
.cb-case-card:hover .cb-remove-icon { opacity:1 !important; }
.cb-case-card:hover .cb-remove-bg   { opacity:1 !important; }

/* ── Add case ── */
.cb-add-case {
  position:relative; border-radius:14px; overflow:hidden;
  background:rgba(255,255,255,.018);
  border:2px dashed rgba(168,85,247,.18);
  transition:border-color .25s, background .25s, transform .2s;
  cursor:pointer; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:8px;
}
.cb-add-case:hover {
  border-color:rgba(168,85,247,.5);
  background:rgba(168,85,247,.07);
  transform:translateY(-2px);
}

/* ── Player slot ── */
.cb-slot {
  border-radius:12px;
  transition:border-color .25s, background .25s, box-shadow .2s, transform .15s;
}
.cb-slot:hover { transform:translateY(-1px); }

/* ── Battle mode card ── */
.cb-bmode {
  border-radius:14px; cursor:pointer;
  transition:border-color .25s, background .25s, box-shadow .25s, transform .2s;
  position:relative; overflow:hidden;
}
.cb-bmode:hover { transform:translateY(-1px); }
.cb-bmode.active { box-shadow:0 0 28px rgba(168,85,247,.18); }

/* ── Mode select ── */
.cb-mode-sel {
  appearance:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.75);
  font-family:'Nunito',sans-serif;
  font-weight:800; font-size:13px;
  padding:10px 38px 10px 14px;
  border-radius:12px; outline:none;
  transition:border-color .2s, background .2s;
}
.cb-mode-sel:hover { border-color:rgba(251,191,36,.4); background:rgba(255,255,255,.06); }
.cb-mode-sel:focus { border-color:rgba(251,191,36,.5); }
.cb-mode-sel option { background:#0a0014; color:#fff; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1c0030; border-radius:4px; }

/* ── Divider ── */
.cb-divider {
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
  margin:0 -24px;
}

/* ── Section card ── */
.cb-section {
  position:relative; overflow:hidden; border-radius:20px;
  background:linear-gradient(150deg,#07001210 0%,#0c001e 50%,#060010 100%);
  border:1px solid rgba(255,255,255,.07);
  transition:border-color .3s, box-shadow .3s;
  padding:22px 24px;
}
.cb-section:hover {
  border-color:rgba(251,191,36,.12);
  box-shadow:0 0 0 1px rgba(251,191,36,.05), 0 24px 60px rgba(0,0,0,.75);
}

/* ── Hero ── */
.cb-hero {
  position:relative; overflow:hidden; border-radius:20px;
  background:linear-gradient(120deg,#040010 0%,#0c0025 40%,#160045 70%,#07000f 100%);
  border:1px solid rgba(251,191,36,.1);
  box-shadow:0 0 0 1px rgba(251,191,36,.04), 0 32px 80px rgba(0,0,0,.9), 0 0 80px rgba(168,85,247,.1);
  padding:24px 28px;
}

/* ── Create btn ── */
.cb-create-btn {
  display:flex; align-items:center; gap:8px;
  padding:11px 24px; border-radius:12px; border:none;
  font-family:'Nunito',sans-serif;
  font-weight:900; font-size:14px; letter-spacing:.02em;
  transition:all .2s; cursor:pointer;
}
.cb-create-btn.active {
  background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fde68a 100%);
  color:#000;
  box-shadow:0 0 28px rgba(251,191,36,.4), 0 4px 16px rgba(0,0,0,.3);
}
.cb-create-btn.active:hover {
  transform:translateY(-2px) scale(1.03);
  box-shadow:0 0 40px rgba(251,191,36,.55), 0 8px 24px rgba(0,0,0,.4);
}
.cb-create-btn.disabled {
  background:rgba(255,255,255,.05);
  color:rgba(255,255,255,.18);
  cursor:not-allowed;
}

/* ── Tag / badge ── */
.cb-tag {
  font-size:10px; font-weight:800; padding:2px 9px; border-radius:20px;
  text-transform:uppercase; letter-spacing:.06em;
}
`;

/* ─── Helpers ────────────────────────────────────────────────────── */
export function parseMode(modeLabel) {
  return modeLabel.split('v').map(Number);
}

const MODES = [
  { label: '1v1' },
  { label: '1v1v1' },
  { label: '1v1v1v1' },
  { label: '1v1v1v1v1' },
  { label: '2v2' },
  { label: '3v3' },
  { label: '2v2v2' },
];

const BATTLE_MODES = [
  { key: 'crazy',      icon: '🎭', label: 'Crazy',      desc: 'Lowest amount pulled out wins!' },
  { key: 'terminal',   icon: '⚡', label: 'Terminal',   desc: 'Last case determines the winner.' },
  { key: 'jackpot',    icon: '👑', label: 'Jackpot',    desc: 'Winner by jackpot spin on unboxed values!' },
  { key: 'group',      icon: '🔄', label: 'Group',      desc: 'Profit splits among all players.' },
  { key: 'magic_spin', icon: '✨', label: 'Magic Spin', desc: 'High tier items hidden behind magic spin.' },
  { key: 'fast_mode',  icon: '💨', label: 'Fast Mode',  desc: 'Faster gameplay, reduced animations.' },
];

const BOT_NAMES = ['CrateBot', 'LootBot', 'RNG_Pro', 'ShadowBot', 'CryptoBot', 'NightBot', 'VaultBot', 'GhostBot'];

const TEAM_PALETTE = [
  { color: '#fbbf24', glow: 'rgba(251,191,36,.3)',  bg: 'rgba(251,191,36,.07)', border: 'rgba(251,191,36,.22)' },
  { color: '#a855f7', glow: 'rgba(168,85,247,.3)',  bg: 'rgba(168,85,247,.07)', border: 'rgba(168,85,247,.22)' },
  { color: '#60a5fa', glow: 'rgba(96,165,250,.3)',  bg: 'rgba(96,165,250,.07)', border: 'rgba(96,165,250,.22)' },
  { color: '#34d399', glow: 'rgba(52,211,153,.3)',  bg: 'rgba(52,211,153,.07)', border: 'rgba(52,211,153,.22)' },
];

const RARITY_MAP = {
  legendary: '#fbbf24',
  epic:      '#a855f7',
  rare:      '#60a5fa',
  uncommon:  '#34d399',
  common:    'rgba(255,255,255,.38)',
};

function getRarity(price) {
  if (price >= 5000) return 'legendary';
  if (price >= 1000) return 'epic';
  if (price >= 500)  return 'rare';
  if (price >= 100)  return 'uncommon';
  return 'common';
}

/* ─── Particles ──────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 8 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 18}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 45}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="cb-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size * 4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div
      className="cb-toggle-track"
      style={{ background: on ? 'linear-gradient(90deg,#a855f7,#7c3aed)' : 'rgba(255,255,255,.1)' }}
      onClick={e => { e.stopPropagation(); onChange(); }}>
      <div className="cb-toggle-thumb" style={{ left: on ? '21px' : '3px' }} />
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function SlotAvatar({ slot, color, size = 32 }) {
  const safe = slot?.avatar_url && slot.avatar_url !== 'null' && slot.avatar_url !== 'undefined'
    ? slot.avatar_url : null;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: slot?.isBot
        ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
        : `linear-gradient(135deg,${color}55,${color}22)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 800, color,
      border: `2px solid ${color}44`,
      boxShadow: `0 0 12px ${color}33`,
    }}>
      {safe
        ? <img src={safe} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : slot?.isBot
          ? <Bot style={{ width: size * 0.5, height: size * 0.5, color: '#c084fc' }} />
          : (slot?.name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────── */
function SectionHeader({ children, badge, badgeColor = '#fbbf24', extra }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:3, height:20, borderRadius:2,
          background:'linear-gradient(to bottom,#fbbf24,#a855f7)', flexShrink:0,
        }} />
        <span style={{ fontSize:15, fontWeight:900, color:'#fff', letterSpacing:'.01em' }}>{children}</span>
        {badge != null && (
          <span className="cb-tag" style={{
            background: `${badgeColor}18`,
            color: badgeColor,
            border: `1px solid ${badgeColor}35`,
          }}>{badge}</span>
        )}
      </div>
      {extra}
    </div>
  );
}

/* ─── Case Card ──────────────────────────────────────────────────── */
function CaseCard({ c, onRemove, style = {} }) {
  const rarity = getRarity(c.price);
  const rc = RARITY_MAP[rarity];
  return (
    <div
      className="cb-case-card cb-card-in"
      style={{ width: 96, ...style }}
      onClick={onRemove}>
      {/* Top rarity strip */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${rc},transparent)` }} />

      <div style={{ padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        {/* Image */}
        <div style={{
          width:54, height:54, borderRadius:11, overflow:'hidden',
          background:`linear-gradient(145deg,${rc}18,${rc}07)`,
          border:`1px solid ${rc}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 18px ${rc}1a`,
          position:'relative',
        }}>
          {c.image_url
            ? <img src={c.image_url} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:22 }}>📦</span>}
        </div>

        <p style={{
          fontSize:10, color:'rgba(255,255,255,.5)', textAlign:'center',
          lineHeight:1.2, width:'100%', overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:700,
        }}>{c.name}</p>

        <p style={{ fontSize:10, fontWeight:900, color:rc }}>
          {c.price?.toLocaleString()}
          <span style={{ fontSize:8, opacity:.6 }}> c</span>
        </p>
      </div>

      {/* Remove overlay */}
      <div className="cb-remove-bg" style={{
        position:'absolute', inset:0, borderRadius:14,
        background:'rgba(239,68,68,.0)',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background .2s', zIndex:5, opacity:0,
      }}>
        <div style={{
          width:28, height:28, borderRadius:8,
          background:'rgba(239,68,68,.85)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <X className="cb-remove-icon" style={{
            width:14, height:14, color:'#fff', opacity:0, transition:'opacity .2s',
          }} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function CreateBattle({ cases, balance, user, onBack, onCreate }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker, setShowPicker]       = useState(false);
  const [modeLabel, setModeLabel]         = useState('1v1');
  const [battleModes, setBattleModes]     = useState({});

  const totalCost    = selectedCases.reduce((sum, c) => sum + (c.price || 0), 0);
  const teamSizes    = parseMode(modeLabel);
  const totalPlayers = teamSizes.reduce((a, b) => a + b, 0);
  const overBudget   = totalCost > balance;
  const canCreate    = selectedCases.length > 0 && !overBudget && slots?.[0] != null;

  const safeAvatar   = (url) => (url && url !== 'null' && url !== 'undefined') ? url : null;
  const makeUserSlot = useCallback((u) =>
    u ? {
      name: u.username || u.full_name || 'You',
      email: u.email,
      avatar_url: safeAvatar(u.avatar_url),
      isBot: false,
    } : null,
  []);

  const [slots, setSlots] = useState(() => {
    const s = Array(totalPlayers).fill(null);
    if (user) s[0] = makeUserSlot(user);
    return s;
  });

  useEffect(() => {
    if (!user) return;
    setSlots(prev => {
      const n = [...prev];
      n[0] = makeUserSlot(user);
      return n;
    });
  }, [user?.email, user?.avatar_url, user?.username, user?.full_name]);

  const handleModeChange = (label) => {
    setModeLabel(label);
    const sizes = label.split('v').map(Number);
    const total = sizes.reduce((a, b) => a + b, 0);
    const s = Array(total).fill(null);
    if (user) s[0] = makeUserSlot(user);
    setSlots(s);
  };

  const fillWithBots = () => {
    const usedNames = new Set();
    setSlots(prev => prev.map((slot, i) => {
      if (slot) return slot;
      let name;
      do { name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (usedNames.has(name));
      usedNames.add(name);
      return { name, email: `bot_${i}@system`, isBot: true };
    }));
  };

  const removeSlot = (i) => {
    if (i === 0) return;
    setSlots(prev => { const n = [...prev]; n[i] = null; return n; });
  };

  const addBot = (slotIdx) => {
    const usedNames = new Set(slots.filter(Boolean).map(s => s.name));
    let name;
    do { name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (usedNames.has(name));
    setSlots(prev => {
      const n = [...prev];
      n[slotIdx] = { name, email: `bot_${slotIdx}_${Date.now()}@system`, isBot: true };
      return n;
    });
  };

  const toggleBattleMode = (key) =>
    setBattleModes(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── FIX: stable callback so CasePickerModal never gets a stale ref ── */
  const handleAddCase = useCallback((c) => {
    setSelectedCases(prev => [...prev, c]);
  }, []);

  const handleRemoveCase = useCallback((idx) => {
    setSelectedCases(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const buildTeams = () => {
    const teams = []; let idx = 0;
    for (const size of teamSizes) {
      teams.push(Array.from({ length: size }, (_, j) => idx + j));
      idx += size;
    }
    return teams;
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const players = slots.filter(Boolean);
    onCreate({ selectedCases, modeLabel, teams: buildTeams(), players, battleModes, totalPlayers });
  };

  const allFilled = slots.every(s => s !== null);

  /* ── re-compute canCreate after slots exist ── */
  const _canCreate = selectedCases.length > 0 && !overBudget && slots[0] != null;

  return (
    <div className="cb-root" style={{
      background:'#04000c', minHeight:'100vh', padding:'20px 0 100px',
    }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:880, margin:'0 auto', display:'flex', flexDirection:'column', gap:20, padding:'0 12px' }}>

        {/* ══ Hero Header ══════════════════════════════════════════ */}
        <div className="cb-hero cb-card-in">
          <div className="cb-scan" />
          <div className="cb-grid-bg" />
          <Particles accent="#fbbf24" count={6} />
          <Particles accent="#a855f7" count={4} />

          {/* Ambient right glow */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 45% 70% at 88% 50%,rgba(168,85,247,.18) 0%,transparent 65%)',
          }} />

          {/* Floating icon */}
          <div className="cb-float" style={{
            position:'absolute', right:24, top:'50%', transform:'translateY(-50%)',
            opacity:.12, pointerEvents:'none', zIndex:1,
          }}>
            <Swords style={{ width:80, height:80, color:'#fbbf24' }} />
          </div>

          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
              <button
                onClick={onBack}
                style={{
                  width:34, height:34, borderRadius:10,
                  border:'1px solid rgba(255,255,255,.1)',
                  background:'rgba(255,255,255,.04)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', transition:'all .2s', color:'rgba(255,255,255,.4)',
                  flexShrink:0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor='rgba(251,191,36,.45)';
                  e.currentTarget.style.color='#fbbf24';
                  e.currentTarget.style.background='rgba(251,191,36,.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor='rgba(255,255,255,.1)';
                  e.currentTarget.style.color='rgba(255,255,255,.4)';
                  e.currentTarget.style.background='rgba(255,255,255,.04)';
                }}>
                <ArrowLeft style={{ width:16, height:16 }} />
              </button>

              <div style={{ width:3, height:26, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <Swords style={{ width:20, height:20, color:'#fbbf24' }} />
              <h1 style={{
                fontSize:26, fontWeight:900, color:'#fff', margin:0,
                letterSpacing:'.01em', textShadow:'0 0 30px rgba(251,191,36,.3)',
              }}>Create Battle</h1>

              <span className="cb-tag" style={{
                background:'rgba(251,191,36,.12)', color:'#fbbf24',
                border:'1px solid rgba(251,191,36,.28)',
                animation:'cb-badge-glow 2.5s ease-in-out infinite',
              }}>NEW</span>
            </div>

            <p style={{
              fontSize:12, color:'rgba(255,255,255,.28)', fontWeight:600,
              marginLeft:47, letterSpacing:'.02em',
            }}>
              Configure your case battle — pick cases, build your squad, set the rules
            </p>
          </div>

          {/* Bottom accent line */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.55),rgba(168,85,247,.55),transparent)',
          }} />
        </div>

        {/* ══ Toolbar ══════════════════════════════════════════════ */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12, flexWrap:'wrap',
        }}>
          {/* Cost pill */}
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'10px 18px', borderRadius:14,
            background:'linear-gradient(145deg,#080014,#0f0020)',
            border:`1px solid ${overBudget ? 'rgba(239,68,68,.35)' : 'rgba(251,191,36,.15)'}`,
            boxShadow: overBudget ? '0 0 20px rgba(239,68,68,.1)' : '0 0 20px rgba(251,191,36,.07)',
            transition:'all .25s',
          }}>
            <div style={{
              width:30, height:30, borderRadius:'50%',
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 14px rgba(251,191,36,.45)',
              fontSize:12, fontWeight:900, color:'#000', flexShrink:0,
            }}>
              <Coins style={{ width:14, height:14 }} />
            </div>

            <div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em' }}>
                Battle Cost
              </div>
              <div style={{ fontSize:16, fontWeight:900, color: overBudget ? '#f87171' : '#fbbf24', lineHeight:1.1 }}>
                {totalCost.toLocaleString()}
                <span style={{ fontSize:10, fontWeight:700, opacity:.5, marginLeft:3 }}>coins</span>
              </div>
            </div>

            {overBudget && (
              <span className="cb-tag" style={{
                background:'rgba(239,68,68,.15)', color:'#f87171',
                border:'1px solid rgba(239,68,68,.3)',
              }}>Insufficient</span>
            )}

            {/* Active mode emoji badges */}
            {Object.entries(battleModes).filter(([, v]) => v).map(([k]) => {
              const m = BATTLE_MODES.find(x => x.key === k);
              return m ? (
                <span key={k} title={m.label} style={{
                  fontSize:16, lineHeight:1,
                  filter:'drop-shadow(0 0 4px rgba(255,255,255,.3))',
                }}>{m.icon}</span>
              ) : null;
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Mode selector */}
            <div style={{ position:'relative' }}>
              <select
                value={modeLabel}
                onChange={e => handleModeChange(e.target.value)}
                className="cb-mode-sel">
                {MODES.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
              <ChevronDown style={{
                position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                width:13, height:13, color:'rgba(255,255,255,.35)', pointerEvents:'none',
              }} />
            </div>

            {/* Create battle btn */}
            <button
              onClick={handleCreate}
              disabled={!_canCreate}
              className={`cb-create-btn ${_canCreate ? 'active' : 'disabled'}`}>
              <Plus style={{ width:16, height:16 }} />
              Create Battle
            </button>
          </div>
        </div>

        {/* ══ Selected Cases ═══════════════════════════════════════ */}
        <div className="cb-section cb-shim cb-card-in" style={{ animationDelay:'.05s' }}>
          <div className="cb-scan" />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.12),rgba(168,85,247,.12),transparent)' }} />

          <SectionHeader
            badge={selectedCases.length > 0 ? `${selectedCases.length} case${selectedCases.length !== 1 ? 's' : ''}` : undefined}>
            Selected Cases
          </SectionHeader>

          {selectedCases.length === 0 && (
            <div style={{
              padding:'20px 0', textAlign:'center',
              color:'rgba(255,255,255,.18)', fontSize:12, fontWeight:700,
              letterSpacing:'.04em',
            }}>
              No cases selected — click <span style={{ color:'rgba(168,85,247,.6)' }}>Add Case</span> to begin
            </div>
          )}

          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {selectedCases.map((c, i) => (
              <CaseCard key={`${c.id ?? c.name}-${i}`} c={c} onRemove={() => handleRemoveCase(i)} />
            ))}

            {/* Add case tile */}
            <div
              className="cb-add-case"
              style={{ width:96, height:128 }}
              onClick={() => setShowPicker(true)}>
              <div style={{
                width:38, height:38, borderRadius:11,
                border:'2px dashed rgba(168,85,247,.28)',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'border-color .2s, background .2s',
              }}>
                <Plus style={{ width:18, height:18, color:'rgba(168,85,247,.55)' }} />
              </div>
              <span style={{ fontSize:11, color:'rgba(168,85,247,.5)', fontWeight:800, letterSpacing:'.02em' }}>Add Case</span>
            </div>
          </div>
        </div>

        {/* ══ Players / Teams ══════════════════════════════════════ */}
        <div className="cb-section cb-shim cb-card-in" style={{ animationDelay:'.1s' }}>
          <div className="cb-scan" />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(168,85,247,.12),rgba(251,191,36,.12),transparent)' }} />

          <SectionHeader
            badge={modeLabel}
            badgeColor="#c084fc"
            extra={!allFilled && (
              <button
                onClick={fillWithBots}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 14px', borderRadius:10,
                  background:'rgba(168,85,247,.08)',
                  border:'1px solid rgba(168,85,247,.28)',
                  color:'#c084fc', fontSize:12, fontWeight:800,
                  fontFamily:'Nunito,sans-serif', cursor:'pointer',
                  transition:'all .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background='rgba(168,85,247,.18)';
                  e.currentTarget.style.transform='translateY(-1px)';
                  e.currentTarget.style.boxShadow='0 4px 16px rgba(168,85,247,.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background='rgba(168,85,247,.08)';
                  e.currentTarget.style.transform='translateY(0)';
                  e.currentTarget.style.boxShadow='none';
                }}>
                <Bot style={{ width:13, height:13 }} />
                Fill with Bots
              </button>
            )}>
            Players
          </SectionHeader>

          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {teamSizes.map((size, ti) => {
              const startIdx = teamSizes.slice(0, ti).reduce((a, b) => a + b, 0);
              const pal = TEAM_PALETTE[ti % TEAM_PALETTE.length];
              return (
                <div key={ti} style={{
                  flex:1, minWidth:150,
                  padding:'14px', borderRadius:14,
                  background:`${pal.bg.replace('.07', '.035')}`,
                  border:`1px solid ${pal.border.replace('.22', '.15')}`,
                }}>
                  {/* Team label */}
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:11 }}>
                    <div style={{
                      width:7, height:7, borderRadius:'50%',
                      background:pal.color, boxShadow:`0 0 10px ${pal.glow}`,
                    }} />
                    <span style={{
                      fontSize:11, fontWeight:900, color:pal.color,
                      textTransform:'uppercase', letterSpacing:'.12em',
                    }}>Team {ti + 1}</span>
                    <span style={{
                      fontSize:9, color:'rgba(255,255,255,.22)', fontWeight:700,
                    }}>({size})</span>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {Array.from({ length: size }, (_, j) => {
                      const slotIdx = startIdx + j;
                      const slot = slots[slotIdx];
                      return (
                        <div
                          key={slotIdx}
                          className="cb-slot"
                          style={{
                            display:'flex', alignItems:'center', gap:9,
                            padding:'8px 10px',
                            background: slot ? pal.bg : 'rgba(255,255,255,.02)',
                            border:`1px solid ${slot ? pal.border : 'rgba(255,255,255,.06)'}`,
                            boxShadow: slot ? `0 0 14px ${pal.glow.replace('.3', '.15')}` : 'none',
                          }}>
                          {slot ? (
                            <>
                              <SlotAvatar slot={slot} color={pal.color} size={28} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{
                                  fontSize:12, fontWeight:800, color:'#fff',
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                }}>{slot.name}</p>
                                {slot.isBot && (
                                  <p style={{
                                    fontSize:9, fontWeight:900, color:pal.color,
                                    textTransform:'uppercase', letterSpacing:'.1em',
                                  }}>BOT</p>
                                )}
                              </div>
                              {slotIdx !== 0 && (
                                <button
                                  onClick={() => removeSlot(slotIdx)}
                                  style={{
                                    width:20, height:20, borderRadius:6, border:'none',
                                    background:'rgba(239,68,68,.12)', color:'#f87171',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    cursor:'pointer', flexShrink:0, transition:'background .15s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.28)'}
                                  onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.12)'}>
                                  <X style={{ width:10, height:10 }} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div
                              style={{ display:'flex', alignItems:'center', gap:8, flex:1, cursor:'pointer' }}
                              onClick={() => addBot(slotIdx)}>
                              <div style={{
                                width:28, height:28, borderRadius:'50%', flexShrink:0,
                                border:`2px dashed ${pal.border}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                transition:'border-color .2s, background .2s',
                              }}>
                                <Bot style={{ width:12, height:12, color:pal.color, opacity:.45 }} />
                              </div>
                              <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:700 }}>
                                + Add bot
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Battle Modes ═════════════════════════════════════════ */}
        <div className="cb-section cb-shim cb-card-in" style={{ animationDelay:'.15s' }}>
          <div className="cb-scan" />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(96,165,250,.12),rgba(168,85,247,.12),transparent)' }} />

          <SectionHeader>Battle Mode</SectionHeader>

          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(235px,1fr))',
            gap:10,
          }}>
            {BATTLE_MODES.map(m => {
              const on = !!battleModes[m.key];
              return (
                <div
                  key={m.key}
                  className={`cb-bmode ${on ? 'active' : ''}`}
                  onClick={() => toggleBattleMode(m.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'13px 14px',
                    background: on ? 'rgba(168,85,247,.09)' : 'rgba(255,255,255,.022)',
                    border:`1px solid ${on ? 'rgba(168,85,247,.38)' : 'rgba(255,255,255,.07)'}`,
                    transition:'all .25s',
                  }}>
                  {/* Active left bar */}
                  {on && (
                    <div style={{
                      position:'absolute', left:0, top:0, bottom:0, width:2,
                      background:'linear-gradient(to bottom,#fbbf24,#a855f7)',
                      borderRadius:'2px 0 0 2px',
                    }} />
                  )}

                  <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}>{m.icon}</span>

                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{
                      fontSize:13, fontWeight:800,
                      color: on ? '#fff' : 'rgba(255,255,255,.55)',
                      marginBottom:2, transition:'color .2s',
                    }}>{m.label}</p>
                    <p style={{
                      fontSize:10, color:'rgba(255,255,255,.28)', lineHeight:1.35,
                      overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                    }}>{m.desc}</p>
                  </div>

                  <Toggle on={on} onChange={() => toggleBattleMode(m.key)} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Error Banner ═════════════════════════════════════════ */}
        {overBudget && (
          <div className="cb-card-in" style={{
            display:'flex', alignItems:'center', gap:10, padding:'13px 18px', borderRadius:12,
            background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.28)',
            color:'#f87171', fontSize:13, fontWeight:700,
          }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <span>
              Insufficient balance — need{' '}
              <strong>{totalCost.toLocaleString()}</strong> coins but you have{' '}
              <strong>{balance?.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ══ Case Picker Modal ════════════════════════════════════ */}
      <CasePickerModal
        open={showPicker}
        onOpenChange={setShowPicker}
        cases={cases}
        onAddCase={handleAddCase}
      />
    </div>
  );
}