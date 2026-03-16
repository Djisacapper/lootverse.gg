import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, X, Bot, Swords, Coins } from 'lucide-react';
import CasePickerModal from './CasePickerModal';

/* ─── parseMode export ───────────────────────────────────────────── */
export function parseMode(modeLabel) {
  return modeLabel.split('v').map(Number);
}

/* ─── Constants ─────────────────────────────────────────────────── */
const MODES = ['1v1','1v1v1','1v1v1v1','1v1v1v1v1','2v2','3v3','2v2v2'];

const BATTLE_MODES = [
  { key:'crazy',      emoji:'🎭', label:'Crazy',      desc:'Lowest amount pulled wins!',                color:'#fb923c' },
  { key:'terminal',   emoji:'⚡', label:'Terminal',   desc:'Last case determines the winner.',           color:'#facc15' },
  { key:'jackpot',    emoji:'👑', label:'Jackpot',    desc:'Winner by jackpot spin on unboxed values!',  color:'#f472b6' },
  { key:'group',      emoji:'🔄', label:'Group',      desc:'Profit splits among all players.',           color:'#34d399' },
  { key:'magic_spin', emoji:'✨', label:'Magic Spin', desc:'High-tier items hidden behind magic spin.',  color:'#a78bfa' },
  { key:'fast_mode',  emoji:'💨', label:'Fast Mode',  desc:'Faster gameplay, reduced animations.',       color:'#60a5fa' },
];

const BOT_NAMES = ['CrateBot','LootBot','RNG_Pro','ShadowBot','CryptoBot','NightBot','VaultBot','GhostBot'];

const TEAM_COLORS = [
  { base:'#fbbf24', dim:'rgba(251,191,36,.1)',  border:'rgba(251,191,36,.25)', glow:'rgba(251,191,36,.15)' },
  { base:'#a855f7', dim:'rgba(168,85,247,.1)',  border:'rgba(168,85,247,.25)', glow:'rgba(168,85,247,.15)' },
  { base:'#38bdf8', dim:'rgba(56,189,248,.1)',  border:'rgba(56,189,248,.25)', glow:'rgba(56,189,248,.15)' },
  { base:'#4ade80', dim:'rgba(74,222,128,.1)',  border:'rgba(74,222,128,.25)', glow:'rgba(74,222,128,.15)' },
];

function getRarityColor(price) {
  if (price >= 5000) return '#fbbf24';
  if (price >= 1000) return '#c084fc';
  if (price >= 500)  return '#60a5fa';
  if (price >= 100)  return '#4ade80';
  return 'rgba(255,255,255,.38)';
}

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

.cb-root { font-family:'DM Sans',sans-serif; }
.cb-mono { font-family:'Space Mono',monospace; }

@keyframes cb-sweep {
  0%   { transform:translateY(-100%); }
  100% { transform:translateY(110vh); }
}
.cb-sweep {
  position:absolute; left:0; right:0; height:80px;
  background:linear-gradient(to bottom,transparent,rgba(168,85,247,.04),transparent);
  animation:cb-sweep 7s linear infinite; pointer-events:none; z-index:0;
}

@keyframes cb-dot-blink {
  0%,100% { opacity:1; } 50% { opacity:.25; }
}
.cb-dot-blink { animation:cb-dot-blink 1.8s ease-in-out infinite; }

