import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ChevronDown, Bot, Swords, Zap, Crown } from 'lucide-react';
import CasePickerModal from './CasePickerModal';
import { getRarityColor, getRarityGlow } from './useWallet';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.cb-root { font-family: 'Nunito', sans-serif; }

@keyframes cb-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.cb-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:cb-scan 7s linear infinite; pointer-events:none;
}

@keyframes cb-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.cb-shim { position:relative; overflow:hidden; }
.cb-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.04),transparent);
  animation:cb-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes cb-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.5; }
  100% { transform:translateY(-80px) translateX(var(--dx)); opacity:0; }
}
.cb-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:cb-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes cb-hex-pulse {
  0%,100% { opacity:.02; }
  50%     { opacity:.05; }
}
.cb-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.035) 1px, transparent 1px);
  background-size:32px 32px;
  animation:cb-hex-pulse 5s ease-in-out infinite;
}

@keyframes cb-border-glow {
  0%,100% { opacity:.5; }
  50%     { opacity:1; }
}

@keyframes cb-float {
  0%,100% { transform:translateY(0px) rotate(-5deg); }
  50%     { transform:translateY(-8px) rotate(5deg); }
}
.cb-float { animation:cb-float 4s ease-in-out infinite; }

@keyframes cb-pulse-ring {
  0%   { transform:scale(1); opacity:.7; }
  100% { transform:scale(2.5); opacity:0; }
}
.cb-ring { animation:cb-pulse-ring 1.8s ease-out infinite; }

.cb-toggle-track {
  width:38px; height:20px; border-radius:999px;
  position:relative; transition:background .25s; cursor:pointer; flex-shrink:0;
}
.cb-toggle-thumb {
  position:absolute; top:2px; width:16px; height:16px; border-radius:50%;
  background:#fff; transition:left .25s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 1px 4px rgba(0,0,0,.4);
}

