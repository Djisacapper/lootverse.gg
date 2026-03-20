import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { rollItem } from '../components/game/useWallet';
import CaseSpinner from '../components/game/CaseSpinner';
import { normalizeItems } from '../components/game/normalizeItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, ArrowLeft, RefreshCw, Sparkles, Percent, Eye, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Syne:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

:root {
  --bg:           #09000f;
  --surface:      #110018;
  --surface2:     #1a0028;
  --border:       rgba(139,92,246,.13);
  --border-gold:  rgba(251,191,36,.25);
  --gold:         #fbbf24;
  --gold-dim:     rgba(251,191,36,.55);
  --gold-soft:    rgba(251,191,36,.1);
  --purple:       #a855f7;
  --purple-mid:   #c084fc;
  --purple-soft:  rgba(168,85,247,.1);
  --text:         #f0e6ff;
  --text-dim:     rgba(240,230,255,.5);
  --text-faint:   rgba(240,230,255,.22);
}

*, *::before, *::after { box-sizing: border-box; }

.co {
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

@keyframes spin-loader { to { transform: rotate(360deg); } }

@keyframes shimmer-gold {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.shimmer-text {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a, #fbbf24);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer-gold 3s linear infinite;
}

@keyframes float-case {
  0%,100% { transform: translateY(0) rotate(-1.5deg); }
  50%     { transform: translateY(-8px) rotate(1.5deg); }
}
.float-case { animation: float-case 4s ease-in-out infinite; }

@keyframes pulse-ring {
  0%   { transform: scale(1); opacity: .5; }
  100% { transform: scale(1.75); opacity: 0; }
}
.pulse-ring {
  position: absolute; inset: 0;
  border-radius: inherit;
  border: 2px solid currentColor;
  animation: pulse-ring 1.8s ease-out infinite;
  pointer-events: none;
}

@keyframes particle-burst {
  0%   { transform: translate(-50%,-50%) translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
}

/* spinner lane scan */
@keyframes scan {
  0%  { top: -1px; opacity: 0; } 5% { opacity: 1; } 95% { opacity: 1; }
  100%{ top: 100%; opacity: 0; }
}
.lane-scan {
  position: absolute; left: 0; right: 0; height: 1px; z-index: 2; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(251,191,36,.18), transparent);
  animation: scan 4s linear infinite;
}

/* Card hover */
.item-card {
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), border-color .18s, box-shadow .18s;
}
.item-card:hover { transform: translateY(-3px) scale(1.02); }

/* Action buttons */
.action-btn {
  position: relative; overflow: hidden;
  transition: transform .18s ease, opacity .18s, box-shadow .18s;
}
.action-btn:hover:not(:disabled) { transform: translateY(-1px); }
.action-btn:active:not(:disabled) { transform: scale(.97); }
.action-btn::after {
  content: ''; position: absolute; top: 0; left: -60%; width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  transform: skewX(-15deg); transition: left .5s;
}
.action-btn:hover:not(:disabled)::after { left: 120%; }

.qty-pill {
  transition: all .15s cubic-bezier(.34,1.56,.64,1);
}
.qty-pill:hover:not(:disabled) { transform: scale(1.08); }
.qty-pill:active:not(:disabled) { transform: scale(.93); }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(168,85,247,.15); border-radius: 4px; }
`;

const RARITY = {
  common:    { color:'#9ca3af', glow:'rgba(156,163,175,.3)',  bg:'linear-gradient(135deg,#1f2937,#374151)', label:'Common'    },
  uncommon:  { color:'#34d399', glow:'rgba(52,211,153,.35)',  bg:'linear-gradient(135deg,#064e3b,#065f46)', label:'Uncommon'  },
  rare:      { color:'#60a5fa', glow:'rgba(96,165,250,.4)',   bg:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', label:'Rare'      },
  epic:      { color:'#c084fc', glow:'rgba(192,132,252,.45)', bg:'linear-gradient(135deg,#3b0764,#7c3aed)', label:'Epic'      },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.55)',  bg:'linear-gradient(135deg,#78350f,#f59e0b)', label:'Legendary' },
};
const rs = r => RARITY[r?.toLowerCase()] || RARITY.common;

function Particles({ color, count = 14 }) {
  const pts = Array.from({ length: count }, (_, i) => ({
    id:i, angle:(360/count)*i,
    dist:55+Math.random()*55, size:3+Math.random()*4,
    delay:Math.random()*.35, dur:.7+Math.random()*.6,
  }));
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible', zIndex:10 }}>
      {pts.map(p => {
        const rad = (p.angle*Math.PI)/180;
        return (
          <div key={p.id} style={{
            position:'absolute', left:'50%', top:'50%',
            width:p.size, height:p.size, borderRadius:'50%',
            background:color, boxShadow:`0 0 ${p.size*2}px ${color}`,
            animation:`particle-burst ${p.dur}s ease-out ${p.delay}s both`,
            '--tx':`${Math.cos(rad)*p.dist}px`, '--ty':`${Math.sin(rad)*p.dist}px`,
          }} />
        );
      })}
    </div>
  );
}

const CYCLE_GLOWS = [
  'rgba(156,163,175,.4)','rgba(52,211,153,.45)','rgba(96,165,250,.5)',
  'rgba(192,132,252,.55)','rgba(251,191,36,.6)','rgba(192,132,252,.5)',
  'rgba(96,165,250,.45)','rgba(52,211,153,.4)',
];

function SpinnerLane({ items, result, spinning, onComplete, index, total, done }) {
  const itemRs = result ? rs(result.rarity) : null;
  const [cycleIdx, setCycleIdx] = React.useState(index % CYCLE_GLOWS.length);
  const [settling, setSettling] = React.useState(false);
  const [settled,  setSettled]  = React.useState(false);

  React.useEffect(() => {
    if (!spinning) return;
    setSettling(false); setSettled(false);
    const iv = setInterval(() => setCycleIdx(i => (i+1) % CYCLE_GLOWS.length), 130 + index*31);
    return () => clearInterval(iv);
  }, [spinning, index]);

  React.useEffect(() => {
    if (!done || !itemRs) return;
    setSettling(true);
    const t = setTimeout(() => setSettled(true), 400);
    return () => clearTimeout(t);
  }, [done]);

  let glowColor;
  if (settled && itemRs)         glowColor = itemRs.glow;
  else if (spinning || settling) glowColor = CYCLE_GLOWS[cycleIdx];

  const transitionDur = settled ? '0.7s' : '0.12s';

  return (
    <div style={{
      position:'relative', overflow:'hidden', flex:1,
      background:'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
      border:'1px solid var(--border)', borderTop:'none',
      borderRadius: total===1 ? '0 0 14px 14px'
        : index===0 ? '0 0 0 14px'
        : index===total-1 ? '0 0 14px 0' : '0',
      boxShadow: glowColor ? `inset 0 0 28px ${glowColor}` : 'none',
      transition: `box-shadow ${transitionDur} ease`,
    }}>
      <div className="lane-scan" />
      {total > 1 && (
        <div style={{
          position:'absolute', top:6, left:0, right:0, zIndex:5,
          display:'flex', justifyContent:'center', pointerEvents:'none',
        }}>
          <span style={{
            fontSize:8, fontWeight:500, color:'var(--text-faint)',
            fontFamily:'DM Mono, monospace', letterSpacing:'.1em',
          }}>#{index+1}</span>
        </div>
      )}
      <CaseSpinner items={items} result={result} spinning={spinning} onComplete={onComplete} />
    </div>
  );
}

function ResultCard({ item, index, isDemo, showParticles }) {
  const itemRs = rs(item.rarity);
  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:.9 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:index*0.07, type:'spring', stiffness:280, damping:24 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:12, textAlign:'center',
        background:'var(--surface)',
        border:`1px solid ${itemRs.color}35`,
        boxShadow:`0 0 24px ${itemRs.glow}, 0 4px 16px rgba(0,0,0,.5)`,
        padding:'16px 12px 14px',
      }}>
      <div className="lane-scan" />
      {showParticles && <Particles color={itemRs.color} count={16} />}

      <div style={{ position:'relative', width:60, height:60, margin:'0 auto 10px' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:12, color:itemRs.color }}>
          <div className="pulse-ring" />
        </div>
        <div style={{
          width:60, height:60, borderRadius:12, background:itemRs.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 18px ${itemRs.glow}`,
          border:`1px solid ${itemRs.color}30`,
        }}>
          {item.image||item.image_url
            ? <img src={item.image||item.image_url} alt="" style={{ width:42, height:42, objectFit:'contain' }} />
            : <Sparkles style={{ width:22, height:22, color:itemRs.color }} />
          }
        </div>
      </div>

      <div style={{
        display:'inline-flex', alignItems:'center', gap:4, marginBottom:6,
        padding:'2px 8px', borderRadius:100,
        background:itemRs.bg, border:`1px solid ${itemRs.color}35`,
      }}>
        <div style={{ width:4, height:4, borderRadius:'50%', background:itemRs.color }} />
        <span style={{
          fontSize:8, fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase',
          color:itemRs.color, fontFamily:'DM Mono, monospace',
        }}>{itemRs.label}</span>
      </div>

      <p style={{
        margin:'0 0 3px', fontSize:11, fontWeight:600, color:'var(--text)',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>{item.name}</p>

      {!isDemo && (
        <p style={{
          margin:0, fontSize:13, fontWeight:500, color:'var(--gold)',
          fontFamily:'DM Mono, monospace',
        }}>${item.value?.toLocaleString()}</p>
      )}
    </motion.div>
  );
}

