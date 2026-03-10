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
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
.co { font-family: 'Syne', sans-serif; -webkit-font-smoothing:antialiased; }

@keyframes spin-loader { to { transform: rotate(360deg); } }
@keyframes shimmer-bg {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.shimmer-text {
  background: linear-gradient(90deg,#fbbf24,#f59e0b,#fde68a,#fbbf24);
  background-size:200% auto;
  background-clip:text;
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
  animation:shimmer-bg 3s linear infinite;
  display:inline-block;
}
@keyframes float-slow {
  0%,100% { transform:translateY(0) rotate(-2deg); }
  50%     { transform:translateY(-10px) rotate(2deg); }
}
.float-slow { animation:float-slow 4s ease-in-out infinite; }

@keyframes scan {
  0%  { top:-1px; opacity:0; } 5% { opacity:1; } 95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2; pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.2),transparent);
  animation:scan 4s linear infinite;
}
@keyframes pulse-ring {
  0%  { transform:scale(1); opacity:.5; }
  100%{ transform:scale(1.7); opacity:0; }
}
.pulse-ring {
  position:absolute; inset:0; border-radius:inherit;
  border:2px solid currentColor;
  animation:pulse-ring 1.8s ease-out infinite; pointer-events:none;
}
@keyframes particle-burst {
  0%  { transform:translate(-50%,-50%) translate(0,0) scale(1); opacity:1; }
  100%{ transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); opacity:0; }
}

.item-card { transition:transform .22s cubic-bezier(.34,1.56,.64,1), border-color .2s, box-shadow .2s; }
.item-card:hover { transform:translateY(-4px) scale(1.03); }

.action-btn {
  position:relative; overflow:hidden;
  transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, opacity .18s;
}
.action-btn:hover:not(:disabled) { transform:translateY(-2px) scale(1.012); }
.action-btn:active:not(:disabled) { transform:scale(.97); }
.action-btn::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
  transform:skewX(-15deg); transition:left .5s;
}
.action-btn:hover:not(:disabled)::after { left:120%; }