@keyframes cb-slide-in {
  from { opacity:0; transform:translateY(16px) scale(.98); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.cb-in   { animation:cb-slide-in .38s cubic-bezier(.22,1,.36,1) both; }
.cb-in-1 { animation-delay:.07s; }
.cb-in-2 { animation-delay:.14s; }
.cb-in-3 { animation-delay:.21s; }

@keyframes cb-bar-glow {
  0%,100% { opacity:.7; } 50% { opacity:1; }
}

/* toggle */
.cb-toggle {
  width:42px; height:23px; border-radius:999px;
  position:relative; cursor:pointer;
  transition:background .22s; flex-shrink:0;
}
.cb-knob {
  position:absolute; top:3px; width:17px; height:17px; border-radius:50%;
  background:#fff; transition:left .22s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 2px 6px rgba(0,0,0,.5);
}

/* case tile */
.cb-tile {
  width:90px; border-radius:13px; position:relative; overflow:hidden;
  background:linear-gradient(155deg,#0d001f,#060012);
  border:1px solid rgba(255,255,255,.07); cursor:pointer;
  transition:transform .2s, border-color .2s, box-shadow .2s;
}
.cb-tile:hover {
  transform:translateY(-4px) scale(1.04);
  border-color:rgba(239,68,68,.5);
  box-shadow:0 12px 32px rgba(0,0,0,.75),0 0 20px rgba(239,68,68,.12);
}
.cb-tile:hover .cb-del { opacity:1 !important; }

/* add tile */
.cb-add {
  width:90px; border-radius:13px;
  border:2px dashed rgba(255,255,255,.09);
  background:rgba(255,255,255,.015); cursor:pointer;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:7px;
  transition:all .22s;
}
.cb-add:hover {
  border-color:rgba(168,85,247,.5);
  background:rgba(168,85,247,.07);
  transform:translateY(-4px);
}

/* slot */
.cb-slot {
  display:flex; align-items:center; gap:9px; padding:9px 11px;
  border-radius:10px; border:1px solid transparent;
  transition:all .2s;
}

/* mode pills */
.cb-mode-pill {
  padding:8px 15px; border-radius:9px; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  border:1px solid rgba(255,255,255,.08);
  background:transparent; color:rgba(255,255,255,.4);
  transition:all .18s; white-space:nowrap;
}
.cb-mode-pill:hover {
  border-color:rgba(251,191,36,.35);
  color:rgba(255,255,255,.8);
  background:rgba(251,191,36,.06);
}
.cb-mode-pill.active {
  border-color:rgba(251,191,36,.55);
  color:#fbbf24;
  background:rgba(251,191,36,.1);
  box-shadow:0 0 14px rgba(251,191,36,.1);
}

/* rule row */
.cb-rule {
  display:flex; align-items:center; gap:12px; padding:12px 15px;
  border-radius:12px; cursor:pointer; position:relative; overflow:hidden;
  border:1px solid rgba(255,255,255,.06);
  background:rgba(255,255,255,.018);
  transition:all .2s;
}
.cb-rule:hover {
  background:rgba(255,255,255,.04);
  border-color:rgba(255,255,255,.12);
  transform:translateX(4px);
}
.cb-rule.on { background:rgba(255,255,255,.04); }

/* create cta */
.cb-create {
  display:flex; align-items:center; gap:8px;
  padding:12px 26px; border-radius:12px; border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700;
  transition:all .22s; letter-spacing:.02em;
}
.cb-create.active {
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  color:#000;
  box-shadow:0 0 28px rgba(251,191,36,.3),0 4px 14px rgba(0,0,0,.4);
}
.cb-create.active:hover {
  transform:translateY(-2px) scale(1.03);
  box-shadow:0 0 44px rgba(251,191,36,.5),0 8px 22px rgba(0,0,0,.5);
}
.cb-create.inactive {
  background:rgba(255,255,255,.04);
  color:rgba(255,255,255,.18);
  cursor:not-allowed;
}

/* scrollbar */
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#160028; border-radius:4px; }
`;

/* ─── Toggle ─────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div
      className="cb-toggle"
      style={{ background: on ? '#a855f7' : 'rgba(255,255,255,.12)' }}
      onClick={e => { e.stopPropagation(); onChange(); }}>
      <div className="cb-knob" style={{ left: on ? '22px' : '3px' }} />
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ slot, color, size = 30 }) {
  const src = slot?.avatar_url && !['null','undefined'].includes(String(slot.avatar_url))
    ? slot.avatar_url : null;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      background: slot?.isBot
        ? 'linear-gradient(135deg,#3b0764,#6d28d9)'
        : `linear-gradient(135deg,${color}44,${color}18)`,
      border:`2px solid ${color}44`,
      boxShadow:`0 0 10px ${color}28`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*.38, fontWeight:700, color,
    }}>
      {src
        ? <img src={src} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
        : slot?.isBot
          ? <Bot style={{ width:size*.5, height:size*.5, color:'#a78bfa' }} />
          : (slot?.name?.[0]?.toUpperCase() ?? '?')}
    </div>
  );
}

/* ─── Panel wrapper ──────────────────────────────────────────────── */
function Panel({ children, accent='#fbbf24', style={}, className='' }) {
  return (
    <div
      className={className}
      style={{
        position:'relative', overflow:'hidden',
        borderRadius:18,
        background:'linear-gradient(145deg,#08001a 0%,#0d0022 60%,#050010 100%)',
        border:'1px solid rgba(255,255,255,.07)',
        padding:'22px 24px',
        boxShadow:'0 8px 40px rgba(0,0,0,.6)',
        ...style,
      }}>
      {/* top accent line */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${accent}88,transparent)`,
        animation:'cb-bar-glow 3s ease-in-out infinite',
      }} />
      {/* corner dots */}
      {[['tl',{top:6,left:6}],['tr',{top:6,right:6}],['bl',{bottom:6,left:6}],['br',{bottom:6,right:6}]].map(([k,pos]) => (
        <div key={k} style={{
          position:'absolute', width:4, height:4, borderRadius:'50%',
          background:`${accent}55`, ...pos,
        }} />
      ))}
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────────── */
function Label({ children, accent='#fbbf24', badge, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div className="cb-dot-blink" style={{
          width:7, height:7, borderRadius:'50%',
          background:accent, boxShadow:`0 0 8px ${accent}`,
          flexShrink:0,
        }} />
        <span className="cb-mono" style={{
          fontSize:11, fontWeight:700, color:accent,
          textTransform:'uppercase', letterSpacing:'.16em',
        }}>{children}</span>
        {badge != null && (
          <span className="cb-mono" style={{
            fontSize:9, padding:'2px 8px', borderRadius:4,
            background:`${accent}18`, color:accent, border:`1px solid ${accent}30`,
            letterSpacing:'.06em',
          }}>{badge}</span>
        )}
      </div>
      {right}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════ */
export default function CreateBattle({ cases, balance, user, onBack, onCreate }) {

  /* ── ALL hooks declared FIRST — no derived values before useState ── */
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker,    setShowPicker]    = useState(false);
  const [modeLabel,     setModeLabel]     = useState('1v1');
  const [battleModes,   setBattleModes]   = useState({});

  /* helper — defined before useState that uses it */
  function makeUserSlot(u) {
    if (!u) return null;
    const url = u.avatar_url && !['null','undefined'].includes(String(u.avatar_url)) ? u.avatar_url : null;
    return { name: u.username || u.full_name || 'You', email: u.email, avatar_url: url, isBot: false };
  }

  const [slots, setSlots] = useState(() => {
    const sizes = parseMode('1v1');
    const total = sizes.reduce((a,b)=>a+b, 0);
    const s = Array(total).fill(null);
    if (user) s[0] = makeUserSlot(user);
    return s;
  });

  /* ── derived (AFTER all hooks) ── */
  const teamSizes    = parseMode(modeLabel);
  const totalPlayers = teamSizes.reduce((a,b)=>a+b, 0);
  const totalCost    = selectedCases.reduce((sum,c)=>sum+(c.price||0), 0);
  const overBudget   = totalCost > (balance ?? Infinity);
  const allFilled    = slots.every(s=>s!==null);
  const canCreate    = selectedCases.length > 0 && !overBudget && !!slots[0];

  /* ── effects ── */
  useEffect(() => {
    if (!user) return;
    setSlots(prev => { const n=[...prev]; n[0]=makeUserSlot(user); return n; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.avatar_url, user?.username, user?.full_name]);

  /* ── handlers ── */
  const handleModeChange = (label) => {
    setModeLabel(label);
    const sizes = label.split('v').map(Number);
    const total = sizes.reduce((a,b)=>a+b, 0);
    const s = Array(total).fill(null);
    if (user) s[0] = makeUserSlot(user);
    setSlots(s);
  };

  const freshBotName = (usedSet) => {
    let n;
    do { n = BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]; } while(usedSet.has(n));
    return n;
  };

  const fillWithBots = () => {
    const used = new Set(slots.filter(Boolean).map(s=>s.name));
    setSlots(prev => prev.map((slot,i) => {
      if (slot) return slot;
      const n = freshBotName(used); used.add(n);
      return { name:n, email:`bot_${i}@system`, isBot:true };
    }));
  };

  const addBot = (idx) => {
    const used = new Set(slots.filter(Boolean).map(s=>s.name));
    const n = freshBotName(used);
    setSlots(prev => { const a=[...prev]; a[idx]={ name:n, email:`bot_${idx}_${Date.now()}@system`, isBot:true }; return a; });
  };

  const removeSlot = (i) => {
    if (i===0) return;
    setSlots(prev => { const a=[...prev]; a[i]=null; return a; });
  };

  /* FIXED: stable useCallback — prevents stale closure bug in modal */
  const handleAddCase = useCallback((c) => {
    setSelectedCases(prev => [...prev, c]);
  }, []);

  const handleRemoveCase = useCallback((idx) => {
    setSelectedCases(prev => prev.filter((_,i)=>i!==idx));
  }, []);

  const toggleMode = (key) => setBattleModes(prev=>({...prev,[key]:!prev[key]}));

  const handleCreate = () => {
    if (!canCreate) return;
    let idx=0;
    const teams = teamSizes.map(size => {
      const t = Array.from({length:size},(_,j)=>idx+j);
      idx+=size; return t;
    });
    onCreate({ selectedCases, modeLabel, teams, players:slots.filter(Boolean), battleModes, totalPlayers });
  };

  /* ════════════ RENDER ════════════ */
  return (
    <div className="cb-root" style={{ background:'#030008', minHeight:'100vh', padding:'16px 0 100px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 14px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* ══ HERO ════════════════════════════════════════════════ */}
        <div className="cb-in" style={{
          position:'relative', overflow:'hidden', borderRadius:20,
          background:'linear-gradient(135deg,#070018 0%,#100030 45%,#06000f 100%)',
          border:'1px solid rgba(255,255,255,.08)',
          padding:'26px 28px',
          boxShadow:'0 0 80px rgba(168,85,247,.07),0 24px 60px rgba(0,0,0,.85)',
        }}>
          <div className="cb-sweep" />

          {/* background swords watermark */}
          <div style={{
            position:'absolute', right:20, top:'50%', transform:'translateY(-50%)',
            opacity:.07, pointerEvents:'none', zIndex:0,
          }}>
            <Swords style={{ width:140, height:140, color:'#a855f7' }} />
          </div>

          {/* purple ambient right */}
          <div style={{
            position:'absolute', right:0, top:0, bottom:0, width:'55%',
            background:'radial-gradient(ellipse 60% 100% at 100% 50%,rgba(168,85,247,.16) 0%,transparent 68%)',
            pointerEvents:'none', zIndex:0,
          }} />

          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                  <button
                    onClick={onBack}
                    style={{
                      width:36, height:36, borderRadius:9,
                      border:'1px solid rgba(255,255,255,.1)',
                      background:'rgba(255,255,255,.04)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', color:'rgba(255,255,255,.4)', transition:'all .2s', flexShrink:0,
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(251,191,36,.5)';e.currentTarget.style.color='#fbbf24';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';e.currentTarget.style.color='rgba(255,255,255,.4)';}}>
                    <ArrowLeft style={{ width:16, height:16 }} />
                  </button>

                  <div style={{ width:2, height:28, background:'linear-gradient(to bottom,#fbbf24,#a855f7)', borderRadius:2, flexShrink:0 }} />

                  <div>
                    <h1 className="cb-mono" style={{
                      fontSize:22, fontWeight:700, color:'#fff', margin:0,
                      letterSpacing:'.06em',
                      textShadow:'0 0 32px rgba(168,85,247,.35)',
                    }}>
                      BATTLE<span style={{ color:'#fbbf24' }}>_</span>CREATE
                    </h1>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:3, letterSpacing:'.04em' }}>
                      Configure cases · set players · choose rules
                    </p>
                  </div>
                </div>
              </div>

              {/* stats row */}
              <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                {[
                  { label:'CASES',   val: selectedCases.length,         color:'#fbbf24' },
                  { label:'PLAYERS', val: `${slots.filter(Boolean).length}/${totalPlayers}`, color:'#a855f7' },
                  { label:'COST',    val: totalCost.toLocaleString(),    color: overBudget ? '#f87171' : '#4ade80' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    padding:'10px 14px', borderRadius:11, textAlign:'center',
                    background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
                  }}>
                    <div className="cb-mono" style={{ fontSize:17, fontWeight:700, color, lineHeight:1 }}>{val}</div>
                    <div className="cb-mono" style={{ fontSize:8, color:'rgba(255,255,255,.3)', letterSpacing:'.14em', marginTop:4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* bottom accent bar */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,#fbbf24 35%,#a855f7 65%,transparent)',
            animation:'cb-bar-glow 3s ease-in-out infinite',
          }} />
        </div>

        {/* ══ MODE + CREATE row ════════════════════════════════════ */}
        <div className="cb-in cb-in-1" style={{
          display:'flex', alignItems:'center', gap:12,
          flexWrap:'wrap', justifyContent:'space-between',
          padding:'14px 18px', borderRadius:14,
          background:'rgba(255,255,255,.022)', border:'1px solid rgba(255,255,255,.07)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span className="cb-mono" style={{ fontSize:10, color:'rgba(255,255,255,.28)', letterSpacing:'.14em', textTransform:'uppercase', flexShrink:0 }}>
              Mode
            </span>
            <div style={{ width:1, height:16, background:'rgba(255,255,255,.1)', flexShrink:0 }} />
            {MODES.map(m => (
              <button
                key={m}
                className={`cb-mode-pill ${modeLabel===m?'active':''}`}
                onClick={()=>handleModeChange(m)}>
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`cb-create ${canCreate?'active':'inactive'}`}>
            <Swords style={{ width:15, height:15 }} />
            Create Battle
          </button>
        </div>

        {/* ══ CASES ═══════════════════════════════════════════════ */}
        <Panel className="cb-in cb-in-1" accent="#fbbf24">
          <Label
            accent="#fbbf24"
            badge={selectedCases.length ? `${selectedCases.length} CASE${selectedCases.length!==1?'S':''}` : null}>
            Cases
          </Label>

          {selectedCases.length === 0 && (
            <div className="cb-mono" style={{
              padding:'20px 0', textAlign:'center', fontSize:10,
              color:'rgba(255,255,255,.14)', letterSpacing:'.12em',
            }}>[ NO CASES SELECTED — CLICK ADD TO BEGIN ]</div>
          )}

          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {selectedCases.map((c, i) => {
              const rc = getRarityColor(c.price);
              return (
                <div key={`${c.id??c.name}-${i}`} className="cb-tile" onClick={()=>handleRemoveCase(i)}>
                  <div style={{ height:2, background:`linear-gradient(90deg,transparent,${rc},transparent)` }} />
                  <div style={{ padding:'10px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{
                      width:50, height:50, borderRadius:10, overflow:'hidden',
                      background:`linear-gradient(145deg,${rc}18,${rc}08)`,
                      border:`1px solid ${rc}25`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {c.image_url
                        ? <img src={c.image_url} alt={c.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                        : <span style={{ fontSize:20 }}>📦</span>}
                    </div>
                    <p style={{
                      fontSize:10, color:'rgba(255,255,255,.45)', textAlign:'center',
                      lineHeight:1.2, width:'100%', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500,
                    }}>{c.name}</p>
                    <p className="cb-mono" style={{ fontSize:10, fontWeight:700, color:rc }}>
                      {c.price?.toLocaleString()}
                    </p>
                  </div>
                  {/* delete overlay */}
                  <div className="cb-del" style={{
                    position:'absolute', inset:0, borderRadius:13,
                    background:'rgba(239,68,68,.0)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'background .18s', zIndex:5, opacity:0,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,.22)';e.currentTarget.style.opacity='1';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,.0)';e.currentTarget.style.opacity='0';}}>
                    <div style={{
                      width:28, height:28, borderRadius:7,
                      background:'rgba(239,68,68,.9)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <X style={{ width:13, height:13, color:'#fff' }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* add tile */}
            <div className="cb-add" style={{ height:120 }} onClick={()=>setShowPicker(true)}>
              <div style={{
                width:34, height:34, borderRadius:10,
                border:'2px dashed rgba(168,85,247,.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Plus style={{ width:16, height:16, color:'rgba(168,85,247,.55)' }} />
              </div>
              <span className="cb-mono" style={{ fontSize:9, color:'rgba(168,85,247,.45)', letterSpacing:'.1em' }}>ADD</span>
            </div>
          </div>
        </Panel>

        {/* ══ PLAYERS ══════════════════════════════════════════════ */}
        <Panel className="cb-in cb-in-2" accent="#a855f7">
          <Label
            accent="#a855f7"
            badge={modeLabel}
            right={!allFilled && (
              <button
                onClick={fillWithBots}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'7px 13px',
                  borderRadius:9, border:'1px solid rgba(168,85,247,.28)',
                  background:'rgba(168,85,247,.07)', color:'#c084fc',
                  fontSize:12, fontWeight:600, fontFamily:'DM Sans,sans-serif',
                  cursor:'pointer', transition:'all .2s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(168,85,247,.16)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(168,85,247,.07)';e.currentTarget.style.transform='none';}}>
                <Bot style={{ width:13, height:13 }} /> Fill Bots
              </button>
            )}>
            Players
          </Label>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {teamSizes.map((size, ti) => {
              const startIdx = teamSizes.slice(0,ti).reduce((a,b)=>a+b,0);
              const pal = TEAM_COLORS[ti % TEAM_COLORS.length];
              return (
                <div key={ti} style={{
                  flex:1, minWidth:155, borderRadius:13,
                  border:`1px solid ${pal.border}`,
                  background:pal.dim,
                  padding:'13px 11px',
                  boxShadow:`0 0 18px ${pal.glow}`,
                }}>
                  {/* team header */}
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
                    <div className="cb-dot-blink" style={{
                      width:6, height:6, borderRadius:'50%',
                      background:pal.base, boxShadow:`0 0 8px ${pal.base}`,
                    }} />
                    <span className="cb-mono" style={{ fontSize:10, fontWeight:700, color:pal.base, letterSpacing:'.16em', textTransform:'uppercase' }}>
                      Team {ti+1}
                    </span>
                    <span className="cb-mono" style={{ fontSize:9, color:'rgba(255,255,255,.2)' }}>×{size}</span>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {Array.from({ length:size }, (_,j) => {
                      const idx = startIdx+j;
                      const slot = slots[idx];
                      return (
                        <div key={idx} className="cb-slot" style={{
                          background: slot ? `${pal.base}0e` : 'rgba(255,255,255,.018)',
                          borderColor: slot ? pal.border : 'rgba(255,255,255,.05)',
                        }}>
                          {slot ? (
                            <>
                              <Avatar slot={slot} color={pal.base} size={28} />
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{
                                  fontSize:12, fontWeight:600, color:'#fff',
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                }}>{slot.name}</p>
                                {slot.isBot && (
                                  <p className="cb-mono" style={{ fontSize:8, color:pal.base, letterSpacing:'.12em' }}>BOT</p>
                                )}
                              </div>
                              {idx !== 0 && (
                                <button
                                  onClick={()=>removeSlot(idx)}
                                  style={{
                                    width:20, height:20, borderRadius:6, border:'none',
                                    background:'rgba(239,68,68,.1)', color:'#f87171',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    cursor:'pointer', flexShrink:0, transition:'background .15s',
                                  }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,.28)'}
                                  onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,.1)'}>
                                  <X style={{ width:10, height:10 }} />
                                </button>
                              )}
                            </>
                          ) : (
                            <div
                              style={{ display:'flex', alignItems:'center', gap:8, flex:1, cursor:'pointer' }}
                              onClick={()=>addBot(idx)}>
                              <div style={{
                                width:28, height:28, borderRadius:'50%', flexShrink:0,
                                border:`2px dashed ${pal.border}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                              }}>
                                <Bot style={{ width:12, height:12, color:pal.base, opacity:.4 }} />
                              </div>
                              <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:500 }}>+ add bot</span>
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
        </Panel>

        {/* ══ BATTLE MODES ════════════════════════════════════════ */}
        <Panel className="cb-in cb-in-3" accent="#38bdf8">
          <Label
            accent="#38bdf8"
            badge={Object.values(battleModes).filter(Boolean).length || null}>
            Rules
          </Label>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:8 }}>
            {BATTLE_MODES.map(m => {
              const on = !!battleModes[m.key];
              return (
                <div
                  key={m.key}
                  className={`cb-rule ${on?'on':''}`}
                  onClick={()=>toggleMode(m.key)}
                  style={{
                    borderColor: on ? `${m.color}45` : 'rgba(255,255,255,.06)',
                    background:  on ? `${m.color}0d` : 'rgba(255,255,255,.018)',
                    boxShadow:   on ? `0 0 18px ${m.color}14` : 'none',
                  }}>
                  {/* active left bar */}
                  {on && (
                    <div style={{
                      position:'absolute', left:0, top:4, bottom:4, width:2,
                      background:m.color, borderRadius:2,
                      boxShadow:`0 0 8px ${m.color}`,
                    }} />
                  )}
                  <span style={{ fontSize:20, flexShrink:0 }}>{m.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color: on ? '#fff' : 'rgba(255,255,255,.5)', transition:'color .2s' }}>
                      {m.label}
                    </p>
                    <p style={{ fontSize:10, color:'rgba(255,255,255,.25)', lineHeight:1.4, marginTop:1 }}>
                      {m.desc}
                    </p>
                  </div>
                  <Toggle on={on} onChange={()=>toggleMode(m.key)} />
                </div>
              );
            })}
          </div>
        </Panel>

        {/* ══ ERROR ═══════════════════════════════════════════════ */}
        {overBudget && (
          <div className="cb-in" style={{
            display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:11,
            background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.28)',
            color:'#f87171', fontSize:13, fontWeight:500,
          }}>
            <span style={{ fontSize:17 }}>⚠️</span>
            <span>
              Insufficient balance — need{' '}
              <span className="cb-mono" style={{ fontWeight:700 }}>{totalCost.toLocaleString()}</span> coins,
              you have{' '}
              <span className="cb-mono" style={{ fontWeight:700 }}>{(balance??0).toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      <CasePickerModal
        open={showPicker}
        onOpenChange={setShowPicker}
        cases={cases}
        onAddCase={handleAddCase}
      />
    </div>
  );
}