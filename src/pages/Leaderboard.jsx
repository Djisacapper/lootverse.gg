import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, Crown, Medal, TrendingUp, Users, Coins } from 'lucide-react';

/* ─── PRIZE CONFIG ───────────────────────────────────────────── */
const RACES = {
  monthly: {
    label: 'Monthly Race', pool: 500000,
    prizes: [225000, 125000, 75000, 25000], top10Split: 7,
    cycle: 'Resets end of month', icon: '👑',
    color: '#F5C842', dim: '#7A5C1E', glow: '245,200,66',
    alt: '#a855f7', grad: 'linear-gradient(135deg,#1a0e00,#2a1a00)',
  },
  weekly: {
    label: 'Weekly Race', pool: 45000,
    prizes: [20250, 11250, 6750, 2250], top10Split: 7,
    cycle: 'Resets every Sunday', icon: '⚡',
    color: '#a855f7', dim: '#5B21B6', glow: '168,85,247',
    alt: '#F5C842', grad: 'linear-gradient(135deg,#0d0020,#1a0035)',
  },
};

const PODIUM = [
  { rank:1, icon:'👑', label:'Champion', color:'#F5C842',  glow:'245,200,66',  h:140, ring:'linear-gradient(135deg,#C89B3C,#FFE080,#C89B3C)' },
  { rank:2, icon:'🥈', label:'Runner-up', color:'#C4B5FD', glow:'167,139,250', h:100, ring:'linear-gradient(135deg,#7C3AED,#C4B5FD,#7C3AED)' },
  { rank:3, icon:'🥉', label:'3rd Place',  color:'#F9A8D4', glow:'232,121,249', h:76,  ring:'linear-gradient(135deg,#BE185D,#F9A8D4,#BE185D)' },
];

function prizeFor(tab, rank) {
  const r = RACES[tab];
  if (rank === 1) return r.prizes[0];
  if (rank === 2) return r.prizes[1];
  if (rank === 3) return r.prizes[2];
  if (rank <= 10) return Math.floor(r.prizes[3] / r.top10Split);
  return 0;
}

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

