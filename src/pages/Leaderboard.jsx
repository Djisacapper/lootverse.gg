import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Flame, Gift, AlertCircle, RefreshCw, Trophy } from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.lb-root { font-family: 'Nunito', sans-serif; }

@keyframes lb-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.lb-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:lb-scan 7s linear infinite; pointer-events:none;
}

@keyframes lb-hex-pulse {
  0%,100% { opacity:.025; }
  50%     { opacity:.055; }
}
.lb-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,220,0,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,220,0,.04) 1px, transparent 1px);
  background-size:32px 32px;
  animation:lb-hex-pulse 5s ease-in-out infinite;
}

@keyframes lb-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.lb-shim { position:relative; overflow:hidden; }
.lb-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:lb-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes lb-p-rise {
  0%   { transform:translateY(0) translateX(0); opacity:0; }
  8%   { opacity:1; }
  90%  { opacity:.5; }
  100% { transform:translateY(-90px) translateX(var(--dx)); opacity:0; }
}
.lb-pt {
  position:absolute; border-radius:50%; pointer-events:none;
  animation:lb-p-rise var(--d) ease-out infinite var(--dl);
}

@keyframes lb-crown-float {
  0%,100% { transform:translateY(0px) rotate(-4deg); }
  50%     { transform:translateY(-8px) rotate(4deg); }
}
.lb-crown { animation:lb-crown-float 4s ease-in-out infinite; }

@keyframes lb-rank1-glow {
  0%,100% { box-shadow:0 0 0 3px rgba(251,191,36,.25), 0 0 40px rgba(251,191,36,.3), 0 0 80px rgba(251,191,36,.1); }
  50%     { box-shadow:0 0 0 3px rgba(251,191,36,.5),  0 0 60px rgba(251,191,36,.5), 0 0 120px rgba(251,191,36,.2); }
}
.lb-rank1-glow { animation:lb-rank1-glow 2.5s ease-in-out infinite; }

@keyframes lb-podium-rise {
  0%   { transform:scaleY(0); opacity:0; }
  100% { transform:scaleY(1); opacity:1; }
}

@keyframes lb-number-glow {
  0%,100% { text-shadow:0 0 10px currentColor; }
  50%     { text-shadow:0 0 25px currentColor, 0 0 50px currentColor; }
}
.lb-rank-glow { animation:lb-number-glow 2s ease-in-out infinite; }

