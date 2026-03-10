import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { rollItem, getRarityColor, getRarityGlow } from '../components/game/useWallet';
import CaseSpinner from '../components/game/CaseSpinner';
import { normalizeItems } from '../components/game/normalizeItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, ArrowLeft, RefreshCw, Sparkles, Percent, Eye, Zap, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
.co { font-family: 'Syne', sans-serif; }

@keyframes spin-loader { to { transform: rotate(360deg); } }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; } 95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:scan 5s linear infinite; pointer-events:none;
}

@keyframes float-slow {
  0%,100% { transform: translateY(0px) rotate(-2deg); }
  50%     { transform: translateY(-12px) rotate(2deg); }
}
.float-slow { animation: float-slow 4s ease-in-out infinite; }

@keyframes shimmer-bg {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.shimmer-text {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a, #fbbf24);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-bg 3s linear infinite;
}

@keyframes pulse-ring {
  0%  { transform: scale(1);   opacity:.6; }
  100%{ transform: scale(1.8); opacity:0;  }
}
.pulse-ring {
  position:absolute; inset:0; border-radius:inherit;
  border:2px solid currentColor;
  animation: pulse-ring 1.8s ease-out infinite;
  pointer-events:none;
}

@keyframes win-burst {
  0%  { transform:scale(.7); opacity:0; }
  55% { transform:scale(1.06); opacity:1; }
  100%{ transform:scale(1); opacity:1; }
}
.win-burst { animation: win-burst .55s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes demo-lock-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,.5); }
  50%     { box-shadow: 0 0 0 10px rgba(168,85,247,0); }
}
.demo-lock-pulse { animation: demo-lock-pulse 2s ease-in-out infinite; }

@keyframes demo-badge-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,.4); }
  50%     { box-shadow: 0 0 0 8px rgba(168,85,247,0); }
}
.demo-badge-pulse { animation: demo-badge-pulse 2s ease-in-out infinite; }

.item-card {
  transition: transform .24s cubic-bezier(.34,1.56,.64,1), border-color .24s, box-shadow .24s;
}
.item-card:hover { transform: translateY(-4px) scale(1.03); }

/* ── OPEN BUTTON ── */
.open-btn {
  position: relative; overflow: hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, opacity .2s;
}
.open-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.015); }
.open-btn:active:not(:disabled) { transform: scale(.97); }
.open-btn::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
  transform: skewX(-15deg);
  transition: left .5s;
}
.open-btn:hover::after { left:120%; }

/* ── QUANTITY SELECTOR ── */
.qty-btn {
  transition: background .15s, transform .15s;
}
.qty-btn:hover { transform: scale(1.08); }
.qty-btn:active { transform: scale(.95); }

/* ── DEMO BTN ── */
.demo-btn {
  position: relative; overflow: hidden;
  transition: transform .2s, background .2s, border-color .2s;
}
.demo-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(168,85,247,.16) !important;
  border-color: rgba(168,85,247,.4) !important;
}
.demo-btn:active:not(:disabled) { transform: scale(.97); }
.demo-btn::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background: linear-gradient(90deg,transparent,rgba(192,132,252,.15),transparent);
  transform: skewX(-15deg);
  transition: left .5s;
}
.demo-btn:hover::after { left:120%; }

