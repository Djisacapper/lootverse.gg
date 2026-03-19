import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   PRIZE TABLES
═══════════════════════════════════════════════════════════════ */
const RACES = {
  monthly: {
    label: 'Monthly Race',
    pool: 500000,
    prizes: [225000, 125000, 75000, 25000],
    top10Split: 7,
    cycle: 'Resets end of month',
    color: '#C89B3C',
    colorDim: '#7A5C1E',
    glow: '180,140,50',
    altColor: '#7C3AED',
  },
  weekly: {
    label: 'Weekly Race',
    pool: 45000,
    prizes: [20250, 11250, 6750, 2250],
    top10Split: 7,
    cycle: 'Resets every Sunday',
    color: '#9B5CF6',
    colorDim: '#5B21B6',
    glow: '139,92,246',
    altColor: '#C89B3C',
  },
};

function prizeFor(tab, rank) {
  const r = RACES[tab];
  if (rank === 1) return r.prizes[0];
  if (rank === 2) return r.prizes[1];
  if (rank === 3) return r.prizes[2];
  if (rank <= 10) return Math.floor(r.prizes[3] / r.top10Split);
  return 0;
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

* { box-sizing:border-box; margin:0; padding:0; }
.lb { font-family:'Outfit',sans-serif; background:#08040F; min-height:100vh; color:#fff; position:relative; }

.lb-light {
  position:fixed; border-radius:50%; filter:blur(90px); pointer-events:none; z-index:0;
  animation:lb-breathe var(--dur,9s) ease-in-out infinite var(--dl,0s);
}
@keyframes lb-breathe {
  0%,100% { opacity:0.08; transform:scale(1); }
  50%     { opacity:0.16; transform:scale(1.08); }
}

@keyframes lb-spin {
  to { transform:rotate(360deg); }
}
@keyframes lb-float {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-6px); }
}
.lb-float { animation:lb-float 3.2s ease-in-out infinite; }

@keyframes lb-shim {
  0%   { transform:translateX(-160%) skewX(-18deg); }
  100% { transform:translateX(280%)  skewX(-18deg); }
}

@keyframes lb-bar {
  from { width:0; }
}
.lb-fill { animation:lb-bar 1.1s cubic-bezier(0.22,1,0.36,1) both; }

@keyframes lb-orb {
  0%,100% { box-shadow:0 0 0 0 rgba(var(--rgb),0.45); }
  60%     { box-shadow:0 0 0 10px rgba(var(--rgb),0); }
}
.lb-orb { animation:lb-orb 2.6s ease-out infinite; }