.lb { font-family:'Outfit',sans-serif; color:#fff; position:relative; }

@keyframes lb-spin { to { transform:rotate(360deg); } }
@keyframes lb-rspin { to { transform:rotate(-360deg); } }
@keyframes lb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes lb-shimmer {
  0% { transform:translateX(-100%) skewX(-15deg); }
  100% { transform:translateX(300%) skewX(-15deg); }
}
@keyframes lb-bar { from{width:0} }
@keyframes lb-breathe {
  0%,100%{opacity:.06;transform:scale(1)}
  50%{opacity:.14;transform:scale(1.1)}
}
@keyframes lb-pulse-ring {
  0%{box-shadow:0 0 0 0 rgba(245,200,66,.5)}
  70%{box-shadow:0 0 0 14px rgba(245,200,66,0)}
  100%{box-shadow:0 0 0 0 rgba(245,200,66,0)}
}

.lb-float { animation: lb-float 3.4s ease-in-out infinite; }
.lb-fill  { animation: lb-bar 1.2s cubic-bezier(.22,1,.36,1) both; }
.lb-bg    { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; animation:lb-breathe var(--dur,10s) ease-in-out infinite var(--dl,0s); }

::-webkit-scrollbar { width:3px; }
::-webkit-scrollbar-thumb { background:#2D1B5A; border-radius:4px; }

.lb-tab {
  font-family:'Outfit',sans-serif; font-size:12px; font-weight:700;
  padding:8px 20px; border-radius:50px; border:none; cursor:pointer;
  letter-spacing:.04em; transition:all .2s; display:flex; align-items:center; gap:6px;
}
.lb-row {
  position:relative; overflow:hidden; border-radius:16px;
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06);
  padding:12px 16px; display:flex; align-items:center; gap:12;
  transition:background .2s, border-color .2s;
  cursor:default;
}
.lb-row:hover {
  background:rgba(255,255,255,.055);
  border-color:rgba(255,255,255,.12);
}
`;

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Avatar({ user, size = 42, rank }) {
  const hasImg = user?.avatar_url && user.avatar_url !== 'null';
  const sp = PODIUM.find(p => p.rank === rank);
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      {sp && (
        <div style={{
          position:'absolute', inset:-2, borderRadius:'50%',
          background: sp.ring,
          animation: `lb-spin ${rank === 1 ? 5 : rank === 2 ? 8 : 11}s linear infinite`,
          opacity:.7,
        }} />
      )}
      <div style={{
        position:'absolute', inset: sp ? 2 : 0, borderRadius:'50%',
        background: sp
          ? `linear-gradient(135deg,rgba(${sp.glow},.25),rgba(0,0,0,.6))`
          : 'linear-gradient(135deg,#1e0535,#3b0764)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size * 0.36, fontWeight:800, color:'#fff',
        overflow:'hidden',
        boxShadow: rank === 1 ? '0 0 0 0 rgba(245,200,66,.5)' : 'none',
        animation: rank === 1 ? 'lb-pulse-ring 2.4s ease-out infinite' : 'none',
      }}>
        {hasImg
          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : initial}
      </div>
    </div>
  );
}

/* ─── STATS BAR ──────────────────────────────────────────────── */
function StatsBar({ entries, tab }) {
  const r = RACES[tab];
  const totalWager = entries.reduce((s, u) => s + (u.total_wagered || 0), 0);
  const top = entries[0];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10,
    }}>
      {[
        { icon: <Users size={14}/>, label:'Players on Board', val: entries.length },
        { icon: <TrendingUp size={14}/>, label:'Top Wagered', val: `${(top?.total_wagered||0).toLocaleString()}` },
        { icon: <Trophy size={14}/>, label:'Total Prize Pool', val: r.pool.toLocaleString() },
      ].map((s,i) => (
        <motion.div key={s.label}
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
          style={{
            padding:'14px 16px', borderRadius:16,
            background:`linear-gradient(145deg,rgba(${r.glow},.06),rgba(0,0,0,.3))`,
            border:`1px solid rgba(${r.glow},.14)`,
            display:'flex', flexDirection:'column', gap:6,
          }}>
          <div style={{ color:`rgba(${r.glow},.6)`, display:'flex', alignItems:'center', gap:5 }}>
            {s.icon}
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.25)' }}>{s.label}</span>
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color: r.color, lineHeight:1 }}>
            {s.val}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── PODIUM ─────────────────────────────────────────────────── */
function Podium({ users, tab }) {
  const r = RACES[tab];
  // Display order: 2nd, 1st, 3rd
  const order = [PODIUM[1], PODIUM[0], PODIUM[2]];

  return (
    <div style={{
      position:'relative', borderRadius:24, overflow:'hidden',
      background:'linear-gradient(160deg,#0a0518 0%,#110820 55%,#070212 100%)',
      border:'1px solid rgba(255,255,255,.08)',
      boxShadow:`0 0 80px rgba(${r.glow},.06), inset 0 1px 0 rgba(255,255,255,.05)`,
      padding:'32px 20px 0',
    }}>
      {/* ambient glow */}
      <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:500, height:260, borderRadius:'50%', background:`radial-gradient(ellipse,rgba(${r.glow},.1) 0%,transparent 65%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(${r.glow},.4),rgba(168,85,247,.3),transparent)` }} />

      {/* heading */}
      <div style={{ textAlign:'center', position:'relative', zIndex:2, marginBottom:30 }}>
        <div className="lb-float" style={{ fontSize:28, marginBottom:6, display:'block' }}>🏆</div>
        <h2 style={{ fontFamily:"'Outfit',sans-serif", fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'.04em', textTransform:'uppercase' }}>Top Champions</h2>
        <p style={{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:4, letterSpacing:'.1em', textTransform:'uppercase' }}>Ranked by total wager</p>
      </div>

      {/* podium columns */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:6, position:'relative', zIndex:2 }}>
        {order.map((sp) => {
          const u = users[sp.rank - 1];
          const prize = prizeFor(tab, sp.rank);
          const isFirst = sp.rank === 1;
          return (
            <motion.div
              key={sp.rank}
              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: sp.rank * 0.1, duration:.55, ease:[.22,1,.36,1] }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, maxWidth:180 }}>

              {/* rank label */}
              <div style={{ fontSize:isFirst?20:16, marginBottom:4 }}>{sp.icon}</div>

              {/* avatar */}
              {u
                ? <Avatar user={u} size={isFirst?70:54} rank={sp.rank} />
                : <div style={{ width:isFirst?70:54, height:isFirst?70:54, borderRadius:'50%', background:'rgba(255,255,255,.04)', border:'1px dashed rgba(255,255,255,.1)' }} />}

              {/* name */}
              <p style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:9, marginBottom:2, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>
                {u?.username || '—'}
              </p>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8 }}>
                {(u?.total_wagered||0).toLocaleString()} wagered
              </p>

              {/* prize chip */}
              <div style={{
                display:'flex', alignItems:'center', gap:5, marginBottom:14,
                padding:'5px 14px', borderRadius:50,
                background:`rgba(${sp.glow},.12)`, border:`1px solid rgba(${sp.glow},.28)`,
              }}>
                <span style={{ fontSize:10 }}>💰</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, color:sp.color }}>
                  {prize.toLocaleString()}
                </span>
              </div>

              {/* podium block */}
              <motion.div
                initial={{ scaleY:0 }} animate={{ scaleY:1 }}
                transition={{ delay:.4 + sp.rank*.08, duration:.5, ease:[.22,1,.36,1] }}
                style={{
                  width:'100%', height: sp.h,
                  borderRadius:'10px 10px 0 0',
                  background:`linear-gradient(to top,rgba(${sp.glow},.12),rgba(${sp.glow},.28))`,
                  border:`1px solid rgba(${sp.glow},.22)`, borderBottom:'none',
                  transformOrigin:'bottom', position:'relative', overflow:'hidden',
                  boxShadow:`0 -8px 28px rgba(${sp.glow},.15)`,
                }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(255,255,255,.08),transparent 50%)' }} />
                {/* rank number big */}
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize: isFirst?42:30, fontWeight:900, color:`rgba(${sp.glow},.18)`, lineHeight:1, fontFamily:"'Outfit',sans-serif" }}>
                  {sp.rank}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,rgba(${r.glow},.4),rgba(168,85,247,.3),transparent)` }} />
    </div>
  );
}

