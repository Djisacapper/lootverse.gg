import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Crown, Zap, CheckCircle2, Loader2, Plus, Swords } from 'lucide-react';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import JackpotWheel from './JackpotWheel';
import { usePlayerAvatars, safeAvatarUrl } from './usePlayerAvatars';
/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.ba-root { font-family: 'Nunito', sans-serif; }
@keyframes ba-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.ba-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:ba-scan 7s linear infinite; pointer-events:none;
}
@keyframes ba-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.ba-shim { position:relative; overflow:hidden; }
.ba-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.04),transparent);
  animation:ba-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}
@keyframes ba-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.5; }
  100% { transform:translateY(-90px) translateX(var(--dx)); opacity:0; }
}
.ba-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:ba-p-rise var(--d) ease-out infinite var(--dl);
}
@keyframes ba-hex-pulse {
  0%,100% { opacity:.02; }
  50%     { opacity:.05; }
}
.ba-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.035) 1px, transparent 1px);
  background-size:32px 32px;
  animation:ba-hex-pulse 5s ease-in-out infinite;
}
@keyframes ba-live-ping {
  0%   { transform:scale(1); opacity:.8; }
  100% { transform:scale(2.8); opacity:0; }
}
.ba-live-ring { animation:ba-live-ping 1.6s ease-out infinite; }
@keyframes ba-glow-pulse {
  0%,100% { box-shadow:0 0 0 1px rgba(251,191,36,.15), 0 0 40px rgba(251,191,36,.08); }
  50%     { box-shadow:0 0 0 1px rgba(251,191,36,.3),  0 0 70px rgba(251,191,36,.18); }
}
.ba-winner-glow { animation:ba-glow-pulse 2s ease-in-out infinite; }
@keyframes ba-vs-pulse {
  0%,100% { transform:scale(1) translateY(-50%); opacity:.5; }
  50%     { transform:scale(1.15) translateY(-50%); opacity:1; }
}
.ba-vs { animation:ba-vs-pulse 2s ease-in-out infinite; transform-origin:center; }
@keyframes ba-float-swords {
  0%,100% { transform:translateY(0) rotate(-6deg); }
  50%     { transform:translateY(-8px) rotate(6deg); }
}
.ba-swords-float { animation:ba-float-swords 3.5s ease-in-out infinite; }
@keyframes ba-countdown-pop {
  0%   { transform:scale(0.1); opacity:0; }
  60%  { transform:scale(1.12); opacity:1; }
  100% { transform:scale(1); opacity:1; }
}
.ba-cd-num { animation:ba-countdown-pop 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
@keyframes ba-round-pip-active {
  0%,100% { box-shadow:0 0 0 0 rgba(251,191,36,.5); }
  50%     { box-shadow:0 0 0 4px rgba(251,191,36,.2); }
}
.ba-pip-active { animation:ba-round-pip-active 1.2s ease-in-out infinite; }
@keyframes ba-item-arrive {
  0%  { transform:translateY(10px) scale(.92); opacity:0; }
  100%{ transform:translateY(0) scale(1);     opacity:1; }
}
.ba-item-arrive { animation:ba-item-arrive .35s cubic-bezier(.22,1,.36,1) forwards; }
@keyframes ba-winner-banner {
  0%  { transform:translateY(-24px) scale(.94); opacity:0; }
  100%{ transform:translateY(0) scale(1);       opacity:1; }
}
.ba-winner-banner { animation:ba-winner-banner .5s cubic-bezier(.34,1.56,.64,1) forwards; }
@keyframes ba-magic-label {
  0%,100% { opacity:.7; letter-spacing:.18em; }
  50%     { opacity:1; letter-spacing:.28em; }
}
.ba-magic-label { animation:ba-magic-label 1.4s ease-in-out infinite; }
.ba-scrollbar::-webkit-scrollbar { width:3px; }
.ba-scrollbar::-webkit-scrollbar-thumb { background:rgba(251,191,36,.2); border-radius:4px; }
`;
/* ─── Theme ─────────────────────────────────────────────────────── */
const TEAM_PALETTE = [
  { color:'#fbbf24', glow:'rgba(251,191,36,.3)',  bg:'rgba(251,191,36,.07)',  border:'rgba(251,191,36,.25)' },
  { color:'#a855f7', glow:'rgba(168,85,247,.3)',   bg:'rgba(168,85,247,.07)',  border:'rgba(168,85,247,.25)'  },
  { color:'#60a5fa', glow:'rgba(96,165,250,.3)',   bg:'rgba(96,165,250,.07)',  border:'rgba(96,165,250,.25)'  },
  { color:'#34d399', glow:'rgba(52,211,153,.3)',   bg:'rgba(52,211,153,.07)',  border:'rgba(52,211,153,.25)'  },
];
const PLAYER_COLORS = ['#fbbf24','#a855f7','#60a5fa','#34d399','#f472b6','#fb923c','#22d3ee','#a3e635'];

/* ─── Rarity drop-shadow ─────────────────────────────────────────── */
const getRarityDropShadow = (rarity) => {
  const shadows = {
    legendary: 'drop-shadow(0 0 12px rgba(251,191,36,0.95)) drop-shadow(0 0 20px rgba(251,191,36,0.5))',
    epic:      'drop-shadow(0 0 12px rgba(168,85,247,0.9)) drop-shadow(0 0 20px rgba(168,85,247,0.4))',
    rare:      'drop-shadow(0 0 12px rgba(59,130,246,0.9)) drop-shadow(0 0 20px rgba(59,130,246,0.4))',
    uncommon:  'drop-shadow(0 0 12px rgba(34,197,94,0.8)) drop-shadow(0 0 20px rgba(34,197,94,0.3))',
    common:    'drop-shadow(0 0 8px rgba(161,161,170,0.6))',
  };
  return shadows[rarity] || shadows.common;
};

/* ─── Persistent AudioContext (unlocked on first user gesture) ───── */
let _audioCtx = null;
function getAudioCtx() {
  try {
    if (!_audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      _audioCtx = new AudioCtx();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch { return null; }
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => getAudioCtx());
}

/* ─── Spin tick sound — one ticking loop per round ───────────────── */
let _spinTickTimer = null;
function stopSpinSound() {
  if (_spinTickTimer) { clearTimeout(_spinTickTimer); _spinTickTimer = null; }
}
function playRoundSound(fast) {
  stopSpinSound();
  const SPIN_DURATION = fast ? 1500 : 3100;
  const startTime = Date.now();
  const tick = () => {
    const ctx = getAudioCtx();
    if (ctx) {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280 + Math.random() * 100, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch {}
    }
    const elapsed = Date.now() - startTime;
    if (elapsed < SPIN_DURATION) {
      const progress = elapsed / SPIN_DURATION;
      const interval = 40 + progress * 280;
      _spinTickTimer = setTimeout(tick, interval);
    }
  };
  tick();
}

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 10 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id:i, left:`${8+Math.random()*84}%`, bottom:`${Math.random()*20}%`,
      size:1.5+Math.random()*2.5,
      d:`${3+Math.random()*5}s`, dl:`${-Math.random()*6}s`,
      dx:`${(Math.random()-.5)*40}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="ba-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}
/* ─── Confetti ───────────────────────────────────────────────────── */
function ConfettiEffect({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 160 }, () => ({
      x:Math.random()*canvas.width, y:-20,
      r:Math.random()*8+4,
      color:['#fbbf24','#a855f7','#60a5fa','#34d399','#f472b6','#fb923c'][Math.floor(Math.random()*6)],
      vx:(Math.random()-.5)*5, vy:Math.random()*4+2,
      angle:Math.random()*360, va:(Math.random()-.5)*7,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.angle+=p.va;
        if(p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore();
      });
      frame=requestAnimationFrame(draw);
    };
    draw();
    const t=setTimeout(()=>cancelAnimationFrame(frame),5000);
    return()=>{ cancelAnimationFrame(frame); clearTimeout(t); };
  },[active]);
  if(!active) return null;
  return <canvas ref={ref} style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:9999 }} />;
}
/* ─── Vertical Spinner ───────────────────────────────────────────── */
function VerticalSpinner({ items, winnerItem, onDone, fast }) {
  const ITEM_H=80, WIN_POS=28, TOTAL=36, VISIBLE_H=240;
  const duration = fast ? 1.4 : 3.0;
  const SPIN_DURATION = fast ? 1500 : 3100;

  useEffect(() => {
    const t = setTimeout(() => { onDone(); }, SPIN_DURATION);
    return () => { clearTimeout(t); };
  }, []);

  const strip = useRef(
    Array.from({ length: TOTAL }, (_, i) =>
      i===WIN_POS ? winnerItem : items[Math.floor(Math.random()*items.length)]
    )
  ).current;
  const targetY = -(WIN_POS*ITEM_H - VISIBLE_H/2 + ITEM_H/2);

  return (
    <div style={{
      position:'relative', overflow:'hidden', borderRadius:14,
      border:'1px solid rgba(251,191,36,.25)',
      background:'#0a0018',
      height:VISIBLE_H,
    }}>
      <div style={{
        position:'absolute', inset:'0 0', top:'50%', transform:'translateY(-50%)',
        height:ITEM_H, zIndex:10, pointerEvents:'none',
        background:'rgba(251,191,36,.06)',
        borderTop:'2px solid rgba(251,191,36,.5)',
        borderBottom:'2px solid rgba(251,191,36,.5)',
      }} />
      <div style={{
        position:'absolute', inset:'0 0', bottom:'auto', height:72, zIndex:20, pointerEvents:'none',
        background:'linear-gradient(to bottom,#0a0018 0%,transparent 100%)',
      }} />
      <div style={{
        position:'absolute', inset:'0 0', top:'auto', height:72, zIndex:20, pointerEvents:'none',
        background:'linear-gradient(to top,#0a0018 0%,transparent 100%)',
      }} />
      <motion.div
        style={{ position:'absolute', left:0, right:0, top:0, display:'flex', flexDirection:'column' }}
        initial={{ y:0 }}
        animate={{ y:targetY }}
        transition={{ duration, ease:[0.04,0.82,0.165,1] }}>
        {strip.map((item, i) => (
          <div key={i} style={{
            height:ITEM_H, display:'flex', alignItems:'center', gap:8, padding:'0 10px', flexShrink:0,
          }}>
            <div style={{
              width:48, height:48, borderRadius:12, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {item?.image || item?.image_url
                ? <img
                    src={item.image || item.image_url}
                    alt={item?.name}
                    style={{ width:42, height:42, objectFit:'contain', filter: getRarityDropShadow(item?.rarity) }}
                  />
                : <span style={{ fontSize:22 }}>📦</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.75)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item?.name || '—'}</p>
              <p style={{ fontSize:12, color:'#fbbf24', fontWeight:900 }}>{item?.value?.toLocaleString() || 0}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
/* ─── Item Chip ──────────────────────────────────────────────────── */
function ItemChip({ item, index = 0 }) {
  const RARITY_COLORS = {
    legendary:'#fbbf24', epic:'#a855f7', rare:'#60a5fa', uncommon:'#34d399', common:'rgba(255,255,255,.35)'
  };
  const rc = RARITY_COLORS[item?.rarity] || RARITY_COLORS.common;
  return (
    <div
      className="ba-item-arrive"
      style={{
        display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
        borderRadius:10, background:'#1a1030',
        border:`1px solid ${rc}55`,
        boxShadow:`0 2px 8px rgba(0,0,0,.6), inset 0 0 12px ${rc}08`,
        animationDelay:`${index*0.04}s`,
      }}>
      <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {item?.image || item?.image_url
          ? <img src={item.image || item.image_url} alt={item?.name} style={{ width:24, height:24, objectFit:'contain', filter: getRarityDropShadow(item?.rarity) }} />
          : <span style={{ fontSize:13 }}>📦</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:10, color:'rgba(255,255,255,.65)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item?.name}</p>
        <p style={{ fontSize:10, color:rc, fontWeight:900 }}>{item?.value?.toLocaleString()}</p>
      </div>
    </div>
  );
}
/* ─── Player Column ──────────────────────────────────────────────── */
function PlayerColumn({ player, playerColor, isWinner, wonItems, spinPhase, caseItems, spinnerKey, spinnerItem, magicItem, onSpinDone, onMagicSpinDone, fast, showPct, pct }) {
  if (!player) return null;
  const total = wonItems.reduce((s, it) => s + (it?.value||0), 0);
  const topItems = caseItems.filter(it => ['epic','legendary'].includes(it.rarity));
  const magicPool = topItems.length > 0 ? topItems : caseItems;
  return (
    <div
      className={isWinner ? 'ba-winner-glow' : ''}
      style={{
        position:'relative', flex:1, display:'flex', flexDirection:'column',
        borderRadius:16, overflow:'hidden', minHeight:0,
        background: isWinner ? '#1a0e00' : '#0f0020',
        border:`2px solid ${isWinner ? '#fbbf24' : playerColor}`,
        boxShadow: isWinner
          ? `0 0 0 1px rgba(251,191,36,.2), inset 0 0 40px rgba(251,191,36,.05)`
          : `0 0 0 1px ${playerColor}22, inset 0 0 30px ${playerColor}08`,
        transition:'border-color .4s, box-shadow .4s',
      }}>
      <div style={{ height:2, background: isWinner ? 'linear-gradient(90deg,transparent,#fbbf24,#f59e0b,transparent)' : `linear-gradient(90deg,transparent,${playerColor}88,transparent)` }} />
      <div className="ba-scan" />
      {isWinner && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(251,191,36,.12) 0%,transparent 70%)' }} />
      )}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 12px 8px', flexShrink:0 }}>
        <div style={{
          width:36, height:36, borderRadius:'50%', flexShrink:0, overflow:'hidden',
          background:`${playerColor}33`, border:`2px solid ${playerColor}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 14px ${playerColor}55`,
        }}>
          {player.isBot
            ? <Bot style={{ width:14, height:14, color:playerColor }} />
            : safeAvatarUrl(player.avatar_url)
              ? <img src={safeAvatarUrl(player.avatar_url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <User style={{ width:14, height:14, color:playerColor }} />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:900, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.name}</p>
          {player.isBot && <p style={{ fontSize:9, fontWeight:800, color:playerColor, textTransform:'uppercase', letterSpacing:'.1em' }}>BOT</p>}
        </div>
        {isWinner && <Crown style={{ width:14, height:14, color:'#fbbf24', flexShrink:0 }} />}
      </div>
      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${playerColor}44,transparent)`, margin:'0 8px' }} />
      <div style={{ textAlign:'center', padding:'8px 8px 6px', flexShrink:0 }}>
        <span style={{ fontSize:24, fontWeight:900, color: isWinner ? '#fbbf24' : '#ffffff', letterSpacing:'-.02em' }}>{total.toLocaleString()}</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:700, marginLeft:4 }}>coins</span>
      </div>
      {showPct && (
        <div style={{ padding:'0 10px 6px', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:9, fontWeight:800, color:playerColor, textTransform:'uppercase', letterSpacing:'.1em' }}>{Math.round(pct*100)}%</span>
          </div>
          <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,.07)', overflow:'hidden' }}>
            <motion.div style={{ height:'100%', borderRadius:4, background:`linear-gradient(90deg,${playerColor},${playerColor}aa)` }} initial={{ width:'0%' }} animate={{ width:`${pct*100}%` }} transition={{ duration:0.6, ease:'easeOut' }} />
          </div>
        </div>
      )}
      {(spinPhase==='spinning'||spinPhase==='magic_spin') && caseItems.length>0 && (
        <div style={{ padding:'0 8px 8px', flex:1, minHeight:0 }}>
          {spinPhase==='magic_spin' && (
            <div style={{ textAlign:'center', marginBottom:6 }}>
              <span className="ba-magic-label" style={{ fontSize:9, fontWeight:900, color:'#22d3ee', textTransform:'uppercase', letterSpacing:'.18em' }}>✦ Magic Spin ✦</span>
            </div>
          )}
          <VerticalSpinner
            key={`${spinnerKey}-${spinPhase}`}
            items={spinPhase==='magic_spin' ? magicPool : caseItems}
            winnerItem={spinPhase==='magic_spin' ? magicItem : spinnerItem}
            onDone={spinPhase==='magic_spin' ? onMagicSpinDone : onSpinDone}
            fast={fast}
          />
        </div>
      )}
      <div className="ba-scrollbar" style={{ padding:'0 8px 10px', flex:1, minHeight:0, overflowY:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {wonItems.map((item, i) => <ItemChip key={i} item={item} index={i} />)}
        </div>
      </div>
    </div>
  );
}
/* ─── Mode Notice ────────────────────────────────────────────────── */
function ModeNotice({ icon, label, color, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:`${color}12`, border:`1px solid ${color}30` }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <p style={{ fontSize:12, color:`${color}cc`, fontWeight:700 }}>{children}</p>
    </div>
  );
}
/* ─── VS Divider ─────────────────────────────────────────────────── */
function VsDivider() {
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 2px', flexShrink:0, alignSelf:'stretch' }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translateX(-50%) translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#080012,#0e001c)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
        <span className="ba-vs" style={{ fontSize:9, fontWeight:900, color:'rgba(255,255,255,.4)', letterSpacing:'.05em', display:'block' }}>VS</span>
      </div>
      <div style={{ width:1, height:'100%', background:'rgba(255,255,255,.06)' }} />
    </div>
  );
}
/* ─── Waiting Lobby ──────────────────────────────────────────────── */
function WaitingLobby({ battle, players, teams, modeLabel, userEmail, onClose, onJoin, onAddBot, onFillBots, balance }) {
  const maxPlayers  = battle.max_players || 2;
  const isCreator   = battle.creator_email === userEmail;
  const hasJoined   = players.some(p => p && p.email === userEmail && !p.isBot);
  const filledCount = players.filter(p => p && p.email).length;
  const waitingTeamList = teams && teams.length > 0
    ? teams
    : [
        Array.from({ length: Math.ceil(maxPlayers/2) }, (_,i) => i),
        Array.from({ length: Math.floor(maxPlayers/2) }, (_,i) => i + Math.ceil(maxPlayers/2)),
      ];
  return (
    <div style={{ position:'relative', overflow:'hidden', borderRadius:18, background:'linear-gradient(145deg,#080012,#0e001c,#040009)', border:'1px solid rgba(168,85,247,.2)', padding:'22px 20px', boxShadow:'0 0 60px rgba(168,85,247,.1)' }}>
      <div className="ba-scan" />
      <div className="ba-hex" />
      <Particles accent="#a855f7" count={8} />
      <Particles accent="#fbbf24" count={5} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#a855f7,#fbbf24,transparent)' }} />
      <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
        <div style={{ position:'relative', width:8, height:8 }}>
          <div className="ba-live-ring" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(168,85,247,.5)' }} />
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#a855f7' }} />
        </div>
        <span style={{ fontSize:13, fontWeight:900, color:'#c084fc', letterSpacing:'.08em', textTransform:'uppercase' }}>Waiting for players</span>
        <span style={{ fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20, background:'rgba(251,191,36,.12)', color:'#fbbf24', border:'1px solid rgba(251,191,36,.25)', marginLeft:'auto' }}>{filledCount}/{maxPlayers}</span>
      </div>
      <div style={{ position:'relative', zIndex:2, display:'flex', gap:8, alignItems:'stretch', overflowX:'auto' }}>
        {waitingTeamList.map((memberIndices, ti) => {
          const pal = TEAM_PALETTE[ti % TEAM_PALETTE.length];
          return (
            <React.Fragment key={ti}>
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:8 }}>
                {waitingTeamList.length > 1 && (
                  <div style={{ textAlign:'center' }}>
                    <span style={{ fontSize:10, fontWeight:900, padding:'2px 12px', borderRadius:20, background:pal.bg, color:pal.color, border:`1px solid ${pal.border}`, textTransform:'uppercase', letterSpacing:'.1em' }}>Team {ti+1}</span>
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  {memberIndices.map((globalIdx) => {
                    const p = players[globalIdx];
                    const filled = p && p.email;
                    const canJoin = !filled && !hasJoined && !isCreator;
                    return (
                      <div key={globalIdx} style={{ flex:1, minWidth:100, borderRadius:14, background: filled ? pal.bg : 'rgba(255,255,255,.02)', border:`1px solid ${filled ? pal.border : 'rgba(255,255,255,.07)'}`, minHeight:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'16px 10px', transition:'border-color .3s, background .3s' }}>
                        {filled ? (
                          <>
                            <div style={{ width:44, height:44, borderRadius:'50%', overflow:'hidden', background:`linear-gradient(135deg,${pal.color}33,${pal.color}18)`, border:`2px solid ${pal.color}66`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 16px ${pal.glow}` }}>
                              {p.isBot ? <Bot style={{ width:18, height:18, color:pal.color }} /> : (p.avatar_url && p.avatar_url!=='null' && p.avatar_url!=='undefined') ? <img src={p.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User style={{ width:18, height:18, color:pal.color }} />}
                            </div>
                            <div style={{ textAlign:'center' }}>
                              <p style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{p.name}</p>
                              {p.isBot && <p style={{ fontSize:9, fontWeight:800, color:pal.color, textTransform:'uppercase', letterSpacing:'.1em' }}>BOT</p>}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(52,211,153,.12)', border:'1px solid rgba(52,211,153,.3)' }}>
                              <CheckCircle2 style={{ width:11, height:11, color:'#34d399' }} />
                              <span style={{ fontSize:10, fontWeight:800, color:'#34d399' }}>Ready</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ width:44, height:44, borderRadius:'50%', border:`2px dashed ${pal.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Loader2 style={{ width:18, height:18, color:pal.color, opacity:.4 }} className="animate-spin" />
                            </div>
                            <p style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:700, textAlign:'center' }}>Waiting...</p>
                            {canJoin && (
                              <button onClick={() => onJoin()} disabled={battle.entry_cost > balance} style={{ padding:'7px 18px', borderRadius:10, border:'none', cursor: battle.entry_cost > balance ? 'not-allowed' : 'pointer', background: battle.entry_cost > balance ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: battle.entry_cost > balance ? 'rgba(255,255,255,.2)' : '#000', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', boxShadow: battle.entry_cost <= balance ? '0 0 20px rgba(251,191,36,.4)' : 'none' }}>Join</button>
                            )}
                            {isCreator && (
                              <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', padding:'0 6px' }}>
                                <button onClick={onAddBot} style={{ padding:'6px 0', borderRadius:9, border:'1px solid rgba(168,85,247,.3)', background:'rgba(168,85,247,.1)', color:'#c084fc', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'background .2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(168,85,247,.2)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(168,85,247,.1)'}><Bot style={{ width:11, height:11 }} /> Add Bot</button>
                                <button onClick={onFillBots} style={{ padding:'6px 0', borderRadius:9, border:'1px solid rgba(251,191,36,.25)', background:'rgba(251,191,36,.1)', color:'#fbbf24', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'background .2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(251,191,36,.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(251,191,36,.1)'}>Fill All</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {ti < waitingTeamList.length-1 && <VsDivider />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
/* ─── Main BattleArena ───────────────────────────────────────────── */
export default function BattleArena({ battle, selectedCases, players: rawPlayers, teams, modeLabel, battleModes={}, userEmail, onClose, onReward, onJoin, onAddBot, onFillBots, onBattleUpdated, balance=0 }) {
  const players    = usePlayerAvatars(rawPlayers);
  const totalRounds = selectedCases.length;
  const teamList   = teams || [players.map((_,i) => i)];
  const isWaiting  = battle?.status === 'waiting';
  useEffect(() => {
    if (!isWaiting || !battle?.id) return;
    const poll = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const fresh   = await base44.entities.CaseBattle.filter({ id: battle.id });
        const updated = fresh?.[0];
        if (!updated) return;
        const filledCount = (updated.players||[]).filter(p=>p&&p.email).length;
        const maxPlayers  = updated.max_players || 2;
        if (onBattleUpdated) onBattleUpdated(updated);
        if (filledCount >= maxPlayers && updated.status==='waiting') {
          await base44.entities.CaseBattle.update(updated.id, { status:'in_progress' });
        }
      } catch {}
    };
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [isWaiting, battle?.id]);
  const modes       = battleModes && typeof battleModes==='object' ? battleModes : {};
  const isCrazy     = modes.crazy===true;
  const isTerminal  = modes.terminal===true;
  const isGroup     = modes.group===true;
  const isMagicSpin = modes.magic_spin===true;
  const isFastMode  = modes.fast_mode===true;
  const isJackpot   = modes.jackpot===true;
  const [phase, setPhase]                 = useState('countdown');
  const [countdown, setCountdown]         = useState(3);
  const [currentRound, setCurrentRound]   = useState(0);
  const [playerItems, setPlayerItems]     = useState(players.map(()=>[]));
  const [done, setDone]                   = useState(false);
  const [jackpotPhase, setJackpotPhase]   = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti]   = useState(false);
  const [playerPhases, setPlayerPhases]   = useState(players.map(()=>'idle'));
  const allRolled      = useRef(null);
  const roundDoneCount = useRef(0);
  const currentRoundRef = useRef(0);
  const rewardGiven    = useRef(false);
  const rollWithMagicSpin = (caseItems) => {
    const item = rollItem(caseItems) || { name:'Nothing', value:0, rarity:'common', image_url:null };
    if (!isMagicSpin) return { item, isMagic:false };
    const topItems = caseItems.filter(it => ['epic','legendary'].includes(it.rarity));
    if (topItems.length>0 && Math.random()<0.20) return { item: rollItem(topItems)||item, isMagic:true };
    return { item, isMagic:false };
  };
  useEffect(() => {
    if (isWaiting) return;
    allRolled.current = selectedCases.map(c => players.map(()=>rollWithMagicSpin(c.items||[])));
  }, []);
  useEffect(() => {
    if (isWaiting || phase!=='countdown') return;
    if (countdown===0) { setPhase('spinning'); launchRound(0); return; }
    const t = setTimeout(()=>setCountdown(c=>c-1), 1000);
    return ()=>clearTimeout(t);
  }, [phase, countdown, isWaiting]);
  const launchRound = (round) => {
    roundDoneCount.current=0; currentRoundRef.current=round;
    setCurrentRound(round);
    setPlayerPhases(players.map(()=>'spinning'));
    playRoundSound(isFastMode);
  };
  const handleNormalSpinDone = (pi) => {
    const round  = currentRoundRef.current;
    const rolled = allRolled.current[round];
    if (rolled[pi].isMagic) {
      setPlayerPhases(prev=>{ const n=[...prev]; n[pi]='magic_spin'; return n; });
    } else {
      markPlayerRoundDone(pi, round);
    }
  };
  const handleMagicSpinDone = (pi) => markPlayerRoundDone(pi, currentRoundRef.current);
  const markPlayerRoundDone = (pi, round) => {
    const rolled = allRolled.current[round];
    setPlayerItems(prev => { const n=[...prev]; n[pi]=[...n[pi], rolled[pi].item]; return n; });
    setPlayerPhases(prev => { const n=[...prev]; n[pi]='idle'; return n; });
    roundDoneCount.current += 1;
    if (roundDoneCount.current >= players.length) {
      if (round+1 >= totalRounds) {
        setTimeout(() => { if (isJackpot) setJackpotPhase(true); else finishBattle(); }, isFastMode ? 1200 : 2500);
      } else {
        setTimeout(() => launchRound(round+1), isFastMode ? 1500 : 4500);
      }
    }
  };
  const getPlayerTotal = (pi) => {
    if (!allRolled.current) return 0;
    if (isTerminal) return allRolled.current[totalRounds-1]?.[pi]?.item?.value || 0;
    return allRolled.current.reduce((s,r)=>s+(r[pi]?.item?.value||0),0);
  };
  const finishBattle = (forcedWinnerTi=null) => {
    let winIdx;
    if (forcedWinnerTi!==null) winIdx=forcedWinnerTi;
    else if (isGroup) winIdx=-1;
    else {
      const vals = teamList.map(mi => mi.reduce((s,pi)=>s+getPlayerTotal(pi),0)/mi.length);
      winIdx = isCrazy ? vals.indexOf(Math.min(...vals)) : vals.indexOf(Math.max(...vals));
    }
    setWinnerTeamIdx(winIdx); setDone(true); setJackpotPhase(false);
    if (!rewardGiven.current) {
      rewardGiven.current = true;
      const totalItemsValue = allRolled.current.reduce((rs,round)=>rs+round.reduce((ps,r)=>ps+(r?.item?.value||0),0),0);
      const userPi = players.findIndex(p=>p.email===userEmail);
      if (isGroup) {
        const share = Math.floor(totalItemsValue/players.length);
        setShowConfetti(true); setTimeout(()=>setShowConfetti(false),5000);
        onReward && onReward(share);
      } else {
        if (winIdx>=0 && teamList[winIdx]?.includes(userPi)) {
          setShowConfetti(true); setTimeout(()=>setShowConfetti(false),5000);
          const payout = Math.floor(totalItemsValue/(teamList[winIdx]?.length||1));
          onReward && onReward(payout);
        }
      }
    }
  };
  const playerTotals = playerItems.map(items=>items.reduce((s,it)=>s+(it?.value||0),0));
  const teamTotals   = teamList.map(mi=>mi.reduce((s,pi)=>s+(playerTotals[pi]||0),0));
  const totalPot     = (battle?.max_players||players.length)*(battle?.entry_cost||0);
  const allPlayerIndices = teamList.flat();
  const playerColorMap   = {};
  allPlayerIndices.forEach((pi,idx)=>{ playerColorMap[pi]=PLAYER_COLORS[idx%PLAYER_COLORS.length]; });
  const grandPlayerTotal = playerTotals.reduce((s,v)=>s+v,0);
  const caseItems = (selectedCases[currentRound]||selectedCases[0])?.items||[];
  const totalItemsValue = allRolled.current
    ? allRolled.current.reduce((rs,round)=>rs+round.reduce((ps,r)=>ps+(r?.item?.value||0),0),0) : 0;
  let payoutLabel = '';
  if (done) {
    if (isGroup) payoutLabel=`Everyone gets ${Math.floor(totalItemsValue/players.length).toLocaleString()} coins`;
    else if (winnerTeamIdx>=0) {
      const wc = teamList[winnerTeamIdx]?.length||1;
      payoutLabel = wc===1 ? `Winner takes all: ${totalItemsValue.toLocaleString()} coins` : `Each winner gets ${Math.floor(totalItemsValue/wc).toLocaleString()} coins`;
    }
  }
  const activeModes = [
    isCrazy&&{icon:'🎭',label:'Crazy',color:'#f472b6'},
    isTerminal&&{icon:'⚡',label:'Terminal',color:'#fbbf24'},
    isGroup&&{icon:'🔄',label:'Group',color:'#34d399'},
    isMagicSpin&&{icon:'✨',label:'Magic Spin',color:'#a855f7'},
    isFastMode&&{icon:'💨',label:'Fast',color:'#22d3ee'},
    isJackpot&&{icon:'👑',label:'Jackpot',color:'#fbbf24'},
  ].filter(Boolean);
  if (isWaiting) {
    return (
      <div className="ba-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
        <style>{CSS}</style>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,.5)', transition:'all .2s' }} onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(251,191,36,.4)'; e.currentTarget.style.color='#fbbf24'; }} onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
              <ArrowLeft style={{ width:15, height:15 }} />
            </button>
            <div style={{ width:3, height:22, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Swords style={{ width:16, height:16, color:'#fbbf24' }} />
            <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>Battle Lobby</span>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.35)', fontWeight:700 }}>Cost:</span>
              <span style={{ fontSize:14, fontWeight:900, color:'#fbbf24' }}>{(battle.entry_cost*(battle.max_players||2)).toLocaleString()}</span>
              <span style={{ fontSize:10, color:'rgba(251,191,36,.5)', fontWeight:700 }}>coins</span>
            </div>
          </div>
          <WaitingLobby battle={battle} players={players} teams={teams} modeLabel={modeLabel} userEmail={userEmail} onClose={onClose} onJoin={onJoin} onAddBot={onAddBot} onFillBots={onFillBots} balance={balance} />
        </div>
      </div>
    );
  }
  return (
    <div className="ba-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px', position:'relative' }}>
      <style>{CSS}</style>
      <ConfettiEffect active={showConfetti} />
      <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:18 }}>
        <div style={{ position:'relative', overflow:'hidden', borderRadius:16, background:'linear-gradient(120deg,#04000a 0%,#0e0020 40%,#100030 70%,#08000e 100%)', border:'1px solid rgba(251,191,36,.12)', padding:'16px 20px' }}>
          <div className="ba-scan" />
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 40% 100% at 90% 50%,rgba(168,85,247,.12) 0%,transparent 60%)' }} />
          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:9, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,.5)', flexShrink:0, transition:'all .2s' }} onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(251,191,36,.4)'; e.currentTarget.style.color='#fbbf24'; }} onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; e.currentTarget.style.color='rgba(255,255,255,.5)'; }}>
              <ArrowLeft style={{ width:13, height:13 }} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
              <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>{modeLabel||'1v1'}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:700 }}>Pot:</span>
              <span style={{ fontSize:14, fontWeight:900, color:'#fbbf24' }}>{totalPot.toLocaleString()}</span>
              <span style={{ fontSize:9, color:'rgba(251,191,36,.5)', fontWeight:700 }}>coins</span>
            </div>
            {activeModes.map(m => (
              <span key={m.label} style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${m.color}18`, color:m.color, border:`1px solid ${m.color}35`, letterSpacing:'.1em', textTransform:'uppercase' }}>{m.icon} {m.label}</span>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              {selectedCases.map((_,i) => (
                <div key={i} className={i===currentRound&&!done ? 'ba-pip-active' : ''} style={{ height:6, borderRadius:4, transition:'all .3s', width: i===currentRound ? 20 : i<currentRound ? 18 : 8, background: i<currentRound ? '#a855f7' : i===currentRound ? '#fbbf24' : 'rgba(255,255,255,.1)' }} />
              ))}
              <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.4)', marginLeft:4 }}>{done ? totalRounds : currentRound+1}/{totalRounds}</span>
            </div>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(251,191,36,.4),rgba(168,85,247,.4),transparent)' }} />
        </div>
        {isTerminal && !done && <ModeNotice icon="⚡" label="Terminal" color="#fbbf24">Terminal mode — only the <strong>last round</strong> determines the winner.</ModeNotice>}
        {isCrazy    && !done && <ModeNotice icon="🎭" label="Crazy"    color="#f472b6">Crazy mode — player with the <strong>lowest</strong> total wins!</ModeNotice>}
        {isGroup    && !done && <ModeNotice icon="🔄" label="Group"    color="#34d399">Group mode — all profit is split equally among all players.</ModeNotice>}
        {jackpotPhase && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
            <JackpotWheel teamList={teamList} players={players} playerTotals={players.map((_,pi)=>getPlayerTotal(pi))} onWinner={(wTi)=>setTimeout(()=>finishBattle(wTi),800)} />
          </motion.div>
        )}
        {done && (
          <div className="ba-winner-banner" style={{ position:'relative', overflow:'hidden', borderRadius:18, background:'linear-gradient(145deg,#0e0800,#140c00,#0a0400)', border:'1px solid rgba(251,191,36,.35)', boxShadow:'0 0 0 1px rgba(251,191,36,.1), 0 0 80px rgba(251,191,36,.15)', padding:'28px 24px', textAlign:'center' }}>
            <div className="ba-hex" />
            <Particles accent="#fbbf24" count={12} />
            <Particles accent="#a855f7" count={8} />
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(251,191,36,.15) 0%,transparent 70%)' }} />
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#fbbf24,#f59e0b,transparent)' }} />
            <div style={{ position:'relative', zIndex:2 }}>
              <p style={{ fontSize:28, fontWeight:900, color:'#fff', marginBottom:6 }}>🏆 Battle Over!</p>
              {payoutLabel && <p style={{ fontSize:13, color:'#34d399', fontWeight:800, marginBottom:20 }}>{payoutLabel}</p>}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, overflowX:'auto', flexWrap:'wrap' }}>
                {teamList.map((mi, ti) => {
                  const isW = isGroup || ti===winnerTeamIdx;
                  const pal = TEAM_PALETTE[ti%TEAM_PALETTE.length];
                  return (
                    <React.Fragment key={ti}>
                      <div style={{ opacity: isW ? 1 : 0.3, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                        {teamList.length>1 && <span style={{ fontSize:11, fontWeight:900, color:pal.color, textTransform:'uppercase', letterSpacing:'.1em' }}>Team {ti+1} · {teamTotals[ti]?.toLocaleString()}</span>}
                        <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
                          {mi.map(pi => (
                            <div key={pi} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, width:64 }}>
                              <div style={{ height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                {isW && <span style={{ fontSize:18 }}>{isGroup ? '🎁' : '👑'}</span>}
                              </div>
                              <div style={{ width:48, height:48, borderRadius:'50%', overflow:'hidden', background:`linear-gradient(135deg,${pal.color}33,${pal.color}18)`, border:`2px solid ${pal.color}66`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: isW ? `0 0 24px ${pal.glow}` : 'none', fontSize:20 }}>
                                {players[pi]?.isBot ? <span>🤖</span> : safeAvatarUrl(players[pi]?.avatar_url) ? <img src={safeAvatarUrl(players[pi].avatar_url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span>{players[pi]?.name?.[0]?.toUpperCase()||'?'}</span>}
                              </div>
                              <p style={{ fontSize:11, color:'rgba(255,255,255,.55)', textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{players[pi]?.name}</p>
                              <p style={{ fontSize:14, fontWeight:900, color: isW ? '#fbbf24' : 'rgba(255,255,255,.4)' }}>{playerTotals[pi]?.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {ti < teamList.length-1 && <div style={{ fontSize:16, fontWeight:900, color:'rgba(255,255,255,.15)', flexShrink:0 }}>VS</div>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{ marginTop:24 }}>
                <button onClick={onClose} style={{ padding:'12px 44px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000', fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif', boxShadow:'0 0 36px rgba(251,191,36,.5)', transition:'all .2s' }} onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px) scale(1.04)'; }} onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0) scale(1)'; }}>Done</button>
              </div>
            </div>
          </div>
        )}
        <AnimatePresence>
          {phase==='countdown' && (
            <motion.div key="cd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(4,0,10,.92)', gap:32, backdropFilter:'blur(4px)' }}>
              <div className="ba-hex" style={{ opacity:1 }} />
              <Particles accent="#fbbf24" count={14} />
              <Particles accent="#a855f7" count={10} />
              <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:2 }}>
                {allPlayerIndices.map((pi, idx) => {
                  const color = PLAYER_COLORS[idx%PLAYER_COLORS.length];
                  return (
                    <motion.div key={pi} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.1 }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                      <div style={{ width:52, height:52, borderRadius:'50%', overflow:'hidden', background:`linear-gradient(135deg,${color}33,${color}18)`, border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px ${color}55`, fontSize:22 }}>
                        {players[pi]?.isBot ? <span>🤖</span> : safeAvatarUrl(players[pi]?.avatar_url) ? <img src={safeAvatarUrl(players[pi].avatar_url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color, fontWeight:900 }}>{players[pi]?.name?.[0]?.toUpperCase()||'?'}</span>}
                      </div>
                      <span style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.8)' }}>{players[pi]?.name}</span>
                      <div style={{ width:36, height:3, borderRadius:2, background:color, boxShadow:`0 0 8px ${color}` }} />
                    </motion.div>
                  );
                })}
              </div>
              <motion.div key={countdown} initial={{ scale:0.1, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:1.8, opacity:0 }} transition={{ duration:.35, ease:[.34,1.56,.64,1] }} style={{ position:'relative', zIndex:2, fontSize:'9rem', fontWeight:900, color:'#fff', lineHeight:1, textShadow:'0 0 60px rgba(251,191,36,.5)', fontFamily:'Nunito,sans-serif' }}>
                {countdown===0 ? '🎲' : countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ display:'flex', gap:8, alignItems:'stretch', width:'100%' }}>
          {teamList.map((mi, ti) => {
            const pal = TEAM_PALETTE[ti%TEAM_PALETTE.length];
            return (
              <React.Fragment key={ti}>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
                  {teamList.length>1 && (
                    <div style={{ textAlign:'center' }}>
                      <span style={{ fontSize:10, fontWeight:900, padding:'2px 12px', borderRadius:20, background:pal.bg, color:pal.color, border:`1px solid ${pal.border}`, textTransform:'uppercase', letterSpacing:'.1em' }}>Team {ti+1}{done ? ` · ${teamTotals[ti]?.toLocaleString()}` : ''}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
                    {mi.map(pi => {
                      const round  = currentRoundRef.current;
                      const rolled = allRolled.current?.[round]?.[pi];
                      return (
                        <PlayerColumn
                          key={pi}
                          player={players[pi]}
                          playerColor={playerColorMap[pi]}
                          isWinner={done && (isGroup || ti===winnerTeamIdx)}
                          wonItems={playerItems[pi]||[]}
                          spinPhase={playerPhases[pi]}
                          caseItems={caseItems}
                          spinnerKey={`${currentRound}-${pi}`}
                          spinnerItem={rolled?.item}
                          magicItem={rolled?.isMagic ? rolled.item : null}
                          onSpinDone={()=>handleNormalSpinDone(pi)}
                          onMagicSpinDone={()=>handleMagicSpinDone(pi)}
                          fast={isFastMode}
                          pct={grandPlayerTotal>0 ? (playerTotals[pi]||0)/grandPlayerTotal : 0}
                          grandTotal={grandPlayerTotal}
                          showPct={isJackpot}
                        />
                      );
                    })}
                  </div>
                </div>
                {ti < teamList.length-1 && <VsDivider />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}