.lb-tab-btn {
  padding:9px 22px; border-radius:10px; border:none; cursor:pointer;
  font-family:'Nunito',sans-serif; font-size:13px; font-weight:800;
  transition:all .2s; display:flex; align-items:center; gap:6px;
}

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1e1a00; border-radius:4px; }
`;

/* ─── Particles ─────────────────────────────────────────────────── */
function Particles({ accent = '#fbbf24', count = 12 }) {
  const pts = React.useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${8 + Math.random() * 84}%`,
      bottom: `${Math.random() * 22}%`,
      size: 1.5 + Math.random() * 2.5,
      d: `${3 + Math.random() * 5}s`,
      dl: `${-Math.random() * 6}s`,
      dx: `${(Math.random() - .5) * 40}px`,
    }))
  ).current;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pts.map(p => (
        <div key={p.id} className="lb-pt" style={{
          left:p.left, bottom:p.bottom, width:p.size, height:p.size,
          background:accent, boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--d':p.d, '--dl':p.dl, '--dx':p.dx,
        }} />
      ))}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ user, size = 40, rank }) {
  const hasImg = user?.avatar_url && user.avatar_url !== 'null';
  const ringColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#f97316' : 'rgba(168,85,247,.4)';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: rank === 1
        ? 'linear-gradient(135deg,#fef3c7,#fbbf24 50%,#92400e)'
        : rank === 2
          ? 'linear-gradient(135deg,#e2e8f0,#64748b 50%,#1e293b)'
          : rank === 3
            ? 'linear-gradient(135deg,#fed7aa,#f97316 50%,#7c2d12)'
            : 'linear-gradient(135deg,#7c3aed,#4338ca)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#fff',
      boxShadow: `0 0 0 3px ${ringColor}, 0 0 20px ${ringColor}55`,
      ...(rank === 1 ? { animation: 'lb-rank1-glow 2.5s ease-in-out infinite' } : {}),
    }}>
      {hasImg
        ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : (user?.username?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

/* ─── Podium ─────────────────────────────────────────────────────── */
const PODIUM_CONFIG = {
  0: { height: 130, width: 88,  zIndex: 3, color: 'linear-gradient(to top,#92400e,#f59e0b,#fde68a)', labelColor:'#fbbf24', medal:'👑', label:'1st', offset: 0    },
  1: { height: 100, width: 76,  zIndex: 2, color: 'linear-gradient(to top,#1e293b,#475569,#cbd5e1)', labelColor:'#94a3b8', medal:'🥈', label:'2nd', offset: 20   },
  2: { height: 80,  width: 68,  zIndex: 1, color: 'linear-gradient(to top,#7c2d12,#ea580c,#fed7aa)', labelColor:'#f97316', medal:'🥉', label:'3rd', offset: 34   },
};

function Podium({ users, tab }) {
  // Display order: 2nd (left), 1st (center), 3rd (right)
  const order = [1, 0, 2];

  return (
    <div style={{
      position:'relative', overflow:'hidden', borderRadius:20,
      background:'linear-gradient(145deg,#060010 0%,#0e001e 60%,#040009 100%)',
      border:'1px solid rgba(251,191,36,.12)',
      boxShadow:'0 0 0 1px rgba(251,191,36,.06), 0 32px 80px rgba(0,0,0,.85)',
      padding:'40px 20px 0', marginBottom:4,
    }}>
      <div className="lb-scan" />
      <div className="lb-hex" />
      <Particles accent="#fbbf24" count={10} />
      <Particles accent="#a855f7" count={8} />

      {/* Header */}
      <div style={{ textAlign:'center', position:'relative', zIndex:2, marginBottom:32 }}>
        <div className="lb-crown" style={{ display:'inline-block', marginBottom:8 }}>
          <Crown style={{ width:32, height:32, color:'#fbbf24', filter:'drop-shadow(0 0 12px rgba(251,191,36,.8))' }} />
        </div>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0, letterSpacing:'-.01em' }}>
          {tab === 'weekly' ? 'Weekly Champions' : 'All-Time Champions'}
        </h2>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:4, fontWeight:600 }}>
          {tab === 'weekly' ? 'Top players this week' : 'Most wagered all time'}
        </p>
      </div>

      {/* Podium columns */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:8, position:'relative', zIndex:2 }}>
        {order.map((rank) => {
          const u = users[rank];
          const cfg = PODIUM_CONFIG[rank];
          if (!u) return <div key={rank} style={{ width:cfg.width }} />;

          return (
            <motion.div
              key={rank}
              initial={{ opacity:0, y:30 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: rank * .12, duration:.6, ease:[.22,1,.36,1] }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', width:cfg.width + 24 }}>

              {/* Medal */}
              <div style={{ fontSize:24, marginBottom:8 }}>{cfg.medal}</div>

              {/* Avatar */}
              <Avatar user={u} size={rank === 0 ? 68 : 54} rank={rank + 1} />

              {/* Name */}
              <p style={{
                fontSize:12, fontWeight:900, color:'#fff', marginTop:8, marginBottom:2,
                maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center',
              }}>{u.username || 'Player'}</p>

              {/* Wager */}
              <p style={{ fontSize:11, fontWeight:800, color:cfg.labelColor, marginBottom:4 }}>
                ${(u.total_wagered || 0).toLocaleString()}
              </p>
              <p style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginBottom:12, letterSpacing:'.1em', textTransform:'uppercase' }}>
                {tab === 'weekly' ? 'this week' : 'wagered'}
              </p>

              {/* Podium block */}
              <motion.div
                initial={{ scaleY:0 }} animate={{ scaleY:1 }}
                transition={{ delay:.3 + rank * .1, duration:.5, ease:[.22,1,.36,1] }}
                style={{
                  width:'100%', height:cfg.height, borderRadius:'12px 12px 0 0',
                  background:cfg.color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 -4px 24px ${cfg.labelColor}40, inset 0 1px 0 rgba(255,255,255,.15)`,
                  transformOrigin:'bottom',
                  position:'relative', overflow:'hidden',
                }}>
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(to bottom,rgba(255,255,255,.08) 0%,transparent 50%,rgba(0,0,0,.2) 100%)',
                }} />
                <span className="lb-rank-glow" style={{
                  fontSize:26, fontWeight:900, color:'rgba(255,255,255,.9)',
                  position:'relative', zIndex:1,
                  color: cfg.labelColor,
                }}>{cfg.label}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom fade */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:2,
        background:'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.5),transparent)',
      }} />
    </div>
  );
}

/* ─── List Row ───────────────────────────────────────────────────── */
function ListRow({ user: u, rank, tab, index }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, x:-16 }}
      animate={{ opacity:1, x:0 }}
      transition={{ delay: index * .055, duration:.4, ease:[.22,1,.36,1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="lb-shim"
      style={{
        position:'relative', overflow:'hidden', borderRadius:14,
        background:'linear-gradient(145deg,#080012,#100020,#04000a)',
        border:`1px solid ${hov ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.06)'}`,
        boxShadow: hov ? '0 0 0 1px rgba(251,191,36,.1), 0 12px 40px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.08)' : '0 4px 20px rgba(0,0,0,.6)',
        transition:'border-color .22s, box-shadow .28s',
        padding:'12px 16px',
        display:'flex', alignItems:'center', gap:14,
      }}>

      {hov && <Particles accent="#fbbf24" count={5} />}

      {/* Top accent */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:1,
        background: hov
          ? 'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.3),transparent)'
          : 'transparent',
        transition:'background .3s',
      }} />

      {/* Rank */}
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <span style={{
          fontSize:14, fontWeight:900,
          color: tab === 'weekly' ? '#f97316' : '#a855f7',
        }}>#{rank}</span>
      </div>

      {/* Avatar */}
      <Avatar user={u} size={38} rank={rank} />

      {/* Name + wager */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
          {u.username || 'Player'}
        </p>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:600 }}>
          {tab === 'weekly' ? 'This week' : 'Wagered'}: <span style={{ color:'rgba(255,255,255,.55)' }}>${(u.total_wagered || 0).toLocaleString()}</span>
        </p>
      </div>

      {/* Level badge */}
      <div style={{
        display:'flex', alignItems:'center', gap:5, flexShrink:0,
        padding:'6px 12px', borderRadius:10,
        background: tab === 'weekly' ? 'rgba(249,115,22,.1)' : 'rgba(168,85,247,.1)',
        border: tab === 'weekly' ? '1px solid rgba(249,115,22,.25)' : '1px solid rgba(168,85,247,.25)',
      }}>
        {tab === 'weekly'
          ? <Flame style={{ width:13, height:13, color:'#f97316' }} />
          : <Zap   style={{ width:13, height:13, color:'#a855f7' }} />}
        <span style={{
          fontSize:12, fontWeight:800,
          color: tab === 'weekly' ? '#f97316' : '#a855f7',
        }}>Lv {u.level || 1}</span>
      </div>
    </motion.div>
  );
}