/* ─── ROW (#4–10) ────────────────────────────────────────────── */
const RANK_COLORS = ['','','','#a78bfa','#818cf8','#6366f1','#60a5fa','#34d399','#f472b6','#fb923c','#facc15'];

function Row({ user: u, rank, tab, index, maxWager }) {
  const r = RACES[tab];
  const prize = prizeFor(tab, rank);
  const pct = Math.min(100, Math.round(((u?.total_wagered||0) / maxWager) * 100));
  const rc = RANK_COLORS[rank] || r.color;

  return (
    <motion.div
      className="lb-row"
      initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.05, duration:.35, ease:[.22,1,.36,1] }}>

      {/* shimmer on hover — pure CSS handled by .lb-row:hover */}

      {/* rank */}
      <div style={{
        width:32, height:32, borderRadius:10, flexShrink:0,
        background:`rgba(${r.glow},.08)`, border:`1px solid rgba(${r.glow},.16)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:600, color: rc,
      }}>{rank}</div>

      <Avatar user={u} size={36} rank={rank} />

      {/* name + bar */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {u?.username || 'Player'}
          </p>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.2)', fontFamily:"'DM Mono',monospace", flexShrink:0, background:'rgba(255,255,255,.05)', padding:'1px 7px', borderRadius:50 }}>
            lv.{u?.level||1}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:3, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
            <div className="lb-fill" style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,rgba(${r.glow},.4),${r.color})` }} />
          </div>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,.28)', flexShrink:0 }}>
            {(u?.total_wagered||0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* prize */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{
          fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:600,
          padding:'4px 12px', borderRadius:50,
          color: r.color,
          background:`rgba(${r.glow},.1)`,
          border:`1px solid rgba(${r.glow},.2)`,
        }}>
          +{prize.toLocaleString()}
        </div>
        <p style={{ fontSize:8, color:'rgba(255,255,255,.18)', marginTop:2, textTransform:'uppercase', letterSpacing:'.08em' }}>coins</p>
      </div>
    </motion.div>
  );
}