export default function CaseOpen() {
  const params = new URLSearchParams(window.location.search);
  useRequireAuth();
  const caseId = params.get('id');

  const [caseData,       setCaseData]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [user,           setUser]           = useState(null);
  const [userLoading,    setUserLoading]    = useState(true);

  const [openQty,        setOpenQty]        = useState(1);
  const [spinning,       setSpinning]       = useState(false);
  const [wonItems,       setWonItems]       = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [showResults,    setShowResults]    = useState(false);
  const [isDemo,         setIsDemo]         = useState(false);
  const [showParticles,  setShowParticles]  = useState(false);
  const [hovItem,        setHovItem]        = useState(null);
  const [activeTab,      setActiveTab]      = useState('contents');

  useEffect(() => {
    base44.auth.me().then(me => { setUser(me); setUserLoading(false); }).catch(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    base44.entities.CaseTemplate.list().then(all => {
      const found = all.find(c => c.id === caseId);
      if (found) found.items = normalizeItems(found.items);
      setCaseData(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [caseId]);

  const startSpin = (items, demo) => {
    setWonItems(items); setCompletedCount(0);
    setShowResults(false); setShowParticles(false);
    setIsDemo(demo); setSpinning(true);
  };

  const handleLaneDone = useCallback(() => {
    setCompletedCount(c => c+1);
  }, []);

  useEffect(() => {
    if (!spinning || completedCount === 0 || completedCount < openQty) return;
    setSpinning(false); setShowResults(true); setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1800);

    if (!isDemo && wonItems.length > 0 && user && caseData) {
      const totalWon = wonItems.reduce((s,r) => s+(r.value||0), 0);
      const newBal   = (user.balance||0) + totalWon;
      const xpGain   = Math.floor(caseData.price * openQty / 10);
      const newXp    = (user.xp||0) + xpGain;
      const newLevel = Math.floor(newXp/500)+1;
      base44.auth.updateMe({ balance:newBal, xp:newXp, level:newLevel });
      setUser(u => ({ ...u, balance:newBal }));
      wonItems.forEach(wonItem => {
        base44.entities.Transaction.create({
          user_email:user.email, type:'case_win',
          amount:wonItem.value - caseData.price,
          balance_after:newBal,
          description:`Won ${wonItem.name} from ${caseData.name}`,
        });
        base44.entities.UserInventory.create({
          user_email:user.email, item_name:wonItem.name,
          item_image_url:wonItem.image||wonItem.image_url||null,
          rarity:wonItem.rarity, value:wonItem.value,
          source:'case_opening', source_case:caseData.name, status:'owned',
        });
      });
      base44.entities.CaseTemplate.update(caseData.id, { total_opened:(caseData.total_opened||0)+openQty });
    }
  }, [completedCount, openQty, spinning]);

  const handleOpen = async () => {
    if (!caseData || spinning || !user) return;
    const cost = caseData.price * openQty;
    if ((user.balance||0) < cost) return;
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    const newBal = (user.balance||0) - cost;
    await base44.auth.updateMe({ balance:newBal });
    setUser(u => ({ ...u, balance:newBal }));
    const me = await base44.auth.me();
    await base44.auth.updateMe({
      rakeback_instant: Math.floor((me.rakeback_instant||0) + cost*0.005),
      rakeback_daily:   Math.floor((me.rakeback_daily||0)   + cost*0.003),
      rakeback_weekly:  Math.floor((me.rakeback_weekly||0)  + cost*0.002),
      rakeback_monthly: Math.floor((me.rakeback_monthly||0) + cost*0.001),
    });
    startSpin(rolled, false);
  };

  const handleDemo = () => {
    if (!caseData || spinning) return;
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    startSpin(rolled, true);
  };

  const handleOpenAgain = async () => {
    setShowResults(false); setWonItems([]);
    const me = await base44.auth.me();
    setUser(me);
    const cost = (caseData?.price||0) * openQty;
    if ((me.balance||0) < cost) return;
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    const newBal = (me.balance||0) - cost;
    base44.auth.updateMe({ balance:newBal });
    setUser({ ...me, balance:newBal });
    startSpin(rolled, false);
  };

  const handleDemoAgain = () => {
    setShowResults(false); setWonItems([]);
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    startSpin(rolled, true);
  };

  /* ── Loading ── */
  if (loading || userLoading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', background:'var(--bg)',
    }}>
      <style>{CSS}</style>
      <div style={{ position:'relative', width:44, height:44 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid var(--gold)', animation:'spin-loader 1s linear infinite' }} />
        <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'2px solid var(--purple)', animation:'spin-loader .7s linear infinite reverse' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', boxShadow:'0 0 10px var(--gold)' }} />
        </div>
      </div>
    </div>
  );

  if (!caseData) return (
    <div className="co" style={{ textAlign:'center', paddingTop:80, background:'var(--bg)', minHeight:'60vh' }}>
      <style>{CSS}</style>
      <Box style={{ width:36, height:36, color:'var(--text-faint)', margin:'0 auto 12px' }} />
      <p style={{ color:'var(--text-faint)', fontWeight:600, marginBottom:16, fontSize:13 }}>Case not found</p>
      <Link to={createPageUrl('Cases')}>
        <button style={{
          display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px',
          borderRadius:8, cursor:'pointer',
          background:'var(--surface)', border:'1px solid var(--border)',
          color:'var(--text-dim)', fontWeight:600, fontFamily:'DM Sans, sans-serif', fontSize:13,
        }}><ArrowLeft style={{ width:13, height:13 }} /> Back to Cases</button>
      </Link>
    </div>
  );

  const items     = caseData.items || [];
  const totalCost = (caseData.price||0) * openQty;
  const canAfford = (user?.balance||0) >= totalCost;
  const totalWon  = wonItems.reduce((s,r) => s+(r?.value||0), 0);
  const netGain   = totalWon - (isDemo ? 0 : totalCost);

  return (
    <div className="co" style={{
      background:'var(--bg)', minHeight:'100vh',
      marginLeft:-24, marginRight:-24, paddingBottom:80,
    }}>
      <style>{CSS}</style>

      {/* ── Hero header ── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'var(--surface)',
        borderBottom:'1px solid var(--border)',
        padding:'20px 20px 0',
      }}>
        {/* subtle radial at top */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 65% 55% at 50% -5%, rgba(168,85,247,.1), transparent 70%)',
        }} />
        {/* gold-purple top line */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:2,
          background:'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--purple) 70%, transparent 100%)',
        }} />

        <div style={{ position:'relative', display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
          <Link to={createPageUrl('Cases')}>
            <motion.button
              whileHover={{ scale:1.07, x:-2 }}
              whileTap={{ scale:.94 }}
              style={{
                marginTop:2, width:32, height:32, borderRadius:7, cursor:'pointer',
                background:'var(--gold-soft)', border:'1px solid var(--border-gold)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'var(--gold-dim)',
              }}>
              <ArrowLeft style={{ width:13, height:13 }} />
            </motion.button>
          </Link>

          <div style={{ flex:1, minWidth:0 }}>
            <h1 className="shimmer-text" style={{
              margin:'0 0 4px',
              fontSize:20, fontWeight:800, lineHeight:1.2,
              fontFamily:'Syne, sans-serif', letterSpacing:'-.01em',
            }}>
              {caseData.name}
            </h1>
            {caseData.description && (
              <p style={{ margin:0, fontSize:11, color:'var(--text-faint)', fontWeight:400 }}>
                {caseData.description}
              </p>
            )}
          </div>

          {caseData.image_url && (
            <div className="float-case" style={{
              width:58, height:58, flexShrink:0,
              filter:'drop-shadow(0 0 16px rgba(251,191,36,.4)) drop-shadow(0 4px 16px rgba(0,0,0,.8))',
            }}>
              <img src={caseData.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          )}
        </div>

        {/* Price + stats strip */}
        <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:14 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'var(--gold-soft)', border:'1px solid var(--border-gold)',
            borderRadius:7, padding:'5px 11px',
          }}>
            <span style={{
              fontSize:12, fontWeight:500, color:'var(--gold)',
              fontFamily:'DM Mono, monospace',
            }}>${caseData.price?.toLocaleString()}</span>
            <span style={{ fontSize:10, color:'var(--text-faint)' }}>/ case</span>
          </div>
          <span style={{ fontSize:10, color:'var(--text-faint)', fontFamily:'DM Mono, monospace' }}>
            {caseData.total_opened
              ? `${caseData.total_opened.toLocaleString()} opened`
              : `${items.length} items`}
          </span>
        </div>
      </div>

      <div style={{ padding:'0 20px' }}>

        {/* ── Spinner bank ── */}
        <div style={{
          display:'flex',
          gap: openQty > 1 ? 2 : 0,
          marginBottom:14,
          borderRadius:'0 0 14px 14px',
          overflow:'hidden',
          boxShadow:'0 12px 40px rgba(0,0,0,.6)',
        }}>
          {Array.from({ length:openQty }).map((_,i) => (
            <SpinnerLane
              key={i}
              items={items}
              result={wonItems[i] ?? null}
              spinning={spinning}
              onComplete={handleLaneDone}
              index={i}
              total={openQty}
              done={!spinning && showResults && !!wonItems[i]}
            />
          ))}
        </div>

        {/* ── Results ── */}
        <AnimatePresence>
          {showResults && wonItems.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{ marginBottom:14 }}
            >
              {/* Summary bar */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 14px',
                background:'var(--surface)',
                border:'1px solid var(--border)',
                borderBottom:'none',
                borderRadius:'10px 10px 0 0',
              }}>
                <span style={{
                  fontSize:10, fontWeight:500, color:'var(--text-faint)',
                  fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'.08em',
                }}>
                  {wonItems.length === 1 ? 'You won' : `${wonItems.length}× opened`}
                  {isDemo && <span style={{ marginLeft:8, color:'rgba(168,85,247,.4)' }}>· demo</span>}
                </span>
                {!isDemo && wonItems.length > 1 && (
                  <span style={{
                    fontSize:12, fontWeight:500,
                    fontFamily:'DM Mono, monospace',
                    color:netGain>=0 ? '#34d399' : 'rgba(239,68,68,.75)',
                  }}>
                    {netGain>=0?'+':''}{netGain.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Result grid */}
              <div style={{
                display:'grid',
                gridTemplateColumns: wonItems.length===1 ? '1fr'
                  : wonItems.length<=2 ? 'repeat(2,1fr)'
                  : wonItems.length===4 ? 'repeat(2,1fr)'
                  : 'repeat(3,1fr)',
                gap:8, padding:10,
                background:'rgba(17,0,24,.6)',
                border:'1px solid var(--border)',
                borderRadius:'0 0 10px 10px',
              }}>
                {wonItems.map((item,i) => (
                  <ResultCard key={i} item={item} index={i} isDemo={isDemo} showParticles={showParticles && i===0} />
                ))}
              </div>

              {/* Total footer */}
              {!isDemo && wonItems.length > 1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:8 }}>
                  <span style={{ fontSize:10, color:'var(--text-faint)', fontFamily:'DM Mono, monospace' }}>won</span>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--gold)', fontFamily:'DM Mono, monospace' }}>
                    ${totalWon.toLocaleString()}
                  </span>
                  <span style={{ color:'var(--border)' }}>·</span>
                  <span style={{ fontSize:10, color:'var(--text-faint)', fontFamily:'DM Mono, monospace' }}>
                    paid ${totalCost.toLocaleString()}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action panel ── */}
        <div style={{ marginBottom:22 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            overflowX:'auto', overflowY:'visible',
            paddingBottom:2,
            scrollbarWidth:'none', msOverflowStyle:'none',
          }}>

            {/* Open / Open Again */}
            <button
              className="action-btn"
              onClick={showResults ? handleOpenAgain : handleOpen}
              disabled={spinning || !canAfford}
              style={{
                flexShrink:0,
                height:38, padding:'0 16px', borderRadius:8,
                border: canAfford ? 'none' : '1px solid var(--border)',
                cursor: spinning||!canAfford ? 'not-allowed' : 'pointer',
                fontSize:13, fontWeight:600, letterSpacing:'-.01em',
                fontFamily:'DM Sans, sans-serif',
                color: canAfford ? '#000' : 'var(--text-faint)',
                background: canAfford
                  ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                  : 'rgba(255,255,255,.04)',
                boxShadow: canAfford ? '0 0 18px rgba(251,191,36,.3)' : 'none',
                opacity: spinning ? .55 : 1,
                display:'inline-flex', alignItems:'center', gap:6,
                whiteSpace:'nowrap',
              }}>
              {spinning
                ? <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(0,0,0,.2)', borderTopColor:'#000', animation:'spin-loader 1s linear infinite' }} />
                : showResults
                  ? <RefreshCw style={{ width:13, height:13 }} />
                  : <Zap style={{ width:13, height:13 }} />
              }
              {spinning ? 'Opening…'
                : showResults
                  ? `Open Again${openQty>1?` ×${openQty}`:''}`
                  : `Open — $${totalCost.toLocaleString()}`}
            </button>

            {/* Free Try */}
            <button
              className="action-btn"
              onClick={showResults ? handleDemoAgain : handleDemo}
              disabled={spinning}
              style={{
                flexShrink:0,
                height:38, padding:'0 14px', borderRadius:8,
                cursor: spinning ? 'not-allowed' : 'pointer',
                fontSize:13, fontWeight:500, fontFamily:'DM Sans, sans-serif',
                color:'var(--purple-mid)',
                background:'var(--purple-soft)',
                border:'1px solid rgba(168,85,247,.22)',
                opacity: spinning ? .35 : 1,
                display:'inline-flex', alignItems:'center', gap:6,
                whiteSpace:'nowrap',
              }}>
              <Eye style={{ width:13, height:13 }} />
              Free Try
            </button>

            <div style={{ flexShrink:0, width:1, height:20, background:'var(--border)' }} />

            {/* Qty pills */}
            {[1,2,3,4,5].map(qty => {
              const sel = openQty === qty;
              const affordable = (user?.balance||0) >= (caseData.price||0) * qty;
              return (
                <button
                  key={qty}
                  className="qty-pill"
                  onClick={() => !spinning && setOpenQty(qty)}
                  disabled={spinning}
                  style={{
                    flexShrink:0,
                    width:32, height:32, padding:0, borderRadius:7, border:'none',
                    cursor: spinning ? 'not-allowed' : 'pointer',
                    fontSize:13, fontWeight:600, fontFamily:'DM Mono, monospace',
                    background: sel
                      ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                      : affordable ? 'var(--surface2)' : 'rgba(255,255,255,.03)',
                    color: sel ? '#000' : affordable ? 'var(--text-dim)' : 'var(--text-faint)',
                    boxShadow: sel ? '0 0 10px rgba(251,191,36,.3)' : 'none',
                    outline: sel ? 'none' : `1px solid ${affordable ? 'rgba(168,85,247,.15)' : 'rgba(255,255,255,.05)'}`,
                    outlineOffset: '-1px',
                  }}>
                  {qty}
                </button>
              );
            })}
          </div>

          {!canAfford && !spinning && (
            <p style={{ fontSize:11, color:'rgba(239,68,68,.5)', fontWeight:500, margin:'6px 0 0', fontFamily:'DM Mono, monospace' }}>
              ${(totalCost - (user?.balance||0)).toLocaleString()} short —{' '}
              <Link to={createPageUrl('Deposit')} style={{ color:'var(--purple-mid)', textDecoration:'underline' }}>
                Deposit
              </Link>
            </p>
          )}
        </div>

        {/* ── Contents / Odds tabs ── */}
        <div>
          {/* Tab switcher */}
          <div style={{
            display:'flex', gap:0, marginBottom:12,
            background:'var(--surface)', borderRadius:8, padding:3,
            border:'1px solid var(--border)',
          }}>
            {[['contents',`${items.length} Items`],['odds','Drop Odds']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:500, fontFamily:'DM Mono, monospace', letterSpacing:'.05em',
                transition:'all .18s',
                background: activeTab===id ? 'var(--gold-soft)' : 'transparent',
                color: activeTab===id ? 'var(--gold)' : 'var(--text-faint)',
                boxShadow: activeTab===id ? `inset 0 0 0 1px rgba(251,191,36,.18)` : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Items grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {items.map((item, i) => {
              const itemRs = rs(item.rarity);
              const isWon  = showResults && wonItems.some(r => r.name === item.name);
              const isHov  = hovItem === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity:0, y:8 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*.02 }}
                  className="item-card"
                  onMouseEnter={() => setHovItem(i)}
                  onMouseLeave={() => setHovItem(null)}
                  style={{
                    position:'relative', overflow:'hidden', borderRadius:10,
                    padding:'12px 10px',
                    background: isWon ? 'linear-gradient(145deg,#0f0010,#1a0030)' : 'var(--surface)',
                    border:`1px solid ${isWon ? itemRs.color+'45' : isHov ? 'rgba(251,191,36,.18)' : 'var(--border)'}`,
                    boxShadow: isWon ? `0 0 16px ${itemRs.glow}` : 'none',
                    textAlign:'center', cursor:'default',
                  }}>
                  <div className="lane-scan" />

                  {isWon && (
                    <div style={{
                      position:'absolute', top:6, right:6, zIndex:3,
                      fontSize:7, fontWeight:500, letterSpacing:'.08em', textTransform:'uppercase',
                      padding:'2px 6px', borderRadius:4,
                      background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                      color:'#000', fontFamily:'DM Mono, monospace',
                    }}>{isDemo?'DEMO':'WON'}</div>
                  )}

                  {activeTab === 'contents' ? (
                    <>
                      <div style={{
                        width:46, height:46, borderRadius:10, margin:'0 auto 8px',
                        background:itemRs.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:isHov||isWon?`0 0 14px ${itemRs.glow}`:`0 0 4px ${itemRs.glow}`,
                        border:`1px solid ${itemRs.color}18`,
                        transition:'box-shadow .2s',
                      }}>
                        {item.image||item.image_url
                          ? <img src={item.image||item.image_url} alt="" style={{ width:32, height:32, objectFit:'contain' }} />
                          : <Sparkles style={{ width:15, height:15, color:itemRs.color }} />
                        }
                      </div>
                      <div style={{ display:'inline-block', marginBottom:4, width:5, height:5, borderRadius:'50%', background:itemRs.color, boxShadow:`0 0 4px ${itemRs.color}` }} />
                      <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ margin:0, fontSize:12, fontWeight:500, color:'var(--gold)', fontFamily:'DM Mono, monospace' }}>
                        ${item.value?.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:7, textAlign:'left' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:itemRs.color, boxShadow:`0 0 4px ${itemRs.color}` }} />
                        <span style={{ flex:1, fontSize:10, fontWeight:500, color:'var(--text-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.name}
                        </span>
                        <span style={{
                          fontSize:10, fontWeight:500, flexShrink:0,
                          fontFamily:'DM Mono, monospace',
                          color:item.drop_rate>20?'#34d399':item.drop_rate>5?'var(--gold)':'var(--purple-mid)',
                        }}>
                          {item.drop_rate}%
                        </span>
                      </div>
                      <div style={{ marginTop:7, height:2, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', width:`${Math.min(100,item.drop_rate*2.5)}%`,
                          background:`linear-gradient(90deg,${itemRs.color},${itemRs.color}70)`,
                          borderRadius:99, transition:'width .5s',
                        }} />
                      </div>
                    </>
                  )}

                  <motion.div
                    animate={{ opacity:isHov||isWon?1:0 }}
                    style={{
                      position:'absolute', top:0, left:0, right:0, height:1,
                      background:`linear-gradient(90deg,transparent,${itemRs.color},transparent)`,
                      pointerEvents:'none',
                    }} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}