::-webkit-scrollbar { width:3px; }
::-webkit-scrollbar-thumb { background:#2D1B5A; border-radius:4px; }

.lb-tab {
  font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
  padding:10px 22px; border-radius:40px; border:none; cursor:pointer;
  letter-spacing:0.025em; transition:all 0.22s;
  display:flex; align-items:center; gap:7px;
}
`;

/* ═══════════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════════ */
function Avatar({ user, size = 44, rank }) {
  const hasImg = user?.avatar_url && user.avatar_url !== 'null';
  const p = rank === 1
    ? { bg:'linear-gradient(135deg,#3D2200,#C89B3C,#FFF1B0)', ring:'#C89B3C', rgb:'200,155,60',  spd:6 }
    : rank === 2
    ? { bg:'linear-gradient(135deg,#1A003F,#7C3AED,#C4B5FD)', ring:'#7C3AED', rgb:'124,58,237',  spd:9 }
    : rank === 3
    ? { bg:'linear-gradient(135deg,#2D0030,#C026D3,#F0ABFC)', ring:'#C026D3', rgb:'192,38,211',  spd:12 }
    : { bg:'linear-gradient(135deg,#1e0533,#4C1D95)',          ring:'#4C1D95', rgb:'76,29,149',   spd:0 };

  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      {rank <= 3 && (
        <div style={{
          position:'absolute', inset:-3, borderRadius:'50%',
          background:`conic-gradient(${p.ring}, transparent 55%, ${p.ring})`,
          animation:`lb-spin ${p.spd}s linear infinite`, opacity:0.75,
        }} />
      )}
      <div
        className={rank === 1 ? 'lb-orb' : ''}
        style={{
          '--rgb': p.rgb,
          position:'absolute', inset: rank<=3 ? 2 : 0, borderRadius:'50%',
          background: p.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: size * 0.38, fontWeight:700, color:'#fff',
          overflow:'hidden',
        }}>
        {hasImg
          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : (user?.username?.[0]?.toUpperCase() || '?')}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIZE POOL CARD
═══════════════════════════════════════════════════════════════ */
function PrizeCard({ tab }) {
  const r = RACES[tab];
  const splits = [
    { label:'1st Place',  coins: r.prizes[0],                              icon:'♛', color:'#C89B3C', bg:'rgba(200,155,60,0.1)',   border:'rgba(200,155,60,0.22)' },
    { label:'2nd Place',  coins: r.prizes[1],                              icon:'♜', color:'#A78BFA', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.18)' },
    { label:'3rd Place',  coins: r.prizes[2],                              icon:'♞', color:'#E879F9', bg:'rgba(232,121,249,0.08)', border:'rgba(232,121,249,0.18)' },
    { label:'4th – 10th', coins: `${Math.floor(r.prizes[3]/r.top10Split).toLocaleString()} ea`, icon:'✦', color:'#818CF8', bg:'rgba(129,140,248,0.07)', border:'rgba(129,140,248,0.16)' },
  ];

  return (
    <motion.div
      initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
      style={{
        position:'relative', borderRadius:24,
        background:'linear-gradient(145deg,#0E0618,#130824,#0A0415)',
        border:`1px solid rgba(${r.glow},0.22)`,
        overflow:'hidden', padding:'26px 24px 22px',
        boxShadow:`0 0 60px rgba(${r.glow},0.07), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}>

      {/* shimmer sweep */}
      <div style={{
        position:'absolute', top:0, left:'-25%', width:'30%', height:'100%',
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.022),transparent)',
        animation:'lb-shim 6s ease-in-out infinite', pointerEvents:'none',
      }} />

      {/* header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, position:'relative' }}>
        <div>
          <p style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', fontWeight:500, marginBottom:7 }}>
            Prize Pool · {r.cycle}
          </p>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:25, color:'#fff', lineHeight:1 }}>
            {r.label}
          </h2>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:30, fontWeight:500, color:r.color, lineHeight:1, filter:`drop-shadow(0 0 10px rgba(${r.glow},0.45))` }}>
            {r.pool.toLocaleString()}
          </div>
          <div style={{ fontSize:9, letterSpacing:'0.13em', color:'rgba(255,255,255,0.3)', marginTop:3, textTransform:'uppercase' }}>
            Total Coins
          </div>
        </div>
      </div>

      {/* 4-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {splits.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.12 + i*0.07 }}
            style={{
              background:s.bg, border:`1px solid ${s.border}`,
              borderRadius:16, padding:'14px 8px', textAlign:'center',
            }}>
            <div style={{ fontSize:17, lineHeight:1, marginBottom:7 }}>{s.icon}</div>
            <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:6, fontWeight:500 }}>
              {s.label}
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize: typeof s.coins === 'string' ? 11 : 14, fontWeight:500, color:s.color }}>
              {typeof s.coins === 'number' ? s.coins.toLocaleString() : s.coins}
            </div>
          </motion.div>
        ))}
      </div>

      {/* bottom line */}
      <div style={{ position:'absolute', bottom:0, left:'18%', right:'18%', height:1, background:`linear-gradient(90deg,transparent,rgba(${r.glow},0.55),transparent)` }} />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PODIUM
═══════════════════════════════════════════════════════════════ */
const SPOTS = [
  { rank:1, h:158, color:'#C89B3C', dim:'rgba(120,90,20,0.7)', border:'rgba(200,155,60,0.3)',  label:'1st', labelBg:'rgba(200,155,60,0.14)' },
  { rank:2, h:118, color:'#A78BFA', dim:'rgba(76,29,149,0.6)',  border:'rgba(167,139,250,0.25)', label:'2nd', labelBg:'rgba(167,139,250,0.11)' },
  { rank:3, h:92,  color:'#E879F9', dim:'rgba(134,25,143,0.5)', border:'rgba(232,121,249,0.22)', label:'3rd', labelBg:'rgba(232,121,249,0.1)'  },
];