.cb-mode-btn {
  appearance:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.7);
  font-family:'Nunito',sans-serif;
  font-weight:800; font-size:13px;
  padding:9px 36px 9px 14px;
  border-radius:12px; outline:none;
  transition:border-color .2s, background .2s;
}
.cb-mode-btn:hover { border-color:rgba(251,191,36,.4); background:rgba(255,255,255,.06); }
.cb-mode-btn:focus { border-color:rgba(251,191,36,.5); }
.cb-mode-btn option { background:#0d000a; color:#fff; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }

.cb-case-card {
  position:relative; border-radius:14px; overflow:hidden;
  background:linear-gradient(145deg,#0a0018,#110020);
  border:1px solid rgba(255,255,255,.08);
  transition:border-color .25s, box-shadow .25s, transform .2s;
  cursor:pointer;
}
.cb-case-card:hover {
  border-color:rgba(251,191,36,.3);
  box-shadow:0 0 28px rgba(251,191,36,.12), 0 8px 32px rgba(0,0,0,.6);
  transform:translateY(-2px);
}

.cb-add-case {
  position:relative; border-radius:14px; overflow:hidden;
  background:rgba(255,255,255,.02);
  border:2px dashed rgba(255,255,255,.1);
  transition:border-color .25s, background .25s, transform .2s;
  cursor:pointer; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:8px;
}
.cb-add-case:hover {
  border-color:rgba(168,85,247,.45);
  background:rgba(168,85,247,.06);
  transform:translateY(-2px);
}

.cb-slot {
  border-radius:12px;
  transition:border-color .25s, background .25s, box-shadow .2s;
}

.cb-battle-mode-card {
  border-radius:14px;
  transition:border-color .25s, background .25s, box-shadow .25s, transform .2s;
  cursor:pointer;
}
.cb-battle-mode-card:hover {
  transform:translateY(-1px);
}
.cb-battle-mode-card.active {
  box-shadow:0 0 24px rgba(168,85,247,.2);
}

@keyframes cb-mode-enter {
  from { opacity:0; transform:scale(.95) translateY(8px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
.cb-dropdown-item {
  transition:background .15s, color .15s;
}
.cb-dropdown-item:hover {
  background:rgba(251,191,36,.08);
  color:#fbbf24;
}
.cb-dropdown-item.selected {
  background:rgba(251,191,36,.12);
  color:#fbbf24;
}
`;

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

const BOT_NAMES = ['CrateBot', 'LootBot', 'RNG_Pro', 'ShadowBot', 'CryptoBot', 'NightBot'];

const TEAM_PALETTE = [
  { color: '#fbbf24', glow: 'rgba(251,191,36,.25)', bg: 'rgba(251,191,36,.08)', border: 'rgba(251,191,36,.25)' },
  { color: '#a855f7', glow: 'rgba(168,85,247,.25)',  bg: 'rgba(168,85,247,.08)',  border: 'rgba(168,85,247,.25)'  },
  { color: '#60a5fa', glow: 'rgba(96,165,250,.25)',   bg: 'rgba(96,165,250,.08)',   border: 'rgba(96,165,250,.25)'   },
  { color: '#34d399', glow: 'rgba(52,211,153,.25)',   bg: 'rgba(52,211,153,.08)',   border: 'rgba(52,211,153,.25)'   },
];

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 8 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 20}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 40}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="cb-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Section Card ───────────────────────────────────────────────── */
function SectionCard({ children, style = {} }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      className="cb-shim"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:'relative', overflow:'hidden', borderRadius:18,
        background:'linear-gradient(145deg,#080012 0%,#0e001c 60%,#040009 100%)',
        border:`1px solid ${hov ? 'rgba(251,191,36,.16)' : 'rgba(255,255,255,.07)'}`,
        boxShadow: hov
          ? '0 0 0 1px rgba(251,191,36,.08), 0 20px 60px rgba(0,0,0,.8)'
          : '0 8px 32px rgba(0,0,0,.6)',
        transition:'border-color .3s, box-shadow .3s',
        padding:'22px 24px',
        ...style,
      }}>
      <div className="cb-scan" />
      {/* Top accent bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:2,
        background: hov
          ? 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)'
          : 'linear-gradient(90deg,transparent,rgba(251,191,36,.15),rgba(168,85,247,.15),transparent)',
        transition:'background .3s',
      }} />
      {children}
    </div>
  );
}

/* ─── Section Label ──────────────────────────────────────────────── */
function SectionLabel({ children, badge }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
      <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)', flexShrink:0 }} />
      <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>{children}</span>
      {badge != null && (
        <span style={{
          fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20,
          background:'rgba(251,191,36,.12)', color:'#fbbf24',
          border:'1px solid rgba(251,191,36,.25)',
        }}>{badge}</span>
      )}
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div
      className="cb-toggle-track"
      style={{ background: on ? 'linear-gradient(90deg,#a855f7,#7c3aed)' : 'rgba(255,255,255,.1)' }}
      onClick={onChange}>
      <div className="cb-toggle-thumb" style={{ left: on ? '20px' : '2px' }} />
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function SlotAvatar({ slot, color, size = 32 }) {
  const safe = slot?.avatar_url && slot.avatar_url !== 'null' && slot.avatar_url !== 'undefined'
    ? slot.avatar_url : null;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      background: slot?.isBot
        ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
        : `linear-gradient(135deg,${color}55,${color}33)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size * 0.4, fontWeight:800, color,
      border:`2px solid ${color}44`,
      boxShadow:`0 0 10px ${color}33`,
    }}>
      {safe
        ? <img src={safe} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : slot?.isBot ? '🤖' : (slot?.name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

export default function CreateBattle({ cases, balance, user, onBack, onCreate }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker, setShowPicker]         = useState(false);
  const [modeLabel, setModeLabel]           = useState('1v1');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [battleModes, setBattleModes]       = useState({});

  const totalCost   = selectedCases.reduce((sum, c) => sum + c.price, 0);
  const teamSizes   = parseMode(modeLabel);
  const totalPlayers = teamSizes.reduce((a, b) => a + b, 0);

  const safeAvatar  = (url) => (url && url !== 'null' && url !== 'undefined') ? url : null;
  const makeUserSlot = (u) => u ? { name: u.username || u.full_name || 'You', email: u.email, avatar_url: safeAvatar(u.avatar_url), isBot: false } : null;

  const [slots, setSlots] = useState(() => {
    const s = Array(totalPlayers).fill(null);
    if (user) s[0] = makeUserSlot(user);
    return s;
  });

  useEffect(() => {
    if (!user) return;
    setSlots(prev => { const n = [...prev]; n[0] = makeUserSlot(user); return n; });
  }, [user?.email, user?.avatar_url, user?.username, user?.full_name]);

  const handleModeChange = (label) => {
    setModeLabel(label);
    const sizes = label.split('v').map(Number);
    const total = sizes.reduce((a, b) => a + b, 0);
    const s = Array(total).fill(null);
    if (user) s[0] = makeUserSlot(user);
    setSlots(s);
    setShowModeDropdown(false);
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
    setSlots(prev => { const n = [...prev]; n[slotIdx] = { name, email: `bot_${slotIdx}_${Date.now()}@system`, isBot: true }; return n; });
  };

  const toggleBattleMode = (key) => setBattleModes(prev => ({ ...prev, [key]: !prev[key] }));

  const buildTeams = () => {
    const teams = []; let idx = 0;
    for (const size of teamSizes) { teams.push(Array.from({ length: size }, (_, j) => idx + j)); idx += size; }
    return teams;
  };

  const handleCreate = () => {
    if (selectedCases.length === 0 || totalCost > balance) return;
    const players = slots.filter(Boolean);
    onCreate({ selectedCases, modeLabel, teams: buildTeams(), players, battleModes, totalPlayers });
  };

  const allFilled  = slots.every(s => s !== null);
  const canCreate  = selectedCases.length > 0 && totalCost <= balance && slots[0] !== null;
  const overBudget = totalCost > balance;

  return (
    <div className="cb-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:22 }}>

        {/* ── Hero Header ── */}
        <div style={{
          position:'relative', overflow:'hidden', borderRadius:18,
          background:'linear-gradient(120deg,#04000a 0%,#0e0020 40%,#160040 70%,#080010 100%)',
          border:'1px solid rgba(251,191,36,.12)',
          boxShadow:'0 0 0 1px rgba(251,191,36,.06), 0 32px 80px rgba(0,0,0,.85), 0 0 100px rgba(168,85,247,.1)',
          padding:'26px 28px', minHeight:110,
        }}>
          <div className="cb-scan" />
          <div className="cb-hex" />
          <Particles accent="#fbbf24" count={7} />
          <Particles accent="#a855f7" count={5} />

          {/* Ambient glow */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 50% 80% at 85% 50%,rgba(168,85,247,.16) 0%,transparent 60%)',
          }} />

          {/* Floating deco icon */}
          <div className="cb-float" style={{
            position:'absolute', right:28, top:'50%', transform:'translateY(-50%)',
            opacity:.14, pointerEvents:'none',
          }}>
            <Swords style={{ width:72, height:72, color:'#fbbf24' }} />
          </div>

          {/* Back + Title */}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <button
                onClick={onBack}
                style={{
                  width:32, height:32, borderRadius:10, border:'1px solid rgba(255,255,255,.12)',
                  background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center',
                  justifyContent:'center', cursor:'pointer', transition:'all .2s', color:'rgba(255,255,255,.5)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(251,191,36,.4)'; e.currentTarget.style.color='#fbbf24'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
                <ArrowLeft style={{ width:15, height:15 }} />
              </button>
              <div style={{ width:3, height:24, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <Swords style={{ width:18, height:18, color:'#fbbf24' }} />
              <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', margin:0 }}>Create Battle</h1>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:600, marginLeft:45 }}>
              Pick your cases, set your squad, choose your rules
            </p>
          </div>

          {/* Bottom accent */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.5),transparent)',
          }} />
        </div>

        {/* ── Toolbar Row: Cost + Mode + Create ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12, flexWrap:'wrap',
        }}>
          {/* Cost display */}
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 18px', borderRadius:14,
            background:'linear-gradient(145deg,#080012,#0e001c)',
            border:`1px solid ${overBudget ? 'rgba(239,68,68,.3)' : 'rgba(251,191,36,.15)'}`,
            boxShadow: overBudget ? '0 0 24px rgba(239,68,68,.1)' : '0 0 24px rgba(251,191,36,.08)',
          }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 12px rgba(251,191,36,.4)',
              fontSize:11, fontWeight:900, color:'#000',
            }}>$</div>
            <div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>Battle Cost</div>
              <div style={{ fontSize:15, fontWeight:900, color: overBudget ? '#f87171' : '#fbbf24' }}>
                {totalCost.toLocaleString()} <span style={{ fontSize:10, fontWeight:700, opacity:.6 }}>coins</span>
              </div>
            </div>
            {overBudget && (
              <span style={{
                fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20,
                background:'rgba(239,68,68,.15)', color:'#f87171',
                border:'1px solid rgba(239,68,68,.3)', textTransform:'uppercase',
              }}>Insufficient</span>
            )}
            {/* Active mode emojis */}
            {Object.entries(battleModes).filter(([,v]) => v).map(([k]) => {
              const m = BATTLE_MODES.find(x => x.key === k);
              return m ? <span key={k} style={{ fontSize:15 }} title={m.label}>{m.icon}</span> : null;
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Mode dropdown */}
            <div style={{ position:'relative' }}>
              <div style={{ position:'relative' }}>
                <select
                  value={modeLabel}
                  onChange={e => handleModeChange(e.target.value)}
                  className="cb-mode-btn">
                  {MODES.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                </select>
                <ChevronDown style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  width:14, height:14, color:'rgba(255,255,255,.4)', pointerEvents:'none',
                }} />
              </div>
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 22px', borderRadius:12, border:'none',
                cursor: canCreate ? 'pointer' : 'not-allowed',
                background: canCreate
                  ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#fde68a 100%)'
                  : 'rgba(255,255,255,.06)',
                color: canCreate ? '#000' : 'rgba(255,255,255,.2)',
                fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
                boxShadow: canCreate ? '0 0 32px rgba(251,191,36,.45)' : 'none',
                transition:'all .2s',
                transform:'translateY(0)',
              }}
              onMouseEnter={e => canCreate && (e.currentTarget.style.transform='translateY(-2px) scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform='translateY(0) scale(1)')}>
              <Plus style={{ width:16, height:16 }} />
              Create Battle
            </button>
          </div>
        </div>

        {/* ── Selected Cases ── */}
        <SectionCard>
          <SectionLabel badge={selectedCases.length > 0 ? `${selectedCases.length} case${selectedCases.length !== 1 ? 's' : ''}` : null}>
            Selected Cases
          </SectionLabel>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
            {selectedCases.map((c, i) => {
              const rarity = c.price >= 5000 ? 'legendary' : c.price >= 1000 ? 'epic' : c.price >= 500 ? 'rare' : c.price >= 100 ? 'uncommon' : 'common';
              const RARITY_COLORS = { legendary:'#fbbf24', epic:'#a855f7', rare:'#60a5fa', uncommon:'#34d399', common:'rgba(255,255,255,.4)' };
              const rc = RARITY_COLORS[rarity];
              return (
                <div
                  key={i}
                  className="cb-case-card"
                  style={{ width:100 }}
                  onClick={() => setSelectedCases(prev => prev.filter((_, idx) => idx !== i))}>
                  {/* Rarity glow accent */}
                  <div style={{ height:2, background:`linear-gradient(90deg,transparent,${rc},transparent)` }} />
                  <div style={{ padding:'10px 8px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{
                      width:56, height:56, borderRadius:12, overflow:'hidden',
                      background:`linear-gradient(145deg,${rc}18,${rc}08)`,
                      border:`1px solid ${rc}33`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 20px ${rc}22`,
                    }}>
                      {c.image_url
                        ? <img src={c.image_url} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:22 }}>📦</span>}
                    </div>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,.55)', textAlign:'center', lineHeight:1.2, width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                    <p style={{ fontSize:10, fontWeight:900, color:rc }}>{c.price?.toLocaleString()}</p>
                  </div>
                  {/* Remove hover overlay */}
                  <div className="cb-remove-overlay" style={{
                    position:'absolute', inset:0, borderRadius:14,
                    background:'rgba(239,68,68,.0)', display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'background .2s', zIndex:5,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.18)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.0)'}>
                    <X style={{ width:18, height:18, color:'#f87171', opacity:0, transition:'opacity .2s' }}
                      ref={el => el && el.closest('.cb-case-card').addEventListener('mouseenter', () => el.style.opacity='1')}
                    />
                  </div>
                </div>
              );
            })}

            {/* Add case button */}
            <div
              className="cb-add-case"
              style={{ width:100, height:130 }}
              onClick={() => setShowPicker(true)}>
              <div style={{
                width:36, height:36, borderRadius:10, border:'2px dashed rgba(168,85,247,.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Plus style={{ width:18, height:18, color:'rgba(168,85,247,.5)' }} />
              </div>
              <span style={{ fontSize:11, color:'rgba(168,85,247,.5)', fontWeight:700 }}>Add Case</span>
            </div>
          </div>
        </SectionCard>

        {/* ── Players / Teams ── */}
        <SectionCard>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)', flexShrink:0 }} />
              <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>Players</span>
              <span style={{
                fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20,
                background:'rgba(168,85,247,.12)', color:'#c084fc',
                border:'1px solid rgba(168,85,247,.25)',
              }}>{modeLabel}</span>
            </div>

            {!allFilled && (
              <button
                onClick={fillWithBots}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 14px', borderRadius:10,
                  background:'rgba(168,85,247,.1)', border:'1px solid rgba(168,85,247,.3)',
                  color:'#c084fc', fontSize:12, fontWeight:800, fontFamily:'Nunito,sans-serif',
                  cursor:'pointer', transition:'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(168,85,247,.2)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(168,85,247,.1)'; e.currentTarget.style.transform='translateY(0)'; }}>
                <Bot style={{ width:13, height:13 }} /> Fill with Bots
              </button>
            )}
          </div>

          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {teamSizes.map((size, ti) => {
              const startIdx = teamSizes.slice(0, ti).reduce((a, b) => a + b, 0);
              const pal = TEAM_PALETTE[ti % TEAM_PALETTE.length];
              return (
                <div key={ti} style={{ flex:1, minWidth:140 }}>
                  {/* Team header */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:pal.color, boxShadow:`0 0 8px ${pal.glow}` }} />
                    <span style={{ fontSize:11, fontWeight:900, color:pal.color, textTransform:'uppercase', letterSpacing:'.1em' }}>
                      Team {ti + 1}
                    </span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,.2)', fontWeight:700 }}>({size})</span>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {Array.from({ length: size }, (_, j) => {
                      const slotIdx = startIdx + j;
                      const slot    = slots[slotIdx];
                      return (
                        <div
                          key={slotIdx}
                          className="cb-slot"
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'9px 12px',
                            background: slot ? pal.bg : 'rgba(255,255,255,.02)',
                            border:`1px solid ${slot ? pal.border : 'rgba(255,255,255,.07)'}`,
                            boxShadow: slot ? `0 0 16px ${pal.glow}` : 'none',
                          }}>
                          {slot ? (
                            <>
                              <SlotAvatar slot={slot} color={pal.color} size={30} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:12, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{slot.name}</p>
                                {slot.isBot && (
                                  <p style={{ fontSize:9, fontWeight:800, color:pal.color, textTransform:'uppercase', letterSpacing:'.1em' }}>BOT</p>
                                )}
                              </div>
                              {slotIdx !== 0 && (
                                <button
                                  onClick={() => removeSlot(slotIdx)}
                                  style={{
                                    width:20, height:20, borderRadius:6, border:'none',
                                    background:'rgba(239,68,68,.15)', color:'#f87171',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    cursor:'pointer', flexShrink:0, transition:'background .15s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,.3)'}
                                  onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,.15)'}>
                                  <X style={{ width:10, height:10 }} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div
                              style={{ display:'flex', alignItems:'center', gap:8, flex:1, cursor:'pointer' }}
                              onClick={() => addBot(slotIdx)}>
                              <div style={{
                                width:30, height:30, borderRadius:'50%', flexShrink:0,
                                border:`2px dashed ${pal.border}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                              }}>
                                <Bot style={{ width:13, height:13, color:pal.color, opacity:.5 }} />
                              </div>
                              <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:700 }}>Add bot</span>
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
        </SectionCard>

        {/* ── Battle Modes ── */}
        <SectionCard>
          <SectionLabel>Battle Mode</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
            {BATTLE_MODES.map(m => {
              const on = !!battleModes[m.key];
              return (
                <div
                  key={m.key}
                  className={`cb-battle-mode-card ${on ? 'active' : ''}`}
                  onClick={() => toggleBattleMode(m.key)}
                  style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    background: on ? 'rgba(168,85,247,.1)' : 'rgba(255,255,255,.025)',
                    border:`1px solid ${on ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.07)'}`,
                    position:'relative', overflow:'hidden',
                  }}>
                  {/* Accent bar on active */}
                  {on && (
                    <div style={{
                      position:'absolute', left:0, top:0, bottom:0, width:2,
                      background:'linear-gradient(to bottom,#fbbf24,#a855f7)',
                    }} />
                  )}
                  <span style={{ fontSize:20, flexShrink:0 }}>{m.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:800, color: on ? '#fff' : 'rgba(255,255,255,.6)', marginBottom:2 }}>{m.label}</p>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{m.desc}</p>
                  </div>
                  <Toggle on={on} onChange={() => toggleBattleMode(m.key)} />
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── Error Banner ── */}
        {overBudget && (
          <div style={{
            display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12,
            background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
            color:'#f87171', fontSize:13, fontWeight:700,
          }}>
            <span style={{ fontSize:16 }}>⚠️</span>
            Insufficient balance — need {totalCost.toLocaleString()} coins but you have {balance?.toLocaleString()}
          </div>
        )}
      </div>

      <CasePickerModal
        open={showPicker}
        onOpenChange={setShowPicker}
        cases={cases}
        onAddCase={(c) => setSelectedCases(prev => [...prev, c])}
      />
    </div>
  );
}