/* ─── Weekly Reward Banner ───────────────────────────────────────── */
function WeeklyBanner() {
  return (
    <motion.div
      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.4 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:14,
        background:'linear-gradient(135deg,rgba(251,191,36,.08),rgba(249,115,22,.08))',
        border:'1px solid rgba(251,191,36,.2)',
        boxShadow:'0 0 30px rgba(251,191,36,.08)',
        padding:'14px 18px',
        display:'flex', alignItems:'center', gap:14,
      }}>
      <div className="lb-scan" />
      <div style={{
        width:40, height:40, borderRadius:12, flexShrink:0,
        background:'rgba(251,191,36,.12)', border:'1px solid rgba(251,191,36,.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 20px rgba(251,191,36,.2)',
      }}>
        <Gift style={{ width:18, height:18, color:'#fbbf24' }} />
      </div>
      <div>
        <p style={{ fontSize:13, fontWeight:900, color:'#fbbf24', marginBottom:2 }}>Weekly Rewards Active</p>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:600 }}>Top 3 earn bonus coins every Sunday · Keep climbing!</p>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Leaderboard() {
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('all-time');

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

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', gap:16, fontFamily:'Nunito,sans-serif',
    }}>
      <div style={{ position:'relative', width:52, height:52 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #fbbf24', animation:'spin 1s linear infinite' }} />
        <div style={{ position:'absolute', inset:7, borderRadius:'50%', border:'2px solid #a855f7', animation:'spin .72s linear infinite reverse' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 16px #fbbf24' }} />
        </div>
      </div>
      <p style={{ fontSize:13, color:'rgba(255,255,255,.3)', fontWeight:700 }}>Loading leaderboard…</p>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', gap:16, fontFamily:'Nunito,sans-serif',
    }}>
      <AlertCircle style={{ width:40, height:40, color:'rgba(248,113,113,.7)' }} />
      <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', fontWeight:700 }}>{error}</p>
      <motion.button
        whileHover={{ scale:1.05 }} whileTap={{ scale:.96 }}
        onClick={loadData}
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'10px 20px', borderRadius:10, border:'1px solid rgba(168,85,247,.3)',
          background:'rgba(168,85,247,.1)', color:'#c084fc',
          fontSize:13, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer',
        }}>
        <RefreshCw style={{ width:14, height:14 }} /> Try Again
      </motion.button>
    </div>
  );

  /* ── Empty ── */
  if (top10.length === 0) return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', gap:12, fontFamily:'Nunito,sans-serif',
    }}>
      <Trophy style={{ width:48, height:48, color:'rgba(251,191,36,.2)' }} />
      <p style={{ fontSize:16, fontWeight:800, color:'rgba(255,255,255,.35)' }}>No players yet</p>
      <p style={{ fontSize:12, color:'rgba(255,255,255,.2)', fontWeight:600 }}>Check back soon!</p>
    </div>
  );

  return (
    <div className="lb-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:680, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Page Title ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:3, height:26, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Trophy style={{ width:20, height:20, color:'#fbbf24' }} />
            <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:0 }}>Leaderboard</h1>
          </div>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.3)', marginLeft:13, fontWeight:600 }}>
            Compete, climb, and earn exclusive rewards
          </p>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.1 }}
          style={{
            display:'inline-flex', gap:4, padding:4, borderRadius:14,
            background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
            alignSelf:'flex-start',
          }}>
          {[
            { val:'all-time', label:'All-Time', icon:Crown,  activeColor:'#fbbf24', activeBg:'rgba(251,191,36,.12)', activeBorder:'rgba(251,191,36,.3)' },
            { val:'weekly',   label:'Weekly',   icon:Flame,  activeColor:'#f97316', activeBg:'rgba(249,115,22,.12)',  activeBorder:'rgba(249,115,22,.3)'  },
          ].map(({ val, label, icon:Icon, activeColor, activeBg, activeBorder }) => {
            const active = tab === val;
            return (
              <button
                key={val}
                className="lb-tab-btn"
                onClick={() => setTab(val)}
                style={{
                  background: active ? activeBg : 'transparent',
                  border: active ? `1px solid ${activeBorder}` : '1px solid transparent',
                  color: active ? activeColor : 'rgba(255,255,255,.35)',
                  boxShadow: active ? `0 0 20px ${activeColor}25` : 'none',
                }}>
                <Icon style={{ width:14, height:14 }} />
                {label}
              </button>
            );
          })}
        </motion.div>

        {/* ── Podium ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:.35, ease:[.22,1,.36,1] }}>

            <Podium users={top10} tab={tab} />

            {/* Weekly banner */}
            {tab === 'weekly' && (
              <div style={{ marginTop:12 }}>
                <WeeklyBanner />
              </div>
            )}

            {/* ── #4–10 list ── */}
            {top10.length > 3 && (
              <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
                  {tab === 'weekly'
                    ? <Flame style={{ width:14, height:14, color:'#f97316' }} />
                    : <Zap   style={{ width:14, height:14, color:'#a855f7' }} />}
                  <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>
                    {tab === 'weekly' ? 'This Week' : 'Top 10'}
                  </span>
                </div>

                {top10.slice(3).map((u, i) => (
                  <ListRow
                    key={u.user_email || i}
                    user={u}
                    rank={i + 4}
                    tab={tab}
                    index={i}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}