function Podium({ users, tab }) {
  const r = RACES[tab];
  const display = [SPOTS[1], SPOTS[0], SPOTS[2]]; // 2nd, 1st, 3rd

  return (
    <div style={{
      position:'relative', borderRadius:24, overflow:'hidden',
      background:'linear-gradient(160deg,#0B0519 0%,#130824 55%,#090313 100%)',
      border:'1px solid rgba(255,255,255,0.07)',
      boxShadow:'0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding:'38px 20px 0',
    }}>
      {/* top glow */}
      <div style={{ position:'absolute', top:'-25%', left:'50%', transform:'translateX(-50%)', width:420, height:220, borderRadius:'50%', background:`radial-gradient(ellipse,rgba(${r.glow},0.1) 0%,transparent 70%)`, pointerEvents:'none' }} />
      {/* top rule */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(200,155,60,0.28),rgba(139,92,246,0.28),transparent)' }} />

      {/* title */}
      <div style={{ textAlign:'center', position:'relative', zIndex:2, marginBottom:34 }}>
        <div className="lb-float" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:48, height:48, borderRadius:15, marginBottom:10, background:'linear-gradient(135deg,rgba(200,155,60,0.18),rgba(124,58,237,0.18))', border:'1px solid rgba(200,155,60,0.28)', fontSize:22 }}>♛</div>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'#fff', letterSpacing:'-0.01em' }}>Top Champions</h2>
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:5, letterSpacing:'0.1em', textTransform:'uppercase' }}>ranked by total wager</p>
      </div>

      {/* columns */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:4, position:'relative', zIndex:2 }}>
        {display.map((sp) => {
          const u = users[sp.rank - 1];
          const prize = prizeFor(tab, sp.rank);
          return (
            <motion.div
              key={sp.rank}
              initial={{ opacity:0, y:26 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: sp.rank * 0.11, duration:0.55, ease:[0.22,1,0.36,1] }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, maxWidth:160 }}>

              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:sp.color, marginBottom:8, opacity:0.8 }}>
                {sp.label}
              </div>

              {u
                ? <Avatar user={u} size={sp.rank===1?72:56} rank={sp.rank} />
                : <div style={{ width:sp.rank===1?72:56, height:sp.rank===1?72:56, borderRadius:'50%', background:'rgba(255,255,255,0.04)', border:'1px dashed rgba(255,255,255,0.1)' }} />}

              <p style={{ fontSize:12, fontWeight:600, color:'#fff', marginTop:10, marginBottom:3, maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>
                {u?.username || '—'}
              </p>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.38)', marginBottom:6 }}>
                ${(u?.total_wagered||0).toLocaleString()}
              </p>

              {/* prize chip */}
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:14, padding:'4px 12px', borderRadius:40, background:sp.labelBg, border:`1px solid ${sp.border}` }}>
                <span style={{ fontSize:9, color:sp.color }}>✦</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:500, color:sp.color }}>
                  {prize.toLocaleString()}
                </span>
              </div>

              {/* block */}
              <motion.div
                initial={{ scaleY:0 }} animate={{ scaleY:1 }}
                transition={{ delay:0.35 + sp.rank*0.09, duration:0.5, ease:[0.22,1,0.36,1] }}
                style={{
                  width:'100%', height:sp.h,
                  borderRadius:'10px 10px 0 0',
                  background:`linear-gradient(to top,${sp.dim},rgba(${sp.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.35))`,
                  border:`1px solid ${sp.border}`, borderBottom:'none',
                  transformOrigin:'bottom', position:'relative', overflow:'hidden',
                  boxShadow:`0 -10px 32px ${sp.color}18`,
                }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(255,255,255,0.07),transparent 40%)' }} />
                {[20,40,60,80].map(pct => (
                  <div key={pct} style={{ position:'absolute', top:`${pct}%`, left:0, right:0, height:1, background:'rgba(255,255,255,0.035)' }} />
                ))}
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Serif Display',serif", fontSize: sp.rank===1?30:22, color:sp.color, opacity:0.6 }}>
                  {sp.rank}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* bottom rule */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(${r.glow},0.5),rgba(139,92,246,0.4),transparent)` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIST ROW #4–10
═══════════════════════════════════════════════════════════════ */
function Row({ user:u, rank, tab, index, maxWager }) {
  const [hov, setHov] = useState(false);
  const r = RACES[tab];
  const prize = prizeFor(tab, rank);
  const pct = Math.min(100, Math.round(((u?.total_wagered||0) / maxWager) * 100));

  return (
    <motion.div
      initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.055, duration:0.38, ease:[0.22,1,0.36,1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:'relative', overflow:'hidden', borderRadius:18,
        background: hov ? `linear-gradient(135deg,rgba(${r.glow},0.07),#0D0720)` : '#0D0720',
        border:`1px solid ${hov ? `rgba(${r.glow},0.28)` : 'rgba(255,255,255,0.06)'}`,
        transition:'border-color 0.2s, background 0.2s',
        padding:'13px 18px', display:'flex', alignItems:'center', gap:14,
      }}>

      {/* left accent */}
      <div style={{
        position:'absolute', left:0, top:'22%', bottom:'22%', width:2, borderRadius:2,
        background: hov ? `linear-gradient(to bottom,${r.color},${r.altColor})` : 'transparent',
        transition:'background 0.2s',
      }} />

      {hov && (
        <div style={{ position:'absolute', top:0, left:'-25%', width:'28%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.018),transparent)', animation:'lb-shim 2.8s ease-in-out infinite', pointerEvents:'none' }} />
      )}

      {/* rank badge */}
      <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:`rgba(${r.glow},0.07)`, border:`1px solid rgba(${r.glow},0.14)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color:r.color }}>{rank}</span>
      </div>

      <Avatar user={u} size={38} rank={rank} />

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u?.username || 'Player'}
          </p>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.22)', fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
            lv.{u?.level||1}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:2, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
            <div className="lb-fill" style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,rgba(${r.glow},0.45),${r.color})` }} />
          </div>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.32)', flexShrink:0 }}>
            ${(u?.total_wagered||0).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:500, color:r.color, padding:'4px 10px', borderRadius:40, background:`rgba(${r.glow},0.08)`, border:`1px solid rgba(${r.glow},0.18)` }}>
          +{prize.toLocaleString()}
        </div>
        <p style={{ fontSize:9, color:'rgba(255,255,255,0.18)', letterSpacing:'0.08em', marginTop:3, textTransform:'uppercase' }}>coins</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function Leaderboard() {
  useRequireAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('monthly');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('syncLeaderboard', {});
      setEntries(res?.data?.entries || res?.entries || []);
    } catch { setError('Failed to load leaderboard.'); }
    finally { setLoading(false); }
  };

  const maxWager = entries[0]?.total_wagered || 1;
  const r = RACES[tab];

  /* loaders */
  if (loading) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:20 }}>
      <style>{CSS}</style>
      <div style={{ position:'relative', width:60, height:60 }}>
        {[0,1,2].map(i => <div key={i} style={{ position:'absolute', inset:i*10, borderRadius:'50%', border:`1px solid rgba(${i===0?'200,155,60':i===1?'139,92,246':'192,38,211'},0.45)`, animation:`lb-spin ${3+i*1.5}s linear ${i%2?'reverse':''} infinite` }} />)}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#C89B3C', boxShadow:'0 0 14px #C89B3C' }} />
        </div>
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)', letterSpacing:'0.14em', textTransform:'uppercase' }}>Loading Race…</p>
    </div>
  );

  if (error) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:14 }}>
      <style>{CSS}</style>
      <p style={{ fontSize:14, color:'rgba(248,113,113,0.7)' }}>{error}</p>
      <button onClick={load} style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, padding:'9px 20px', borderRadius:40, cursor:'pointer', background:'rgba(139,92,246,0.14)', color:'#A78BFA', border:'1px solid rgba(139,92,246,0.28)' }}>Try Again</button>
    </div>
  );

  if (!entries.length) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:12 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:44, opacity:0.18, fontFamily:"'DM Serif Display',serif" }}>♛</div>
      <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:'rgba(255,255,255,0.22)' }}>No players yet</p>
    </div>
  );

  return (
    <div className="lb">
      <style>{CSS}</style>

      {/* ambient orbs */}
      <div className="lb-light" style={{ width:520, height:380, top:'-8%',  left:'15%',  background:'#7C3AED', '--dur':'9s',  '--dl':'0s'  }} />
      <div className="lb-light" style={{ width:380, height:280, top:'35%',  right:'-8%', background:'#C89B3C', '--dur':'12s', '--dl':'-4s' }} />
      <div className="lb-light" style={{ width:320, height:320, bottom:'5%',left:'-6%',  background:'#4C1D95', '--dur':'14s', '--dl':'-7s' }} />

      <div style={{ maxWidth:700, margin:'0 auto', padding:'28px 16px 100px', display:'flex', flexDirection:'column', gap:18, position:'relative', zIndex:1 }}>

        {/* header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <div style={{ width:2, height:34, borderRadius:2, background:'linear-gradient(to bottom,#C89B3C,#7C3AED)' }} />
                <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, color:'#fff', letterSpacing:'-0.02em', lineHeight:1 }}>Leaderboard</h1>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginLeft:12, letterSpacing:'0.03em' }}>
                Wager more · Rank higher · Earn bigger
              </p>
            </div>
            <button onClick={load} style={{ width:36, height:36, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'rgba(255,255,255,0.28)', fontFamily:'sans-serif', transition:'all 0.2s' }}>↻</button>
          </div>
        </motion.div>

        {/* tabs */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.07 }}
          style={{ display:'inline-flex', gap:4, padding:4, borderRadius:50, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', alignSelf:'flex-start' }}>
          {(['monthly','weekly']).map(t => {
            const rc = RACES[t];
            const active = tab === t;
            return (
              <button key={t} className="lb-tab" onClick={() => setTab(t)} style={{
                background: active ? `rgba(${rc.glow},0.16)` : 'transparent',
                border: active ? `1px solid rgba(${rc.glow},0.32)` : '1px solid transparent',
                color: active ? rc.color : 'rgba(255,255,255,0.3)',
                boxShadow: active ? `0 0 18px rgba(${rc.glow},0.18)` : 'none',
              }}>
                <span style={{ fontSize:13 }}>{t === 'monthly' ? '♛' : '✦'}</span>
                {rc.label}
              </button>
            );
          })}
        </motion.div>

        {/* tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
            style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <PrizeCard tab={tab} />
            <Podium users={entries} tab={tab} />

            {/* 4–10 */}
            {entries.length > 3 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0 12px' }}>
                  <div style={{ width:2, height:16, borderRadius:2, background:`linear-gradient(to bottom,${r.color},${r.altColor})` }} />
                  <span style={{ fontSize:10, letterSpacing:'0.13em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
                    4th to 10th Place
                  </span>
                  <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(255,255,255,0.06),transparent)' }} />
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.2)' }}>
                    +{Math.floor(r.prizes[3]/r.top10Split).toLocaleString()} coins each
                  </span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {entries.slice(3, 10).map((u, i) => (
                    <Row key={u.user_email || i} user={u} rank={i+4} tab={tab} index={i} maxWager={maxWager} />
                  ))}
                </div>
              </div>
            )}

            {/* footer note */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}
              style={{ padding:'12px 16px', borderRadius:14, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:12, opacity:0.25, lineHeight:1.5 }}>ℹ</span>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)', lineHeight:1.65 }}>
                {tab === 'monthly'
                  ? 'Monthly race tracks total wagers. The 500,000 coin pool is split among the top 10 at the end of each calendar month.'
                  : 'Weekly race resets every Sunday. The 45,000 coin pool is distributed to the top 10 at midnight.'}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}