.qty-pill { transition:all .15s cubic-bezier(.34,1.56,.64,1); }
.qty-pill:hover:not(:disabled) { transform:scale(1.06); }
.qty-pill:active:not(:disabled) { transform:scale(.95); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const RARITY = {
  common:    { color:'#9ca3af', glow:'rgba(156,163,175,.3)',  bg:'linear-gradient(135deg,#1f2937,#374151)', label:'Common'    },
  uncommon:  { color:'#34d399', glow:'rgba(52,211,153,.35)',  bg:'linear-gradient(135deg,#064e3b,#065f46)', label:'Uncommon'  },
  rare:      { color:'#60a5fa', glow:'rgba(96,165,250,.4)',   bg:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', label:'Rare'      },
  epic:      { color:'#c084fc', glow:'rgba(192,132,252,.45)', bg:'linear-gradient(135deg,#3b0764,#7c3aed)', label:'Epic'      },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.55)',  bg:'linear-gradient(135deg,#78350f,#f59e0b)', label:'Legendary' },
};
const rs = r => RARITY[r?.toLowerCase()] || RARITY.common;
const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

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

/* Single spinner lane — one CaseSpinner per case */
const CYCLE_GLOWS = [
  'rgba(156,163,175,.35)',
  'rgba(52,211,153,.4)',
  'rgba(96,165,250,.45)',
  'rgba(192,132,252,.5)',
  'rgba(251,191,36,.55)',
  'rgba(192,132,252,.45)',
  'rgba(96,165,250,.4)',
  'rgba(52,211,153,.35)',
];

function SpinnerLane({ items, result, spinning, onComplete, index, total, done }) {
  // Only show result rarity glow AFTER the lane finishes
  const itemRs = (done && result) ? rs(result.rarity) : null;
  const [cycleIdx, setCycleIdx] = React.useState(index % CYCLE_GLOWS.length);

  React.useEffect(() => {
    if (!spinning) { setCycleIdx(index % CYCLE_GLOWS.length); return; }
    const iv = setInterval(() => {
      setCycleIdx(i => (i + 1) % CYCLE_GLOWS.length);
    }, 150 + index * 37);
    return () => clearInterval(iv);
  }, [spinning, index]);

  // While spinning: cycle through rarity colors. After done: show won rarity. Idle: no glow.
  const glowColor = spinning
    ? CYCLE_GLOWS[cycleIdx]
    : itemRs ? itemRs.glow : undefined;

  return (
    <div style={{
      position:'relative', overflow:'hidden', flex:1,
      background:'linear-gradient(180deg,#0a0018,#060010)',
      border:'1px solid rgba(251,191,36,.08)', borderTop:'none',
      borderRadius: total === 1
        ? '0 0 16px 16px'
        : index === 0 ? '0 0 0 16px'
        : index === total-1 ? '0 0 16px 0'
        : '0',
      boxShadow: glowColor ? `inset 0 0 28px ${glowColor}` : undefined,
      transition: spinning ? 'box-shadow .14s' : 'box-shadow .5s',
    }}>
      <div className="scan" />
      {total > 1 && (
        <div style={{
          position:'absolute', top:5, left:0, right:0, zIndex:5,
          display:'flex', justifyContent:'center', pointerEvents:'none',
        }}>
          <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,.18)', fontFamily:'DM Mono, monospace', letterSpacing:'.1em' }}>
            #{index+1}
          </span>
        </div>
      )}
      {/* Pass result to CaseSpinner only when done so it can snap to final item,
          but during the spin the spinner animates through items freely */}
      <CaseSpinner items={items} result={result} spinning={spinning} onComplete={onComplete} />
    </div>
  );
}

/* Result card shown below spinners after all complete */
function ResultCard({ item, index, isDemo, showParticles }) {
  const itemRs = rs(item.rarity);
  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:.88 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ delay:index*0.07, type:'spring', stiffness:300, damping:24 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:13, textAlign:'center',
        background:'linear-gradient(145deg,#08001a,#110028)',
        border:`1px solid ${itemRs.color}40`,
        boxShadow:`0 0 26px ${itemRs.glow}, 0 6px 18px rgba(0,0,0,.5)`,
        padding:'14px 10px 12px',
      }}>
      <div className="scan" />
      {showParticles && <Particles color={itemRs.color} count={16} />}
      <div style={{ position:'relative', width:58, height:58, margin:'0 auto 9px' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:12, color:itemRs.color }}>
          <div className="pulse-ring" />
        </div>
        <div style={{
          width:58, height:58, borderRadius:12, background:itemRs.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 20px ${itemRs.glow}`, border:`1px solid ${itemRs.color}40`,
        }}>
          {item.image||item.image_url
            ? <img src={item.image||item.image_url} alt="" style={{ width:42, height:42, objectFit:'contain' }} />
            : <Sparkles style={{ width:22, height:22, color:itemRs.color }} />
          }
        </div>
      </div>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:4, marginBottom:5,
        padding:'2px 8px', borderRadius:100,
        background:itemRs.bg, border:`1px solid ${itemRs.color}40`,
      }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:itemRs.color }} />
        <span style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:itemRs.color, fontFamily:'DM Mono, monospace' }}>
          {itemRs.label}
        </span>
      </div>
      <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {item.name}
      </p>
      {!isDemo && (
        <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>
          {item.value?.toLocaleString()} ¢
        </p>
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
    setWonItems(items);
    setCompletedCount(0);
    setShowResults(false);
    setShowParticles(false);
    setIsDemo(demo);
    setSpinning(true);
  };

  /* Each lane calls this when its animation ends */
  const handleLaneDone = useCallback(() => {
    setCompletedCount(c => c + 1);
  }, []);

  /* When all lanes finish */
  useEffect(() => {
    if (!spinning || completedCount === 0 || completedCount < openQty) return;
    setSpinning(false);
    setShowResults(true);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1800);

    if (!isDemo && wonItems.length > 0 && user && caseData) {
      const totalWon   = wonItems.reduce((s,r) => s+(r.value||0), 0);
      const newBalance = (user.balance||0) + totalWon;
      const xpGain     = Math.floor(caseData.price * openQty / 10);
      const newXp      = (user.xp||0) + xpGain;
      const newLevel   = Math.floor(newXp/500)+1;
      base44.auth.updateMe({ balance:newBalance, xp:newXp, level:newLevel });
      setUser(u => ({ ...u, balance:newBalance }));
      wonItems.forEach(wonItem => {
        base44.entities.Transaction.create({
          user_email:user.email, type:'case_win',
          amount:wonItem.value - caseData.price,
          balance_after:newBalance,
          description:`Won ${wonItem.name} from ${caseData.name}`,
        });
        base44.entities.UserInventory.create({
          user_email:user.email,
          item_name:wonItem.name,
          item_image_url:wonItem.image||wonItem.image_url||null,
          rarity:wonItem.rarity, value:wonItem.value,
          source:'case_opening', source_case:caseData.name, status:'owned',
        });
      });
      base44.entities.CaseTemplate.update(caseData.id, { total_opened:(caseData.total_opened||0)+openQty });
    }
  }, [completedCount, openQty, spinning]);

  /* Real open */
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

  /* Demo spin — no coins, no lock */
  const handleDemo = () => {
    if (!caseData || spinning) return;
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    startSpin(rolled, true);
  };

  /* Open again after result */
  const handleOpenAgain = async () => {
    setShowResults(false);
    setWonItems([]);
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

  /* Demo again */
  const handleDemoAgain = () => {
    setShowResults(false);
    setWonItems([]);
    const rolled = Array.from({ length:openQty }, () => rollItem(caseData.items||[]));
    startSpin(rolled, true);
  };

  /* ── loading / not found ── */
  if (loading || userLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:'#04000a' }}>
      <div style={{ position:'relative', width:48, height:48 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #fbbf24', animation:'spin-loader 1s linear infinite' }} />
        <div style={{ position:'absolute', inset:7, borderRadius:'50%', border:'2px solid #a855f7', animation:'spin-loader .7s linear infinite reverse' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 12px #fbbf24' }} />
        </div>
      </div>
    </div>
  );

  if (!caseData) return (
    <div className="co" style={{ textAlign:'center', paddingTop:80, background:'#04000a', minHeight:'60vh' }}>
      <style>{CSS}</style>
      <Box style={{ width:40, height:40, color:'rgba(251,191,36,.2)', margin:'0 auto 12px' }} />
      <p style={{ color:'rgba(251,191,36,.4)', fontWeight:700, marginBottom:16 }}>Case not found</p>
      <Link to={createPageUrl('Cases')}>
        <button style={{
          display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10,
          cursor:'pointer', background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.2)',
          color:'rgba(251,191,36,.8)', fontWeight:800, fontFamily:'Syne,sans-serif',
        }}><ArrowLeft style={{ width:14, height:14 }} /> Back</button>
      </Link>
    </div>
  );

  const items     = caseData.items || [];
  const totalCost = (caseData.price||0) * openQty;
  const canAfford = (user?.balance||0) >= totalCost;
  const totalWon  = wonItems.reduce((s,r) => s+(r?.value||0), 0);
  const netGain   = totalWon - (isDemo ? 0 : totalCost);

  return (
    <div className="co" style={{ background:'#04000a', minHeight:'100vh', marginLeft:-24, marginRight:-24, paddingBottom:80 }}>
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(180deg,#0e0020,#07000f)',
        borderBottom:'1px solid rgba(251,191,36,.1)',
        padding:'24px 20px 0',
      }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 60% at 50% -10%,rgba(168,85,247,.12),transparent 70%)' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)' }} />

        <div style={{ position:'relative', display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{ scale:1.08, x:-2 }} whileTap={{ scale:.94 }} style={{
              marginTop:3, width:32, height:32, borderRadius:8, cursor:'pointer',
              background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.15)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(251,191,36,.6)',
            }}>
              <ArrowLeft style={{ width:14, height:14 }} />
            </motion.button>
          </Link>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 className="shimmer-text" style={{ margin:'0 0 3px', fontSize:22, fontWeight:900, lineHeight:1.2, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {caseData.name}
            </h1>
            {caseData.description && (
              <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.22)' }}>{caseData.description}</p>
            )}
          </div>
          {caseData.image_url && (
            <div className="float-slow" style={{ width:62, height:62, flexShrink:0, filter:'drop-shadow(0 0 18px rgba(251,191,36,.45)) drop-shadow(0 6px 20px rgba(0,0,0,.9))' }}>
              <img src={caseData.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:14 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.18)',
            borderRadius:8, padding:'5px 11px',
          }}>
            <span style={{ fontSize:11, fontWeight:900, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>
              {caseData.price?.toLocaleString()} ¢
            </span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,.2)' }}>/ case</span>
          </div>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.18)', fontFamily:'DM Mono, monospace' }}>
            {caseData.total_opened ? `${caseData.total_opened.toLocaleString()} opened` : `${items.length} items`}
          </span>
        </div>
      </div>

      <div style={{ padding:'0 20px' }}>

        {/* ── SPINNER BANK — one lane per case ── */}
        <div style={{
          display:'flex',
          gap: openQty > 1 ? 2 : 0,
          marginBottom:14,
          borderRadius:'0 0 16px 16px',
          overflow:'hidden',
          boxShadow:'0 16px 50px rgba(0,0,0,.6)',
        }}>
          {Array.from({ length: openQty }).map((_, i) => (
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

        {/* ── RESULTS ── */}
        <AnimatePresence>
          {showResults && wonItems.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{ marginBottom:14 }}>

              {/* Summary header */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 12px',
                background:'rgba(255,255,255,.025)',
                border:'1px solid rgba(255,255,255,.06)',
                borderBottom:'none',
                borderRadius:'10px 10px 0 0',
              }}>
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.32)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'.1em' }}>
                  {wonItems.length === 1 ? 'You won' : `${wonItems.length}× opened`}
                  {isDemo && <span style={{ marginLeft:8, color:'rgba(192,132,252,.45)' }}>· demo</span>}
                </span>
                {!isDemo && wonItems.length > 1 && (
                  <span style={{ fontSize:12, fontWeight:800, fontFamily:'DM Mono, monospace', color:netGain>=0?'#34d399':'rgba(239,68,68,.75)' }}>
                    {netGain>=0?'+':''}{netGain.toLocaleString()} ¢
                  </span>
                )}
              </div>

              {/* Cards grid */}
              <div style={{
                display:'grid',
                gridTemplateColumns: wonItems.length===1 ? '1fr'
                  : wonItems.length<=2 ? 'repeat(2,1fr)'
                  : wonItems.length===4 ? 'repeat(2,1fr)'
                  : 'repeat(3,1fr)',
                gap:8, padding:'10px',
                background:'rgba(255,255,255,.02)',
                border:'1px solid rgba(255,255,255,.06)',
                borderRadius:'0 0 10px 10px',
              }}>
                {wonItems.map((item, i) => (
                  <ResultCard key={i} item={item} index={i} isDemo={isDemo} showParticles={showParticles && i===0} />
                ))}
              </div>

              {/* Total footer */}
              {!isDemo && wonItems.length > 1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, marginTop:8 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.22)', fontFamily:'DM Mono, monospace' }}>won</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>{totalWon.toLocaleString()} ¢</span>
                  <span style={{ color:'rgba(255,255,255,.12)' }}>·</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.22)', fontFamily:'DM Mono, monospace' }}>paid {totalCost.toLocaleString()} ¢</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTION PANEL ── */}
        <div style={{ marginBottom:22 }}>

          {/* Row: [OPEN btn] [FREE TRY] [1][2][3][4][5] — all inline, natural widths */}
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>

            {/* OPEN button — fixed comfortable width */}
            <button
              className="action-btn"
              onClick={showResults ? handleOpenAgain : handleOpen}
              disabled={spinning || !canAfford}
              style={{
                padding:'11px 18px', borderRadius:10, border:'none',
                cursor:spinning||!canAfford?'not-allowed':'pointer',
                fontSize:13, fontWeight:900, fontFamily:'Syne, sans-serif',
                color:canAfford?'#000':'rgba(255,255,255,.2)',
                background:canAfford
                  ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                  : 'rgba(255,255,255,.06)',
                border:canAfford?'none':'1px solid rgba(255,255,255,.07)',
                boxShadow:canAfford?'0 0 24px rgba(251,191,36,.4)':'none',
                opacity:spinning?.65:1,
                display:'inline-flex', alignItems:'center', gap:6,
                whiteSpace:'nowrap', flexShrink:0,
              }}>
              {spinning
                ? <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(0,0,0,.25)', borderTopColor:'#000', animation:'spin-loader 1s linear infinite' }} />
                : showResults ? <RefreshCw style={{ width:13, height:13 }} /> : <Zap style={{ width:13, height:13 }} />
              }
              {spinning ? 'Opening…'
                : showResults ? `Open Again${openQty>1?` ×${openQty}`:''}`
                : `Open for ${totalCost.toLocaleString()} ¢`}
            </button>

            {/* FREE TRY button */}
            <button
              className="action-btn"
              onClick={showResults ? handleDemoAgain : handleDemo}
              disabled={spinning}
              style={{
                padding:'11px 14px', borderRadius:10,
                cursor:spinning?'not-allowed':'pointer',
                fontSize:12, fontWeight:700, fontFamily:'Syne, sans-serif',
                color:'rgba(192,132,252,.9)',
                background:'rgba(168,85,247,.1)',
                border:'1px solid rgba(168,85,247,.25)',
                opacity:spinning?.45:1,
                display:'inline-flex', alignItems:'center', gap:5,
                whiteSpace:'nowrap', flexShrink:0,
              }}>
              <Eye style={{ width:12, height:12 }} />
              Free Try
            </button>

            {/* Divider */}
            <div style={{ width:1, height:28, background:'rgba(255,255,255,.08)', flexShrink:0 }} />

            {/* Qty pills — fixed 32×32 squares */}
            {[1,2,3,4,5].map(qty => {
              const sel = openQty === qty;
              const affordable = (user?.balance||0) >= (caseData.price||0)*qty;
              return (
                <button
                  key={qty}
                  className="qty-pill"
                  onClick={() => !spinning && setOpenQty(qty)}
                  disabled={spinning}
                  style={{
                    width:32, height:32, borderRadius:7, border:'none', padding:0,
                    cursor:spinning?'not-allowed':'pointer',
                    fontSize:13, fontWeight:800, fontFamily:'Syne, sans-serif',
                    background:sel
                      ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                      : affordable ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.03)',
                    color:sel?'#000':affordable?'rgba(255,255,255,.6)':'rgba(255,255,255,.18)',
                    boxShadow:sel?'0 0 10px rgba(251,191,36,.35)':'none',
                    outline:sel?'none':`1px solid ${affordable?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)'}`,
                    flexShrink:0,
                  }}>
                  {qty}
                </button>
              );
            })}
          </div>

          {/* Not enough coins — small, inline below */}
          {!canAfford && !spinning && (
            <p style={{ fontSize:11, color:'rgba(239,68,68,.5)', fontWeight:700, margin:'7px 0 0' }}>
              {(totalCost-(user?.balance||0)).toLocaleString()} ¢ short —{' '}
              <Link to={createPageUrl('Deposit')} style={{ color:'#a78bfa', textDecoration:'underline' }}>Deposit</Link>
            </p>
          )}
        </div>

        {/* ── CONTENTS / ODDS ── */}
        <div>
          <div style={{ display:'flex', gap:0, marginBottom:12, background:'rgba(255,255,255,.03)', borderRadius:8, padding:3 }}>
            {[['contents',`${items.length} Items`],['odds','Drop Odds']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:700, fontFamily:'DM Mono, monospace', letterSpacing:'.05em',
                transition:'all .18s',
                background:activeTab===id?'rgba(251,191,36,.1)':'transparent',
                color:activeTab===id?'#fbbf24':'rgba(255,255,255,.28)',
                boxShadow:activeTab===id?'inset 0 0 0 1px rgba(251,191,36,.16)':'none',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
            {items.map((item, i) => {
              const itemRs = rs(item.rarity);
              const isWon  = showResults && wonItems.some(r => r.name === item.name);
              const isHov  = hovItem === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*.02 }}
                  className="item-card"
                  onMouseEnter={() => setHovItem(i)}
                  onMouseLeave={() => setHovItem(null)}
                  style={{
                    position:'relative', overflow:'hidden', borderRadius:10,
                    padding:'12px 10px',
                    background:isWon?'linear-gradient(145deg,#0f0010,#180028)':'linear-gradient(145deg,#07000f,#0d0018)',
                    border:`1px solid ${isWon?itemRs.color+'50':isHov?'rgba(251,191,36,.15)':'rgba(251,191,36,.05)'}`,
                    boxShadow:isWon?`0 0 18px ${itemRs.glow}`:undefined,
                    textAlign:'center', cursor:'default',
                    transition:'border-color .2s, box-shadow .2s',
                  }}>
                  <div className="scan" />
                  {isWon && (
                    <div style={{
                      position:'absolute', top:5, right:5, zIndex:3,
                      fontSize:7, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase',
                      padding:'2px 5px', borderRadius:4,
                      background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000',
                      fontFamily:'DM Mono, monospace',
                    }}>{isDemo?'DEMO':'WON'}</div>
                  )}

                  {activeTab === 'contents' ? (
                    <>
                      <div style={{
                        width:46, height:46, borderRadius:10, margin:'0 auto 8px',
                        background:itemRs.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:isHov||isWon?`0 0 16px ${itemRs.glow}`:`0 0 5px ${itemRs.glow}`,
                        border:`1px solid ${itemRs.color}20`, transition:'box-shadow .2s',
                      }}>
                        {item.image||item.image_url
                          ? <img src={item.image||item.image_url} alt="" style={{ width:32, height:32, objectFit:'contain' }} />
                          : <Sparkles style={{ width:15, height:15, color:itemRs.color }} />
                        }
                      </div>
                      <div style={{ display:'inline-block', marginBottom:4, width:6, height:6, borderRadius:'50%', background:itemRs.color, boxShadow:`0 0 5px ${itemRs.color}` }} />
                      <p style={{ margin:'0 0 2px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ margin:0, fontSize:11, fontWeight:800, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>
                        {item.value?.toLocaleString()} ¢
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:7, textAlign:'left' }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:itemRs.color, boxShadow:`0 0 4px ${itemRs.color}` }} />
                        <span style={{ flex:1, fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize:10, fontWeight:800, flexShrink:0, color:item.drop_rate>20?'#34d399':item.drop_rate>5?'#fbbf24':'#c084fc', fontFamily:'DM Mono, monospace' }}>
                          {item.drop_rate}%
                        </span>
                      </div>
                      <div style={{ marginTop:7, height:2, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', width:`${Math.min(100,item.drop_rate*2.5)}%`,
                          background:`linear-gradient(90deg,${itemRs.color},${itemRs.color}80)`,
                          borderRadius:99, transition:'width .5s',
                        }} />
                      </div>
                    </>
                  )}

                  <motion.div animate={{ opacity:isHov||isWon?1:0 }} style={{
                    position:'absolute', top:0, left:0, right:0, height:2,
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