.tab-btn { transition: all .2s; }
.tab-btn:hover { color: rgba(251,191,36,.7) !important; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const RARITY = {
  common:    { color:'#9ca3af', glow:'rgba(156,163,175,.35)', bg:'linear-gradient(135deg,#1f2937,#374151)', label:'Common' },
  uncommon:  { color:'#34d399', glow:'rgba(52,211,153,.4)',   bg:'linear-gradient(135deg,#064e3b,#065f46)', label:'Uncommon' },
  rare:      { color:'#60a5fa', glow:'rgba(96,165,250,.45)',  bg:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', label:'Rare' },
  epic:      { color:'#c084fc', glow:'rgba(192,132,252,.5)',  bg:'linear-gradient(135deg,#3b0764,#7c3aed)', label:'Epic' },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.6)',   bg:'linear-gradient(135deg,#78350f,#f59e0b)', label:'Legendary' },
};
const rs = r => RARITY[r?.toLowerCase()] || RARITY.common;

const OPEN_QTY_OPTIONS = [1, 2, 3, 4, 5];

function Particles({ color, count = 16 }) {
  const pts = Array.from({ length: count }, (_, i) => ({
    id: i, angle: (360 / count) * i,
    dist: 60 + Math.random() * 60, size: 3 + Math.random() * 4,
    delay: Math.random() * .4, dur: .8 + Math.random() * .6,
  }));
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible', zIndex:10 }}>
      {pts.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;
        return (
          <div key={p.id} style={{
            position:'absolute', left:'50%', top:'50%',
            width:p.size, height:p.size, borderRadius:'50%',
            background:color, boxShadow:`0 0 ${p.size*2}px ${color}`,
            animation:`particle-burst ${p.dur}s ease-out ${p.delay}s forwards`,
            '--tx':`${tx}px`, '--ty':`${ty}px`,
          }} />
        );
      })}
      <style>{`
        @keyframes particle-burst {
          0%  { transform:translate(-50%,-50%) translate(0,0) scale(1); opacity:1; }
          100%{ transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); opacity:0; }
        }
      `}</style>
    </div>
  );
}