/* ─── PRIZE BREAKDOWN ────────────────────────────────────────── */
function PrizeBreakdown({ tab }) {
  const r = RACES[tab];
  const tiers = [
    { label:'1st Place',  val: r.prizes[0], icon:'👑', color:'#F5C842', glow:'245,200,66' },
    { label:'2nd Place',  val: r.prizes[1], icon:'🥈', color:'#C4B5FD', glow:'167,139,250' },
    { label:'3rd Place',  val: r.prizes[2], icon:'🥉', color:'#F9A8D4', glow:'232,121,249' },
    { label:'4th – 10th', val: `${Math.floor(r.prizes[3]/r.top10Split).toLocaleString()} ea`, icon:'🏅', color:'#818CF8', glow:'129,140,248' },
  ];
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
      style={{
        borderRadius:20,
        background:'linear-gradient(145deg,#0d0619,#130824,#090313)',
        border:`1px solid rgba(${r.glow},.16)`,
        padding:'20px 20px 18px',
        boxShadow:`0 0 50px rgba(${r.glow},.05)`,
        position:'relative', overflow:'hidden',
      }}>
      {/* shimmer */}
      <div style={{ position:'absolute', top:0, left:'-25%', width:'28%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,.018),transparent)', animation:'lb-shimmer 5s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
        <div>
          <p style={{ fontSize:9, letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', fontWeight:600, marginBottom:5 }}>
            {r.cycle} · Prize Pool
          </p>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'.02em' }}>{r.label}</h2>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:700, color:r.color, lineHeight:1, filter:`drop-shadow(0 0 10px rgba(${r.glow},.4))` }}>
            {r.pool.toLocaleString()}
          </div>
          <div style={{ fontSize:9, letterSpacing:'.1em', color:'rgba(255,255,255,.25)', marginTop:2, textTransform:'uppercase' }}>Total Coins</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {tiers.map((t, i) => (
          <motion.div key={t.label}
            initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:.1 + i*.06 }}
            style={{
              padding:'14px 8px', borderRadius:14, textAlign:'center',
              background:`rgba(${t.glow},.07)`, border:`1px solid rgba(${t.glow},.18)`,
            }}>
            <div style={{ fontSize:18, marginBottom:6 }}>{t.icon}</div>
            <div style={{ fontSize:8, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.28)', marginBottom:6, fontWeight:600 }}>{t.label}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize: typeof t.val === 'string' ? 10 : 13, fontWeight:600, color:t.color }}>
              {typeof t.val === 'number' ? t.val.toLocaleString() : t.val}
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ position:'absolute', bottom:0, left:'15%', right:'15%', height:1, background:`linear-gradient(90deg,transparent,rgba(${r.glow},.5),transparent)` }} />
    </motion.div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function Leaderboard() {
  useRequireAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('monthly');
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

  if (loading) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:18 }}>
      <style>{CSS}</style>
      <div style={{ position:'relative', width:56, height:56 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            position:'absolute', inset: i*10, borderRadius:'50%',
            border:`1.5px solid rgba(${['245,200,66','168,85,247','232,121,249'][i]},.45)`,
            animation:`${i%2?'lb-rspin':'lb-spin'} ${3+i*1.5}s linear infinite`,
          }} />
        ))}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#F5C842', boxShadow:'0 0 12px #F5C842' }} />
        </div>
      </div>
      <p style={{ fontSize:11, color:'rgba(255,255,255,.25)', letterSpacing:'.16em', textTransform:'uppercase' }}>Loading race…</p>
    </div>
  );

  if (error) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:14 }}>
      <style>{CSS}</style>
      <p style={{ fontSize:14, color:'rgba(248,113,113,.7)' }}>{error}</p>
      <button onClick={load} style={{ fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:700, padding:'9px 22px', borderRadius:50, cursor:'pointer', background:'rgba(168,85,247,.14)', color:'#a855f7', border:'1px solid rgba(168,85,247,.3)' }}>Try Again</button>
    </div>
  );

  if (!entries.length) return (
    <div className="lb" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:12 }}>
      <style>{CSS}</style>
      <div style={{ fontSize:48, opacity:.15 }}>🏆</div>
      <p style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,.2)' }}>No players yet</p>
    </div>
  );

  return (
    <div className="lb">
      <style>{CSS}</style>

      {/* ambient blobs */}
      <div className="lb-bg" style={{ width:480, height:340, top:'-5%',  left:'10%',  background:'#7C3AED', '--dur':'10s', '--dl':'0s'  }} />
      <div className="lb-bg" style={{ width:360, height:260, top:'40%',  right:'-5%', background:'#C89B3C', '--dur':'13s', '--dl':'-4s' }} />
      <div className="lb-bg" style={{ width:300, height:300, bottom:'5%',left:'-5%',  background:'#4C1D95', '--dur':'15s', '--dl':'-8s' }} />

      <div style={{ maxWidth:720, margin:'0 auto', padding:'24px 16px 100px', display:'flex', flexDirection:'column', gap:18, position:'relative', zIndex:1 }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,rgba(245,200,66,.15),rgba(168,85,247,.15))', border:'1px solid rgba(245,200,66,.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                🏆
              </div>
              <div>
                <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-.01em', lineHeight:1 }}>Leaderboard</h1>
                <p style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:3, letterSpacing:'.02em' }}>Wager more · Rank higher · Win bigger</p>
              </div>
            </div>
            <button onClick={load} style={{
              width:36, height:36, borderRadius:11, border:'1px solid rgba(255,255,255,.1)',
              background:'rgba(255,255,255,.05)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'rgba(255,255,255,.35)', transition:'all .2s',
            }}>
              <RefreshCw size={14} style={{ animation: spinning ? 'lb-spin .8s linear infinite' : 'none' }} />
            </button>
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.06 }}
          style={{ display:'inline-flex', gap:4, padding:4, borderRadius:50, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', alignSelf:'flex-start' }}>
          {Object.entries(RACES).map(([key, rc]) => {
            const active = tab === key;
            return (
              <button key={key} className="lb-tab" onClick={() => setTab(key)} style={{
                background: active ? `rgba(${rc.glow},.16)` : 'transparent',
                border: `1px solid ${active ? `rgba(${rc.glow},.35)` : 'transparent'}`,
                color: active ? rc.color : 'rgba(255,255,255,.3)',
                boxShadow: active ? `0 0 20px rgba(${rc.glow},.18)` : 'none',
              }}>
                <span>{rc.icon}</span>
                {rc.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:.25, ease:[.22,1,.36,1] }}
            style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <PrizeBreakdown tab={tab} />
            <StatsBar entries={entries} tab={tab} />
            <Podium users={entries} tab={tab} />

            {/* 4–10 list */}
            {entries.length > 3 && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0 10px' }}>
                  <Medal size={13} style={{ color: r.color, opacity:.7 }} />
                  <span style={{ fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.28)', fontWeight:700 }}>
                    4th to 10th Place
                  </span>
                  <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(255,255,255,.06),transparent)' }} />
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'rgba(255,255,255,.2)' }}>
                    +{Math.floor(r.prizes[3]/r.top10Split).toLocaleString()} coins each
                  </span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {entries.slice(3, 10).map((u, i) => (
                    <Row key={u.user_email || i} user={u} rank={i+4} tab={tab} index={i} maxWager={maxWager} />
                  ))}
                </div>
              </div>
            )}

            {/* footer note */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }}
              style={{ padding:'12px 16px', borderRadius:14, background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:13, opacity:.2 }}>ℹ</span>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.2)', lineHeight:1.65 }}>
                {tab === 'monthly'
                  ? 'Monthly race tracks total wagers. The 500,000 coin pool is split among the top 10 at the end of each calendar month.'
                  : 'Weekly race resets every Sunday. The 45,000 coin pool is distributed to the top 10 at midnight UTC.'}
              </p>
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}