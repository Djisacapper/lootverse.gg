import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/* ─── CONFIG ─────────────────────────────────────────────────── */
const RACES = {
  weekly: {
    label: 'Weekly Race', pool: 45000, icon: '⚡',
    prizes: [20250, 11250, 6750, 2250], top10Split: 7,
    cycle: 'weekly', resetDay: 'Sunday',
    color: '#a855f7', glow: '168,85,247',
    podiumPrizes: [20250, 11250, 6750],
  },
  monthly: {
    label: 'Monthly Race', pool: 500000, icon: '👑',
    prizes: [225000, 125000, 75000, 25000], top10Split: 7,
    cycle: 'monthly', resetDay: 'end of month',
    color: '#F5C842', glow: '245,200,66',
    podiumPrizes: [225000, 125000, 75000],
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

function getTimeLeft(tab) {
  const now = new Date();
  let target;
  if (tab === 'weekly') {
    target = new Date(now);
    const day = now.getDay();
    const daysUntilSun = day === 0 ? 7 : 7 - day;
    target.setDate(now.getDate() + daysUntilSun);
    target.setHours(0, 0, 0, 0);
  } else {
    target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  }
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;600&display=swap');

.lb { font-family:'Outfit',sans-serif; color:#fff; position:relative; overflow-x:hidden; }

@keyframes lb-spin  { to { transform:rotate(360deg); } }
@keyframes lb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes lb-breathe { 0%,100%{opacity:.07;transform:scale(1)} 50%{opacity:.16;transform:scale(1.1)} }
@keyframes lb-bar   { from{width:0} }
@keyframes lb-pulse {
  0%  { box-shadow:0 0 0 0 rgba(245,200,66,.55); }
  70% { box-shadow:0 0 0 16px rgba(245,200,66,0); }
  100%{ box-shadow:0 0 0 0 rgba(245,200,66,0); }
}
@keyframes lb-shimmer {
  0%   { transform:translateX(-120%) skewX(-15deg); }
  100% { transform:translateX(350%)  skewX(-15deg); }
}
@keyframes lb-coin-spin {
  0%   { transform:rotateY(0deg); }
  100% { transform:rotateY(360deg); }
}
@keyframes lb-glow-pulse {
  0%,100% { opacity:.25; transform:scale(1); }
  50%      { opacity:1;   transform:scale(1.3); }
}

.lb-float  { animation: lb-float 3.2s ease-in-out infinite; }
.lb-fill   { animation: lb-bar 1.3s cubic-bezier(.22,1,.36,1) both; }
.lb-bg     { position:fixed; border-radius:50%; filter:blur(110px); pointer-events:none; z-index:0; animation:lb-breathe var(--dur,10s) ease-in-out infinite var(--dl,0s); }

::-webkit-scrollbar       { width:3px; }
::-webkit-scrollbar-thumb { background:#2D1B5A; border-radius:4px; }

.lb-tab {
  font-family:'Outfit',sans-serif; font-size:13px; font-weight:700;
  padding:9px 22px; border-radius:50px; border:none; cursor:pointer;
  letter-spacing:.03em; transition:all .22s; display:flex; align-items:center; gap:7px;
}

.lb-podium-card {
  border-radius:20px; position:relative; overflow:hidden;
  transition:transform .25s, box-shadow .25s;
  cursor:default;
}
.lb-podium-card:hover { transform:translateY(-4px); }

.lb-table-row {
  display:grid; grid-template-columns:56px 1fr 1fr auto;
  align-items:center; gap:12px;
  padding:12px 18px; border-radius:14px;
  border:1px solid rgba(255,255,255,.06);
  background:rgba(13,6,28,.7);
  transition:background .2s, border-color .2s;
  cursor:default;
}
.lb-table-row:hover {
  background:rgba(20,10,42,.9);
  border-color:rgba(168,85,247,.2);
}

.lb-cd-box {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-width:52px; padding:8px 14px; border-radius:12px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
}
`;

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Avatar({ user, size = 40, rank }) {
  const hasImg = user?.avatar_url && user.avatar_url !== 'null';
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const ringColors = { 1:'#F5C842', 2:'#a78bfa', 3:'#f472b6' };
  const rc = ringColors[rank];

  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      {rc && (
        <div style={{
          position:'absolute', inset:-2, borderRadius:'50%',
          background:`conic-gradient(${rc}, transparent 50%, ${rc})`,
          animation:'lb-spin 5s linear infinite', opacity:.8,
        }} />
      )}
      <div style={{
        position:'absolute', inset: rc ? 2 : 0, borderRadius:'50%',
        background:'linear-gradient(135deg,#1e0535,#3b0764)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size * 0.38, fontWeight:800, color:'#fff', overflow:'hidden',
      }}>
        {hasImg
          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : initial}
      </div>
    </div>
  );
}

/* ─── COUNTDOWN ──────────────────────────────────────────────── */
function Countdown({ tab }) {
  const [t, setT] = useState(() => getTimeLeft(tab));
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(tab)), 1000);
    return () => clearInterval(id);
  }, [tab]);

  const parts = [
    { val: t.d, label: 'D' },
    { val: t.h, label: 'H' },
    { val: t.m, label: 'M' },
    { val: t.s, label: 'S' },
  ];

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
      {parts.map((p, i) => (
        <React.Fragment key={p.label}>
          <div className="lb-cd-box">
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:700, color:'#fff', lineHeight:1 }}>
              {String(p.val).padStart(2,'0')}
            </span>
            <span style={{ fontSize:8, color:'rgba(255,255,255,.3)', letterSpacing:'.1em', marginTop:3, textTransform:'uppercase' }}>{p.label}</span>
          </div>
          {i < 3 && <span style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,.3)', marginBottom:10 }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── COIN ICON ──────────────────────────────────────────────── */
function Coin({ size = 16 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 0 6px rgba(251,191,36,.5)',
      fontSize: size * 0.5, fontWeight:900, color:'#000',
    }}>$</div>
  );
}

/* ─── PODIUM CARD ────────────────────────────────────────────── */
const PODIUM_META = [
  { rank:1, label:'1st', size:'large',  marginTop:0,   cardH:300,
    bg:'linear-gradient(160deg,#1a1200 0%,#2d1f00 40%,#1a0e00 100%)',
    border:'rgba(245,200,66,.35)', glow:'245,200,66', color:'#F5C842',
    icon:'👑', avatarSize:72 },
  { rank:2, label:'2nd', size:'medium', marginTop:40,  cardH:260,
    bg:'linear-gradient(160deg,#0e0820 0%,#1e1040 40%,#0a0415 100%)',
    border:'rgba(167,139,250,.3)', glow:'167,139,250', color:'#a78bfa',
    icon:'🥈', avatarSize:58 },
  { rank:3, label:'3rd', size:'medium', marginTop:40,  cardH:260,
    bg:'linear-gradient(160deg,#180010 0%,#2d0520 40%,#0e000a 100%)',
    border:'rgba(244,114,182,.28)', glow:'244,114,182', color:'#f472b6',
    icon:'🥉', avatarSize:58 },
];

function PodiumCard({ user: u, meta, tab }) {
  const prize = prizeFor(tab, meta.rank);
  const r = RACES[tab];

  return (
    <motion.div
      className="lb-podium-card"
      initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: meta.rank * 0.1, duration:.6, ease:[.22,1,.36,1] }}
      style={{
        marginTop: meta.marginTop,
        flex: meta.size === 'large' ? '0 0 220px' : '0 0 185px',
        height: meta.cardH,
        background: meta.bg,
        border:`1px solid ${meta.border}`,
        boxShadow:`0 0 60px rgba(${meta.glow},.12), 0 20px 60px rgba(0,0,0,.6)`,
      }}>

      {/* shimmer */}
      <div style={{ position:'absolute', top:0, left:'-30%', width:'25%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)', animation:'lb-shimmer 5s ease-in-out infinite', pointerEvents:'none' }} />
      {/* top glow strip */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,rgba(${meta.glow},.8),transparent)` }} />

      <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', padding:'22px 16px 18px', height:'100%', justifyContent:'space-between' }}>

        {/* rank label */}
        <div style={{
          padding:'3px 18px', borderRadius:50,
          background:`rgba(${meta.glow},.12)`, border:`1px solid rgba(${meta.glow},.3)`,
          fontSize:11, fontWeight:800, color:meta.color, letterSpacing:'.08em', textTransform:'uppercase',
          display:'flex', alignItems:'center', gap:5,
        }}>
          <span>{meta.icon}</span>{meta.label}
        </div>

        {/* avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <Avatar user={u} size={meta.avatarSize} rank={meta.rank} />
          <p style={{ fontSize: meta.size==='large'?15:13, fontWeight:800, color:'#fff', textAlign:'center', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u?.username || '—'}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Coin size={13} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'rgba(255,255,255,.45)' }}>
              {(u?.total_wagered||0).toLocaleString()}
            </span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.06em' }}>wagered</span>
          </div>
        </div>

        {/* prize chip */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', gap:4,
          padding:'10px 20px', borderRadius:14,
          background:`rgba(${meta.glow},.1)`, border:`1px solid rgba(${meta.glow},.25)`,
          width:'100%',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Coin size={16} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize: meta.size==='large'?20:16, fontWeight:700, color:meta.color }}>
              {prize.toLocaleString()}
            </span>
          </div>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.1em' }}>Prize</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── TABLE ROW ──────────────────────────────────────────────── */
function TableRow({ user: u, rank, tab, index, maxWager }) {
  const prize = prizeFor(tab, rank);
  const r = RACES[tab];

  return (
    <motion.div
      className="lb-table-row"
      initial={{ opacity:0, x:-18 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.05, duration:.35, ease:[.22,1,.36,1] }}>

      {/* place */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:32, height:32, borderRadius:10, flexShrink:0,
          background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:'rgba(255,255,255,.6)',
        }}>{rank}</div>
      </div>

      {/* user */}
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <Avatar user={u} size={32} rank={0} />
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u?.username || 'Player'}
          </p>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.22)', fontFamily:"'DM Mono',monospace", background:'rgba(255,255,255,.05)', padding:'1px 6px', borderRadius:50 }}>
            lv.{u?.level||1}
          </span>
        </div>
      </div>

      {/* wagered */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <Coin size={13} />
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:'rgba(255,255,255,.4)' }}>
          {(u?.total_wagered||0).toLocaleString()}
        </span>
      </div>

      {/* prize */}
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <Coin size={13} />
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color: r.color }}>
          {prize.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function Leaderboard() {
  useRequireAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('weekly');
  const [spinning, setSpinning] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setSpinning(true); setError(null);
    try {
      const res = await base44.functions.invoke('syncLeaderboard', {});
      setEntries(res?.data?.entries || res?.entries || []);
    } catch { setError('Failed to load leaderboard.'); }
    finally { setLoading(false); setSpinning(false); }
  };

  const maxWager = entries[0]?.total_wagered || 1;
  const r = RACES[tab];

  /* ── Loading ── */
  if (loading) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:18 }}>
      <style>{CSS}</style>
      <div style={{ position:'relative', width:56, height:56 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ position:'absolute', inset:i*10, borderRadius:'50%', border:`1.5px solid rgba(${['245,200,66','168,85,247','232,121,249'][i]},.4)`, animation:`lb-spin ${3+i*1.5}s linear infinite` }} />
        ))}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#F5C842', boxShadow:'0 0 12px #F5C842' }} />
        </div>
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,.25)', letterSpacing:'.16em', textTransform:'uppercase' }}>Loading Race…</p>
    </div>
  );

  if (error) return (
    <div className="lb" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh', flexDirection:'column', gap:14 }}>
      <style>{CSS}</style>
      <p style={{ fontSize:14, color:'rgba(248,113,113,.7)' }}>{error}</p>
      <button onClick={load} style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:700, padding:'9px 22px', borderRadius:50, cursor:'pointer', background:'rgba(168,85,247,.14)', color:'#a855f7', border:'1px solid rgba(168,85,247,.3)' }}>Try Again</button>
    </div>
  );

  if (!entries.length) return (
    <div className="lb" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh', flexDirection:'column', gap:12 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:48, opacity:.15 }}>🏆</div>
      <p style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,.2)' }}>No players yet</p>
    </div>
  );

  /* Podium order: 2nd | 1st | 3rd */
  const podiumOrder = [PODIUM_META[1], PODIUM_META[0], PODIUM_META[2]];

  return (
    <div className="lb">
      <style>{CSS}</style>

      {/* ambient blobs */}
      <div className="lb-bg" style={{ width:500, height:380, top:'-8%',  left:'5%',   background:'#7c3aed', '--dur':'10s', '--dl':'0s'  }} />
      <div className="lb-bg" style={{ width:400, height:320, top:'30%',  right:'-5%', background:'#C89B3C', '--dur':'13s', '--dl':'-4s' }} />
      <div className="lb-bg" style={{ width:340, height:340, bottom:'5%',left:'-4%',  background:'#4C1D95', '--dur':'16s', '--dl':'-9s' }} />

      <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 16px 100px', position:'relative', zIndex:1 }}>

        {/* ── TABS ── */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div style={{ display:'inline-flex', gap:4, padding:4, borderRadius:50, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)' }}>
            {Object.entries(RACES).map(([key, rc]) => {
              const active = tab === key;
              return (
                <button key={key} className="lb-tab" onClick={() => setTab(key)} style={{
                  background: active ? `rgba(${rc.glow},.18)` : 'transparent',
                  border: `1px solid ${active ? `rgba(${rc.glow},.38)` : 'transparent'}`,
                  color: active ? rc.color : 'rgba(255,255,255,.32)',
                  boxShadow: active ? `0 0 22px rgba(${rc.glow},.2)` : 'none',
                }}>
                  <span>{rc.icon}</span>
                  {rc.label}
                </button>
              );
            })}
          </div>
          <button onClick={load} style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.3)' }}>
            <RefreshCw size={13} style={{ animation: spinning ? 'lb-spin .8s linear infinite' : 'none' }} />
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:.28, ease:[.22,1,.36,1] }}>

            {/* ── HERO PRIZE POOL ── */}
            <div style={{ textAlign:'center', marginBottom:10, position:'relative' }}>

              <motion.div
                initial={{ scale:.85, opacity:0 }} animate={{ scale:1, opacity:1 }}
                transition={{ delay:.1, duration:.6, ease:[.22,1,.36,1] }}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 18px', borderRadius:50, background:`rgba(${r.glow},.1)`, border:`1px solid rgba(${r.glow},.22)`, marginBottom:18 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.4)', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' }}>
                  {r.icon} {r.label}
                </span>
              </motion.div>

              {/* Retro marquee-light number */}
              <motion.div
                initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                transition={{ delay:.15, duration:.65, ease:[.22,1,.36,1] }}
                style={{ position:'relative', display:'inline-block', marginBottom:8 }}>
                {/* outer frame */}
                <div style={{
                  padding:'14px 32px', borderRadius:18,
                  background:'linear-gradient(160deg,#0d0818,#160a28)',
                  border:`2px solid rgba(${r.glow},.45)`,
                  boxShadow:`0 0 0 4px rgba(${r.glow},.06), 0 0 60px rgba(${r.glow},.25), inset 0 0 40px rgba(0,0,0,.6)`,
                  position:'relative', overflow:'hidden',
                }}>
                  {/* dot row top */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    {Array.from({length:14}).map((_,i)=>(
                      <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:`rgba(${r.glow},${(i%3===0)?.7:.2})`, boxShadow:`0 0 ${(i%3===0)?8:2}px rgba(${r.glow},.6)`, animation:`lb-glow-pulse ${1.2+i*0.15}s ease-in-out infinite`, animationDelay:`${i*0.08}s` }} />
                    ))}
                  </div>
                  {/* big number */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', padding:'4px 0' }}>
                    <Coin size={34} />
                    <span style={{
                      fontFamily:"'DM Mono',monospace", fontSize:54, fontWeight:600,
                      lineHeight:1, letterSpacing:'.06em',
                      color:'#fff',
                      textShadow:`0 0 20px rgba(${r.glow},.9), 0 0 40px rgba(${r.glow},.5), 0 0 80px rgba(${r.glow},.25)`,
                    }}>
                      {r.pool.toLocaleString()}
                    </span>
                  </div>
                  {/* dot row bottom */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                    {Array.from({length:14}).map((_,i)=>(
                      <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:`rgba(${r.glow},${(i%3===1)?.7:.2})`, boxShadow:`0 0 ${(i%3===1)?8:2}px rgba(${r.glow},.6)`, animation:`lb-glow-pulse ${1.4+i*0.12}s ease-in-out infinite`, animationDelay:`${i*0.1}s` }} />
                    ))}
                  </div>
                  {/* scanline overlay */}
                  <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0px,rgba(0,0,0,.12) 1px,transparent 1px,transparent 3px)', pointerEvents:'none', borderRadius:16 }} />
                </div>
              </motion.div>

              <p style={{ fontSize:10, color:'rgba(255,255,255,.22)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>
                Total Prize Pool
              </p>
            </div>

            {/* ── PODIUM ── */}
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:12, marginBottom:24, padding:'0 8px' }}>
              {podiumOrder.map(meta => (
                <PodiumCard key={meta.rank} user={entries[meta.rank - 1]} meta={meta} tab={tab} />
              ))}
            </div>

            {/* ── COUNTDOWN ── */}
            <motion.div
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
              style={{ marginBottom:28, textAlign:'center' }}>
              <p style={{ fontSize:9, color:'rgba(255,255,255,.28)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:10 }}>
                Resets in
              </p>
              <Countdown tab={tab} />
            </motion.div>

            {/* ── TABLE HEADER ── */}
            {entries.length > 3 && (
              <div>
                <div style={{
                  display:'grid', gridTemplateColumns:'56px 1fr 1fr auto',
                  gap:12, padding:'8px 18px', marginBottom:6,
                }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Place</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>User</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Wagered</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Prize</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {entries.slice(3, 10).map((u, i) => (
                    <TableRow key={u.user_email || i} user={u} rank={i+4} tab={tab} index={i} maxWager={maxWager} />
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}