/* ── MULTI-RESULT GRID ── */
function MultiResultCard({ item, index, isDemo }) {
  const itemRs = rs(item.rarity);
  return (
    <motion.div
      initial={{ opacity:0, scale:.75, y:20 }}
      animate={{ opacity:1, scale:1, y:0 }}
      transition={{ delay: index * 0.08, type:'spring', stiffness:280, damping:22 }}
      style={{
        position:'relative', overflow:'hidden', borderRadius:14,
        background:'linear-gradient(145deg,#08001a,#110028)',
        border:`1px solid ${itemRs.color}40`,
        boxShadow:`0 0 30px ${itemRs.glow}, 0 8px 24px rgba(0,0,0,.6)`,
        padding:'16px 12px 14px',
        textAlign:'center',
      }}>
      <div className="scan" />
      <div style={{
        position:'absolute', top:-30, left:'50%', transform:'translateX(-50%)',
        width:120, height:120, borderRadius:'50%', pointerEvents:'none',
        background:`radial-gradient(circle,${itemRs.color}14 0%,transparent 70%)`,
      }} />
      <div style={{ position:'relative', width:64, height:64, margin:'0 auto 10px' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:14, color:itemRs.color }}>
          <div className="pulse-ring" />
        </div>
        <div style={{
          width:64, height:64, borderRadius:14,
          background:itemRs.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 24px ${itemRs.glow}`,
          border:`1px solid ${itemRs.color}45`,
        }}>
          {item.image || item.image_url
            ? <img src={item.image || item.image_url} alt="" style={{ width:46, height:46, objectFit:'contain' }} />
            : <Sparkles style={{ width:24, height:24, color:itemRs.color }} />
          }
        </div>
      </div>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:4, marginBottom:6,
        padding:'2px 8px', borderRadius:100,
        background:itemRs.bg, border:`1px solid ${itemRs.color}45`,
      }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:itemRs.color, boxShadow:`0 0 5px ${itemRs.color}` }} />
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:itemRs.color, fontFamily:'DM Mono, monospace' }}>
          {itemRs.label}
        </span>
      </div>
      <p style={{ margin:'0 0 3px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {item.name}
      </p>
      <p style={{ margin:0, fontSize:13, fontWeight:800, color:isDemo ? 'rgba(192,132,252,.7)' : '#fbbf24', fontFamily:'DM Mono, monospace' }}>
        {isDemo ? '—' : `${item.value?.toLocaleString()} ¢`}
      </p>
    </motion.div>
  );
}

/* ── QUANTITY SELECTOR ── */
function QuantitySelector({ value, onChange, max = 5, price, balance, disabled }) {
  const totalCost = value * price;
  const canAfford = balance >= totalCost;

  return (
    <div style={{
      background:'rgba(255,255,255,.03)',
      border:'1px solid rgba(251,191,36,.1)',
      borderRadius:14,
      padding:'14px 16px',
      marginBottom:12,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.35)', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:'DM Mono, monospace' }}>
          Cases to Open
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.25)', fontFamily:'DM Mono, monospace' }}>
            Total:
          </span>
          <span style={{ fontSize:13, fontWeight:800, color: canAfford ? '#fbbf24' : 'rgba(239,68,68,.7)', fontFamily:'DM Mono, monospace' }}>
            {totalCost?.toLocaleString()} ¢
          </span>
        </div>
      </div>

      {/* Pill quantity buttons */}
      <div style={{ display:'flex', gap:6 }}>
        {OPEN_QTY_OPTIONS.map(qty => {
          const isSelected = value === qty;
          const affordable = balance >= qty * price;
          return (
            <button
              key={qty}
              className="qty-btn"
              onClick={() => !disabled && onChange(qty)}
              disabled={disabled}
              style={{
                flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize:14, fontWeight:800, fontFamily:'Syne, sans-serif',
                background: isSelected
                  ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                  : affordable ? 'rgba(251,191,36,.08)' : 'rgba(255,255,255,.03)',
                color: isSelected ? '#000' : affordable ? 'rgba(251,191,36,.7)' : 'rgba(255,255,255,.2)',
                boxShadow: isSelected ? '0 0 20px rgba(251,191,36,.4), 0 2px 8px rgba(0,0,0,.4)' : 'none',
                border: isSelected ? 'none' : `1px solid ${affordable ? 'rgba(251,191,36,.15)' : 'rgba(255,255,255,.05)'}`,
                position:'relative',
                transition:'all .18s',
              }}>
              {qty}
              {isSelected && (
                <div style={{
                  position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)',
                  width:4, height:4, borderRadius:'50%', background:'rgba(0,0,0,.4)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CaseOpen() {
  const params = new URLSearchParams(window.location.search);
  useRequireAuth();
  const caseId = params.get('id');

  const [caseData,      setCaseData]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [spinning,      setSpinning]      = useState(false);
  const [result,        setResult]        = useState(null);
  const [results,       setResults]       = useState([]); // multi-open results
  const [showResult,    setShowResult]    = useState(false);
  const [user,          setUser]          = useState(null);
  const [userLoading,   setUserLoading]   = useState(true);
  const [isDemo,        setIsDemo]        = useState(false);
  const [demoLocked,    setDemoLocked]    = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [hovItem,       setHovItem]       = useState(null);
  const [activeTab,     setActiveTab]     = useState('contents');
  const [openQty,       setOpenQty]       = useState(1);

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

  const doSpin = (wonItem) => {
    setResult(wonItem);
    setResults([]);
    setShowResult(false);
    setShowParticles(false);
    setSpinning(true);
  };

  const handleOpen = async () => {
    if (demoLocked || !caseData || spinning || !user) return;
    const totalCost = caseData.price * openQty;
    if ((user.balance || 0) < totalCost) return;

    // Roll all items upfront
    const wonItems = Array.from({ length: openQty }, () => rollItem(caseData.items || []));
    const costDeducted = (user.balance || 0) - totalCost;
    await base44.auth.updateMe({ balance: costDeducted });
    setUser({ ...user, balance: costDeducted });

    const me = await base44.auth.me();
    await base44.auth.updateMe({
      rakeback_instant: Math.floor((me.rakeback_instant || 0) + totalCost * 0.005),
      rakeback_daily:   Math.floor((me.rakeback_daily   || 0) + totalCost * 0.003),
      rakeback_weekly:  Math.floor((me.rakeback_weekly  || 0) + totalCost * 0.002),
      rakeback_monthly: Math.floor((me.rakeback_monthly || 0) + totalCost * 0.001),
    });

    setIsDemo(false);
    // For the spinner (single spin uses first item), store rest for post-spin
    setResults(wonItems);
    doSpin(wonItems[0]);
  };

  const handleDemo = () => {
    if (spinning || !caseData) return;
    setIsDemo(true);
    setDemoLocked(true);
    const wonItems = Array.from({ length: openQty }, () => rollItem(caseData.items || []));
    setResults(wonItems);
    doSpin(wonItems[0]);
  };

  const handleSpinComplete = async () => {
    setSpinning(false);
    setShowResult(true);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1800);

    if (!isDemo && results.length > 0 && user) {
      const totalWon = results.reduce((s, r) => s + (r.value || 0), 0);
      const newBalance = (user.balance || 0) + totalWon;
      const xpGain = Math.floor(caseData.price * openQty / 10);
      const newXp = (user.xp || 0) + xpGain;
      const newLevel = Math.floor(newXp / 500) + 1;
      await base44.auth.updateMe({ balance: newBalance, xp: newXp, level: newLevel });
      setUser({ ...user, balance: newBalance });

      for (const wonItem of results) {
        base44.entities.Transaction.create({
          user_email: user.email, type: 'case_win',
          amount: wonItem.value - caseData.price,
          balance_after: newBalance,
          description: `Won ${wonItem.name} from ${caseData.name}`,
        });
        base44.entities.UserInventory.create({
          user_email: user.email,
          item_name: wonItem.name,
          item_image_url: wonItem.image || wonItem.image_url || null,
          rarity: wonItem.rarity,
          value: wonItem.value,
          source: 'case_opening',
          source_case: caseData.name,
          status: 'owned',
        });
      }
      base44.entities.CaseTemplate.update(caseData.id, { total_opened: (caseData.total_opened || 0) + openQty });
    }
  };

  const handleTryAgain = () => {
    setResult(null);
    setResults([]);
    setShowResult(false);

    if (demoLocked) {
      handleDemo();
      return;
    }

    base44.auth.me().then(me => {
      setUser(me);
      const totalCost = (caseData?.price || 0) * openQty;
      if (!caseData || !me || (me.balance || 0) < totalCost) return;
      const wonItems = Array.from({ length: openQty }, () => rollItem(caseData.items || []));
      const costDeducted = (me.balance || 0) - totalCost;
      base44.auth.updateMe({ balance: costDeducted });
      setUser({ ...me, balance: costDeducted });
      setResults(wonItems);
      setIsDemo(false);
      doSpin(wonItems[0]);
    });
  };

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
        }}><ArrowLeft style={{ width:14, height:14 }} /> Back to Cases</button>
      </Link>
    </div>
  );

  const totalCost  = (caseData?.price || 0) * openQty;
  const canAfford  = !demoLocked && (user?.balance || 0) >= totalCost;
  const resultRs   = result ? rs(result.rarity) : null;
  const items      = caseData.items || [];

  // Best result from multi-open (for particle color)
  const rarityOrder = ['common','uncommon','rare','epic','legendary'];
  const bestResult  = results.reduce((best, r) => {
    return (rarityOrder.indexOf(r?.rarity?.toLowerCase()) > rarityOrder.indexOf(best?.rarity?.toLowerCase())) ? r : best;
  }, results[0]);
  const bestRs = bestResult ? rs(bestResult.rarity) : resultRs;

  const totalWon = results.reduce((s, r) => s + (r?.value || 0), 0);
  const netGain  = totalWon - (isDemo ? 0 : totalCost);

  return (
    <div className="co" style={{ background:'#04000a', minHeight:'100vh', marginLeft:-24, marginRight:-24, padding:'0 0 80px' }}>
      <style>{CSS}</style>

      {/* ══ HERO ══ */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(180deg,#0e0020 0%,#07000f 100%)',
        borderBottom:'1px solid rgba(251,191,36,.1)',
        padding:'24px 24px 0',
      }}>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 70% 60% at 50% -10%,rgba(168,85,247,.15) 0%,transparent 70%)',
        }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)' }} />

        <div style={{ position:'relative', display:'flex', alignItems:'flex-start', gap:14, marginBottom:20 }}>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{ scale:1.08, x:-2 }} whileTap={{ scale:.94 }} style={{
              marginTop:3, width:34, height:34, borderRadius:9, cursor:'pointer',
              background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.15)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(251,191,36,.6)',
            }}>
              <ArrowLeft style={{ width:15, height:15 }} />
            </motion.button>
          </Link>

          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              {demoLocked && (
                <motion.div
                  initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    fontSize:9, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase',
                    padding:'3px 10px', borderRadius:100,
                    background:'rgba(168,85,247,.15)', border:'1px solid rgba(168,85,247,.35)',
                    color:'#c084fc', fontFamily:'DM Mono, monospace',
                  }}>
                  <Lock style={{ width:8, height:8 }} />
                  DEMO MODE
                </motion.div>
              )}
            </div>
            <h1 className="shimmer-text" style={{ margin:0, fontSize:26, fontWeight:900, lineHeight:1.1 }}>
              {caseData.name}
            </h1>
            {caseData.description && (
              <p style={{ margin:'4px 0 0', fontSize:11, color:'rgba(255,255,255,.25)', fontWeight:600 }}>
                {caseData.description}
              </p>
            )}
          </div>

          {caseData.image_url && (
            <div className="float-slow" style={{
              width:70, height:70, flexShrink:0,
              filter:'drop-shadow(0 0 20px rgba(251,191,36,.5)) drop-shadow(0 8px 24px rgba(0,0,0,.9))',
            }}>
              <img src={caseData.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:20 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:7,
            background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.18)',
            borderRadius:10, padding:'6px 14px',
          }}>
            <div style={{
              width:18, height:18, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 10px rgba(251,191,36,.5)',
            }}>
              <span style={{ fontSize:9, fontWeight:900, color:'#000' }}>¢</span>
            </div>
            <span style={{ fontSize:14, fontWeight:900, color: demoLocked ? 'rgba(251,191,36,.35)' : '#fbbf24', textDecoration: demoLocked ? 'line-through' : 'none', fontFamily:'DM Mono, monospace' }}>
              {caseData.price?.toLocaleString()}
            </span>
            {demoLocked && (
              <span style={{ fontSize:11, fontWeight:800, color:'#c084fc', fontFamily:'DM Mono, monospace' }}>FREE</span>
            )}
          </div>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:600, fontFamily:'DM Mono, monospace' }}>
            {caseData.total_opened ? `${caseData.total_opened.toLocaleString()} opened` : `${items.length} items`}
          </span>
        </div>
      </div>

      <div style={{ padding:'0 24px' }}>

        {/* ══ SPINNER ══ */}
        <div style={{
          position:'relative', overflow:'hidden',
          borderRadius:'0 0 16px 16px',
          background:'linear-gradient(180deg,#0a0018 0%,#060010 100%)',
          border:'1px solid rgba(251,191,36,.08)', borderTop:'none',
          marginBottom:20,
          boxShadow:'0 16px 50px rgba(0,0,0,.6), 0 0 80px rgba(168,85,247,.06)',
        }}>
          <div className="scan" />
          <CaseSpinner items={items} result={result} spinning={spinning} onComplete={handleSpinComplete} />
        </div>

        {/* ══ MULTI-RESULT CARDS ══ */}
        <AnimatePresence>
          {showResult && results.length > 0 && (
            <motion.div
              key="multi-results"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={{ marginBottom:20 }}>

              {/* Summary bar */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:12, padding:'10px 14px', borderRadius:12,
                background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {showParticles && bestRs && <Particles color={bestRs.color} count={14} />}
                  <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'.1em' }}>
                    {results.length === 1 ? 'You won' : `${results.length} cases opened`}
                  </span>
                  {demoLocked && (
                    <span style={{ fontSize:9, fontWeight:800, color:'rgba(192,132,252,.5)', fontFamily:'DM Mono, monospace', letterSpacing:'.12em', textTransform:'uppercase', border:'1px solid rgba(192,132,252,.2)', borderRadius:5, padding:'1px 6px' }}>
                      DEMO
                    </span>
                  )}
                </div>
                {!isDemo && results.length > 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontFamily:'DM Mono, monospace' }}>Net:</span>
                    <span style={{ fontSize:13, fontWeight:800, fontFamily:'DM Mono, monospace', color: netGain >= 0 ? '#34d399' : 'rgba(239,68,68,.8)' }}>
                      {netGain >= 0 ? '+' : ''}{netGain.toLocaleString()} ¢
                    </span>
                  </div>
                )}
              </div>

              {/* Result cards grid */}
              <div style={{
                display:'grid',
                gridTemplateColumns: results.length === 1 ? '1fr' : results.length <= 2 ? 'repeat(2,1fr)' : results.length === 3 ? 'repeat(3,1fr)' : results.length === 4 ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
                gap:10,
              }}>
                {results.map((item, i) => (
                  <MultiResultCard key={i} item={item} index={i} isDemo={isDemo} />
                ))}
              </div>

              {/* Total won */}
              {!isDemo && results.length > 1 && (
                <motion.div
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: results.length * 0.08 + 0.1 }}
                  style={{
                    marginTop:10, padding:'10px 16px', borderRadius:10, textAlign:'center',
                    background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.12)',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontFamily:'DM Mono, monospace' }}>Total won</span>
                  <span style={{ fontSize:16, fontWeight:900, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>{totalWon.toLocaleString()} ¢</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.2)' }}>·</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontFamily:'DM Mono, monospace' }}>spent {totalCost.toLocaleString()} ¢</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ ACTION PANEL ══ */}
        <div style={{ marginBottom:28 }}>

          {/* --- DEMO LOCKED STATE --- */}
          {demoLocked ? (
            <div style={{
              borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(168,85,247,.2)',
              background:'linear-gradient(145deg,#0a0018,#0d0020)',
              boxShadow:'0 0 40px rgba(124,58,237,.1)',
            }}>
              {/* Demo info bar */}
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 16px',
                background:'rgba(168,85,247,.07)',
                borderBottom:'1px solid rgba(168,85,247,.15)',
              }}>
                <Lock style={{ width:11, height:11, color:'rgba(192,132,252,.5)' }} />
                <span style={{ fontSize:11, color:'rgba(192,132,252,.5)', fontWeight:700, fontFamily:'DM Mono, monospace', flex:1 }}>
                  Demo mode active — reload to open for real
                </span>
              </div>

              <div style={{ padding:'16px' }}>
                {/* Demo qty selector */}
                <QuantitySelector
                  value={openQty}
                  onChange={setOpenQty}
                  price={caseData.price}
                  balance={Infinity}
                  disabled={spinning}
                />

                {/* Demo spin button */}
                {showResult ? (
                  <button
                    className="open-btn demo-lock-pulse"
                    onClick={handleTryAgain}
                    style={{
                      width:'100%', padding:'15px 0', borderRadius:12, border:'none', cursor:'pointer',
                      fontSize:15, fontWeight:800, fontFamily:'Syne, sans-serif', color:'#fff',
                      background:'linear-gradient(135deg,#6d28d9,#7c3aed,#a855f7)',
                      boxShadow:'0 0 40px rgba(124,58,237,.45), 0 4px 16px rgba(0,0,0,.5)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                    }}>
                    <Eye style={{ width:16, height:16 }} />
                    Spin Again — Demo {openQty > 1 ? `×${openQty}` : ''}
                  </button>
                ) : (
                  <button
                    className="open-btn demo-lock-pulse"
                    onClick={handleDemo}
                    disabled={spinning}
                    style={{
                      width:'100%', padding:'16px 0', borderRadius:12, border:'none',
                      cursor: spinning ? 'not-allowed' : 'pointer',
                      fontSize:16, fontWeight:800, fontFamily:'Syne, sans-serif', color:'#fff',
                      background:'linear-gradient(135deg,#6d28d9,#7c3aed,#a855f7)',
                      boxShadow:'0 0 40px rgba(124,58,237,.5), 0 4px 20px rgba(0,0,0,.5)',
                      opacity: spinning ? .6 : 1,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                    }}>
                    {spinning
                      ? <div style={{ width:16, height:16, borderRadius:'50%', border:'2.5px solid rgba(255,255,255,.25)', borderTopColor:'#fff', animation:'spin-loader 1s linear infinite' }} />
                      : <Eye style={{ width:16, height:16 }} />
                    }
                    {spinning ? 'Spinning…' : `Demo Spin${openQty > 1 ? ` ×${openQty}` : ''} — Free`}
                  </button>
                )}
              </div>
            </div>

          ) : (
            /* --- NORMAL STATE --- */
            <div style={{
              borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(251,191,36,.12)',
              background:'linear-gradient(145deg,#080014,#0b001e)',
              boxShadow:'0 8px 40px rgba(0,0,0,.5)',
            }}>
              <div style={{ padding:'16px 16px 0' }}>
                {/* Quantity selector */}
                <QuantitySelector
                  value={openQty}
                  onChange={setOpenQty}
                  price={caseData.price}
                  balance={user?.balance || 0}
                  disabled={spinning}
                />
              </div>

              {/* Open button */}
              <div style={{ padding:'0 16px 12px' }}>
                {showResult ? (
                  <motion.button
                    className="open-btn"
                    whileTap={{ scale:.97 }}
                    onClick={handleTryAgain}
                    disabled={!canAfford && !demoLocked}
                    style={{
                      width:'100%', padding:'16px 0', borderRadius:12, border:'none',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontSize:15, fontWeight:800, fontFamily:'Syne, sans-serif',
                      color: canAfford ? '#000' : 'rgba(255,255,255,.2)',
                      background: canAfford
                        ? 'linear-gradient(135deg,#fbbf24,#f59e0b,#fde68a)'
                        : 'rgba(255,255,255,.04)',
                      border: canAfford ? 'none' : '1px solid rgba(255,255,255,.06)',
                      boxShadow: canAfford ? '0 0 40px rgba(251,191,36,.4), 0 4px 16px rgba(0,0,0,.5)' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                    }}>
                    <RefreshCw style={{ width:16, height:16 }} />
                    Open Again{openQty > 1 ? ` ×${openQty}` : ''} — {totalCost.toLocaleString()} ¢
                  </motion.button>
                ) : (
                  <motion.button
                    className="open-btn"
                    onClick={handleOpen}
                    disabled={spinning || !canAfford}
                    style={{
                      width:'100%', padding:'17px 0', borderRadius:12, border:'none',
                      cursor: spinning || !canAfford ? 'not-allowed' : 'pointer',
                      fontSize:16, fontWeight:900, fontFamily:'Syne, sans-serif',
                      color: canAfford ? '#000' : 'rgba(255,255,255,.2)',
                      background: canAfford
                        ? 'linear-gradient(135deg,#fbbf24,#f59e0b,#fde68a)'
                        : 'rgba(255,255,255,.04)',
                      border: canAfford ? 'none' : '1px solid rgba(255,255,255,.06)',
                      boxShadow: canAfford ? '0 0 50px rgba(251,191,36,.45), 0 4px 20px rgba(0,0,0,.5)' : 'none',
                      opacity: spinning ? .7 : 1,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                      transition:'background .3s, box-shadow .3s, color .3s, opacity .2s',
                    }}>
                    {spinning
                      ? <div style={{ width:17, height:17, borderRadius:'50%', border:'2.5px solid rgba(0,0,0,.25)', borderTopColor:'#000', animation:'spin-loader 1s linear infinite' }} />
                      : <Zap style={{ width:17, height:17 }} />
                    }
                    {spinning ? 'Opening…' : `Open Case${openQty > 1 ? ` ×${openQty}` : ''} — ${totalCost.toLocaleString()} ¢`}
                  </motion.button>
                )}

                {!canAfford && !spinning && (
                  <p style={{ textAlign:'center', fontSize:11, color:'rgba(239,68,68,.6)', fontWeight:700, margin:'8px 0 0' }}>
                    Need {(totalCost - (user?.balance||0)).toLocaleString()} more coins.{' '}
                    <Link to={createPageUrl('Deposit')} style={{ color:'#c084fc', textDecoration:'underline' }}>
                      Deposit
                    </Link>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(168,85,247,.12),transparent)', margin:'0 16px' }} />

              {/* Demo button */}
              <div style={{ padding:'12px 16px' }}>
                <button
                  className="demo-btn"
                  onClick={handleDemo}
                  disabled={spinning}
                  style={{
                    width:'100%', padding:'12px 0', borderRadius:11,
                    cursor: spinning ? 'not-allowed' : 'pointer',
                    fontSize:13, fontWeight:700, fontFamily:'Syne, sans-serif',
                    color:'rgba(192,132,252,.8)',
                    background:'rgba(168,85,247,.07)',
                    border:'1px solid rgba(168,85,247,.18)',
                    opacity: spinning ? .45 : 1,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  }}>
                  <Eye style={{ width:14, height:14 }} />
                  Demo Spin{openQty > 1 ? ` ×${openQty}` : ''} — Free Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ CONTENTS / ODDS TABS ══ */}
        <div>
          <div style={{ display:'flex', gap:0, marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3 }}>
            {[['contents','Contents'],['odds','Odds']].map(([id, label]) => (
              <button key={id} className="tab-btn" onClick={() => setActiveTab(id)} style={{
                flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700, fontFamily:'DM Mono, monospace', letterSpacing:'.06em',
                transition:'all .2s',
                background: activeTab===id ? 'rgba(251,191,36,.12)' : 'transparent',
                color: activeTab===id ? '#fbbf24' : 'rgba(255,255,255,.3)',
                boxShadow: activeTab===id ? 'inset 0 0 0 1px rgba(251,191,36,.2)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Percent style={{ width:13, height:13, color:'#fbbf24' }} />
            <span style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,.7)' }}>
              {activeTab === 'contents' ? `${items.length} possible items` : 'Drop rates'}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {items.map((item, i) => {
              const itemRs = rs(item.rarity);
              const isWon  = showResult && results.some(r => r.name === item.name);
              const isHov  = hovItem === i;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity:0, y:12 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * .025 }}
                  className="item-card"
                  onMouseEnter={() => setHovItem(i)}
                  onMouseLeave={() => setHovItem(null)}
                  style={{
                    position:'relative', overflow:'hidden', borderRadius:12,
                    padding:'14px 12px',
                    background: isWon ? 'linear-gradient(145deg,#0f0010,#180028)' : 'linear-gradient(145deg,#07000f,#0d0018)',
                    border:`1px solid ${isWon ? itemRs.color+'55' : isHov ? 'rgba(251,191,36,.18)' : 'rgba(251,191,36,.06)'}`,
                    boxShadow: isWon ? `0 0 22px ${itemRs.glow}` : undefined,
                    textAlign:'center', cursor:'default',
                    transition:'border-color .25s, box-shadow .25s',
                  }}>
                  <div className="scan" />

                  {isWon && (
                    <div style={{
                      position:'absolute', top:7, right:7,
                      fontSize:8, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase',
                      padding:'2px 6px', borderRadius:5,
                      background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000',
                      boxShadow:'0 0 10px rgba(251,191,36,.5)', zIndex:3,
                      fontFamily:'DM Mono, monospace',
                    }}>{demoLocked ? 'DEMO' : 'WON'}</div>
                  )}

                  {activeTab === 'contents' ? (
                    <>
                      <div style={{
                        width:52, height:52, borderRadius:12, margin:'0 auto 10px',
                        background:itemRs.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow: isHov || isWon ? `0 0 20px ${itemRs.glow}` : `0 0 8px ${itemRs.glow.replace('.4','.12').replace('.5','.15').replace('.6','.15')}`,
                        border:`1px solid ${itemRs.color}25`,
                        transition:'box-shadow .25s',
                      }}>
                        {item.image || item.image_url
                          ? <img src={item.image || item.image_url} alt="" style={{ width:38, height:38, objectFit:'contain' }} />
                          : <Sparkles style={{ width:18, height:18, color:itemRs.color }} />
                        }
                      </div>
                      <div style={{ display:'inline-block', marginBottom:6, width:7, height:7, borderRadius:'50%', background:itemRs.color, boxShadow:`0 0 5px ${itemRs.color}` }} />
                      <p style={{ margin:'0 0 3px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ margin:0, fontSize:12, fontWeight:900, color:'#fbbf24', fontFamily:'DM Mono, monospace' }}>
                        {item.value?.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:8, textAlign:'left', padding:'2px 0' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:itemRs.color, boxShadow:`0 0 5px ${itemRs.color}` }} />
                        <span style={{ flex:1, fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.name}
                        </span>
                        <span style={{ fontSize:11, fontWeight:800, flexShrink:0, color: item.drop_rate > 20 ? '#34d399' : item.drop_rate > 5 ? '#fbbf24' : '#c084fc', fontFamily:'DM Mono, monospace' }}>
                          {item.drop_rate}%
                        </span>
                      </div>
                      <div style={{ marginTop:8, height:3, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', width:`${Math.min(100, item.drop_rate * 2.5)}%`,
                          background:`linear-gradient(90deg,${itemRs.color},${itemRs.color}99)`,
                          borderRadius:99, boxShadow:`0 0 6px ${itemRs.color}`,
                          transition:'width .5s ease',
                        }} />
                      </div>
                    </>
                  )}

                  <motion.div animate={{ opacity: isHov || isWon ? 1 : 0 }} style={{
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