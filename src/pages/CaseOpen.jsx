import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { rollItem, getRarityColor, getRarityGlow } from '../components/game/useWallet';
import CaseSpinner from '../components/game/CaseSpinner';
import { normalizeItems } from '../components/game/normalizeItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, ArrowLeft, RefreshCw, Sparkles, Percent, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.co { font-family: 'Nunito', sans-serif; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; }
  95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:scan 6s linear infinite; pointer-events:none;
}

@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(380%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:20%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:shim 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.1), 0 8px 32px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.28), 0 8px 32px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.14); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

@keyframes result-pop {
  0%  { transform: scale(.85); opacity:0; }
  60% { transform: scale(1.04); }
  100%{ transform: scale(1);   opacity:1; }
}
.result-pop { animation: result-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes coin-spin {
  0%  { transform: rotateY(0deg); }
  100%{ transform: rotateY(360deg); }
}
.coin-spin { animation: coin-spin 2s linear infinite; }

@keyframes float-item {
  0%,100%{ transform: translateY(0); }
  50%    { transform: translateY(-8px); }
}
.float-item { animation: float-item 3s ease-in-out infinite; }

@keyframes win-glow {
  0%,100%{ box-shadow: 0 0 30px rgba(251,191,36,.3), 0 0 60px rgba(251,191,36,.1); }
  50%    { box-shadow: 0 0 50px rgba(251,191,36,.6), 0 0 100px rgba(251,191,36,.2); }
}
.win-glow { animation: win-glow 2s ease-in-out infinite; }

.card-lift {
  transition: transform .24s cubic-bezier(.34,1.56,.64,1), box-shadow .24s ease;
}
.card-lift:hover { transform: translateY(-3px) scale(1.02); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

/* ─── Rarity config ───────────────────────────────────────── */
const RARITY_STYLES = {
  common:    { color: '#9ca3af', glow: 'rgba(156,163,175,.4)', bg: 'linear-gradient(135deg,#1f2937,#374151)' },
  uncommon:  { color: '#34d399', glow: 'rgba(52,211,153,.4)',  bg: 'linear-gradient(135deg,#064e3b,#065f46)' },
  rare:      { color: '#60a5fa', glow: 'rgba(96,165,250,.45)', bg: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)' },
  epic:      { color: '#c084fc', glow: 'rgba(192,132,252,.5)', bg: 'linear-gradient(135deg,#3b0764,#7c3aed)' },
  legendary: { color: '#fbbf24', glow: 'rgba(251,191,36,.6)',  bg: 'linear-gradient(135deg,#78350f,#f59e0b)' },
};
const getRarity = r => RARITY_STYLES[r?.toLowerCase()] || RARITY_STYLES.common;

export default function CaseOpen() {
  const params   = new URLSearchParams(window.location.search);
  const caseId   = params.get('id');
  const [caseData,    setCaseData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [spinning,    setSpinning]    = useState(false);
  const [result,      setResult]      = useState(null);
  const [showResult,  setShowResult]  = useState(false);
  const [user,        setUser]        = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [hovItem,     setHovItem]     = useState(null);

  useEffect(() => {
    base44.auth.me().then(me => { setUser(me); setUserLoading(false); }).catch(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    if (caseId) {
      setLoading(true);
      base44.entities.CaseTemplate.list().then(all => {
        const found = all.find(c => c.id === caseId);
        if (found) found.items = normalizeItems(found.items);
        setCaseData(found || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [caseId]);

  const handleOpen = async () => {
    if (!caseData || spinning || !user) return;
    if ((user.balance || 0) < caseData.price) return;
    const wonItem = rollItem(caseData.items || []);
    setResult(wonItem);
    const costDeducted = (user.balance || 0) - caseData.price;
    await base44.auth.updateMe({ balance: costDeducted });
    setUser({ ...user, balance: costDeducted });
    const { addRakeback } = await import('../components/game/useWallet');
    const me = await base44.auth.me();
    await base44.auth.updateMe({
      rakeback_instant: Math.floor((me.rakeback_instant || 0) + caseData.price * 0.005),
      rakeback_daily:   Math.floor((me.rakeback_daily   || 0) + caseData.price * 0.003),
      rakeback_weekly:  Math.floor((me.rakeback_weekly  || 0) + caseData.price * 0.002),
      rakeback_monthly: Math.floor((me.rakeback_monthly || 0) + caseData.price * 0.001),
    });
    setSpinning(true);
    setShowResult(false);
  };

  const handleSpinComplete = async () => {
    setSpinning(false);
    setShowResult(true);
    if (result && user) {
      const newBalance = (user.balance || 0) + result.value;
      const xpGain = Math.floor(caseData.price / 10);
      const newXp = (user.xp || 0) + xpGain;
      const newLevel = Math.floor(newXp / 500) + 1;
      await base44.auth.updateMe({ balance: newBalance, xp: newXp, level: newLevel });
      setUser({ ...user, balance: newBalance, xp: newXp, level: newLevel });
      base44.entities.Transaction.create({
        user_email: user.email, type: 'case_win',
        amount: result.value - caseData.price,
        balance_after: newBalance,
        description: `Won ${result.name} from ${caseData.name}`,
      });
      base44.entities.CaseTemplate.update(caseData.id, { total_opened: (caseData.total_opened || 0) + 1 });
      base44.entities.UserInventory.create({
        user_email: user.email, item_name: result.name,
        rarity: result.rarity, value: result.value,
        source: 'case_opening', source_case: caseData.name, status: 'owned',
      });
    }
  };

  const handleTryAgain = async () => {
    setResult(null);
    setShowResult(false);
    const me = await base44.auth.me();
    setUser(me);
    if (!caseData || !me || (me.balance || 0) < caseData.price) return;
    const wonItem = rollItem(caseData.items || []);
    setResult(wonItem);
    const costDeducted = (me.balance || 0) - caseData.price;
    await base44.auth.updateMe({ balance: costDeducted });
    setUser({ ...me, balance: costDeducted });
    setSpinning(true);
  };

  /* ── Loading ── */
  if (loading || userLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#04000a' }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #fbbf24', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '2px solid #a855f7', animation: 'spin .72s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 12px #fbbf24' }} />
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!caseData) return (
    <div className="co" style={{ textAlign: 'center', paddingTop: 80, background: '#04000a', minHeight: '60vh' }}>
      <style>{CSS}</style>
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
        background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box style={{ width: 28, height: 28, color: 'rgba(251,191,36,.3)' }} />
      </div>
      <p style={{ color: 'rgba(251,191,36,.4)', fontWeight: 700, marginBottom: 16 }}>Case not found</p>
      <Link to={createPageUrl('Cases')}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
          background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)',
          color: 'rgba(251,191,36,.8)', fontWeight: 800, fontFamily: 'Nunito,sans-serif',
        }}>
          <ArrowLeft style={{ width: 15, height: 15 }} /> Back to Cases
        </button>
      </Link>
    </div>
  );

  const canAfford = (user?.balance || 0) >= caseData.price;

  return (
    <div className="co" style={{
      background: '#04000a', minHeight: '100vh',
      marginLeft: -24, marginRight: -24,
      padding: '28px 24px 80px',
    }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Link to={createPageUrl('Cases')}>
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: .94 }}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(251,191,36,.7)',
            }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </motion.button>
        </Link>

        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 900, lineHeight: 1.1,
            background: 'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc 75%,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{caseData.name}</h1>
          {caseData.description && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>
              {caseData.description}
            </p>
          )}
        </div>

        {/* Balance chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.18)',
          borderRadius: 10, padding: '7px 14px',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(251,191,36,.5)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#000' }}>$</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>
            {(user?.balance || 0).toLocaleString()}
          </span>
        </div>
      </motion.div>

      {/* Gold accent line */}
      <div style={{
        height: 2, borderRadius: 2, marginBottom: 28,
        background: 'linear-gradient(90deg,#fbbf24,#a855f7,transparent)',
        width: 200,
      }} />

      {/* ── Spinner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 16,
          background: 'linear-gradient(145deg,#07000f,#100020)',
          border: '1px solid rgba(251,191,36,.12)',
          boxShadow: '0 0 0 1px rgba(251,191,36,.06), 0 16px 50px rgba(0,0,0,.7), 0 0 60px rgba(168,85,247,.1)',
          marginBottom: 20,
        }}>
        <div className="scan" />
        <div style={{ padding: '4px 0' }}>
          <CaseSpinner
            items={caseData.items || []}
            result={result}
            spinning={spinning}
            onComplete={handleSpinComplete}
          />
        </div>
      </motion.div>

      {/* ── Result card ── */}
      <AnimatePresence>
        {showResult && result && (() => {
          const rs = getRarity(result.rarity);
          return (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: .88, y: 20 }}
              animate={{ opacity: 1, scale: 1,  y: 0 }}
              exit={{ opacity: 0, scale: .9, y: -10 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              style={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 16, marginBottom: 20,
                background: 'linear-gradient(145deg,#07000f,#110022)',
                border: `1px solid ${rs.color}40`,
                boxShadow: `0 0 40px ${rs.glow}, 0 16px 50px rgba(0,0,0,.7)`,
                padding: '32px 24px',
                textAlign: 'center',
              }}>
              <div className="scan" />

              {/* Glow bg */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse 60% 50% at 50% 0%,${rs.glow.replace('.6',',.15')} 0%,transparent 70%)`,
              }} />

              {/* Item image */}
              <div className="float-item" style={{ position: 'relative', zIndex: 2, marginBottom: 16 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 20, margin: '0 auto',
                  background: rs.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 30px ${rs.glow}, 0 8px 32px rgba(0,0,0,.6)`,
                  border: `1px solid ${rs.color}50`,
                }}>
                  {result.image
                    ? <img src={result.image} alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    : <Sparkles style={{ width: 40, height: 40, color: rs.color }} />
                  }
                </div>
              </div>

              {/* Rarity badge */}
              <div style={{
                display: 'inline-block', marginBottom: 10,
                padding: '3px 12px', borderRadius: 100,
                background: rs.bg, border: `1px solid ${rs.color}60`,
                fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: rs.color,
              }}>{result.rarity}</div>

              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#fff' }}>{result.name}</h2>

              {/* Winnings */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)',
                borderRadius: 12, padding: '10px 20px',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(251,191,36,.5)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#000' }}>$</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>
                  +{result.value?.toLocaleString()} coins added
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Action buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>

        {showResult ? (
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: .97 }}
            onClick={handleTryAgain}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 900, fontFamily: 'Nunito,sans-serif', color: '#000',
              background: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)',
              boxShadow: '0 0 40px rgba(251,191,36,.45), 0 4px 20px rgba(0,0,0,.5)',
            }}>
            <RefreshCw style={{ width: 17, height: 17 }} />
            Open Again — {caseData.price?.toLocaleString()} coins
          </motion.button>
        ) : (
          <motion.button
            whileHover={canAfford && !spinning ? { scale: 1.04, y: -2 } : {}}
            whileTap={canAfford && !spinning ? { scale: .97 } : {}}
            onClick={handleOpen}
            disabled={spinning || !canAfford}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '16px 36px', borderRadius: 12, border: 'none',
              cursor: spinning || !canAfford ? 'not-allowed' : 'pointer',
              fontSize: 16, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
              color: canAfford ? '#000' : 'rgba(255,255,255,.3)',
              background: canAfford
                ? 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 50%,#fde68a 100%)'
                : 'rgba(255,255,255,.06)',
              boxShadow: canAfford ? '0 0 40px rgba(251,191,36,.45), 0 4px 20px rgba(0,0,0,.5)' : 'none',
              border: canAfford ? 'none' : '1px solid rgba(255,255,255,.08)',
              opacity: spinning ? .7 : 1,
              transition: 'all .3s',
            }}>
            {spinning
              ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(0,0,0,.3)', borderTopColor: '#000', animation: 'spin 1s linear infinite' }} />
              : <Box style={{ width: 18, height: 18 }} />
            }
            {spinning ? 'Opening…' : `Open Case — ${caseData.price?.toLocaleString()} coins`}
          </motion.button>
        )}

        {!canAfford && !spinning && !showResult && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 12, color: 'rgba(239,68,68,.7)', fontWeight: 700, textAlign: 'center' }}>
            Not enough coins.{' '}
            <Link to={createPageUrl('Deposit')} style={{ color: '#c084fc', textDecoration: 'underline' }}>
              Deposit more
            </Link>
          </motion.p>
        )}
      </motion.div>

      {/* ── Case Contents ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
          <Percent style={{ width: 15, height: 15, color: '#fbbf24' }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Case Contents</span>
          <span style={{ fontSize: 11, color: 'rgba(251,191,36,.4)', fontWeight: 700, marginLeft: 4 }}>
            {(caseData.items || []).length} items
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {(caseData.items || []).map((item, i) => {
            const rs = getRarity(item.rarity);
            const isWon = item.name === result?.name && showResult;
            const isHov = hovItem === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .3 + i * .03 }}
                onMouseEnter={() => setHovItem(i)}
                onMouseLeave={() => setHovItem(null)}
                className="card-lift shim"
                style={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: 12, padding: '14px 12px',
                  background: isWon
                    ? `linear-gradient(145deg,${rs.bg.split(',')[0].replace('linear-gradient(135deg,','').replace('(','').replace(')','')},#1a0d00)`
                    : 'linear-gradient(145deg,#07000f,#0e001a)',
                  border: `1px solid ${isWon ? rs.color + '60' : isHov ? 'rgba(251,191,36,.2)' : 'rgba(251,191,36,.06)'}`,
                  boxShadow: isWon ? `0 0 20px ${rs.glow}` : undefined,
                  textAlign: 'center',
                  transition: 'border-color .25s',
                  cursor: 'default',
                }}>
                <div className="scan" />

                {/* Won badge */}
                {isWon && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    fontSize: 8, fontWeight: 800, letterSpacing: '.12em',
                    textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5,
                    background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#000',
                    boxShadow: '0 0 10px rgba(251,191,36,.5)', zIndex: 3,
                  }}>WON</div>
                )}

                {/* Item image */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, margin: '0 auto 10px',
                  background: rs.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isHov || isWon ? `0 0 18px ${rs.glow}` : `0 0 8px ${rs.glow.replace('.4',',.15').replace('.5',',.2').replace('.6',',.2')}`,
                  border: `1px solid ${rs.color}30`,
                  transition: 'box-shadow .25s',
                }}>
                  {item.image
                    ? <img src={item.image} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    : <Sparkles style={{ width: 20, height: 20, color: rs.color }} />
                  }
                </div>

                {/* Rarity pip */}
                <div style={{
                  display: 'inline-block', marginBottom: 5,
                  width: 8, height: 8, borderRadius: '50%',
                  background: rs.color, boxShadow: `0 0 6px ${rs.color}`,
                }} />

                <p style={{
                  margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.name}</p>

                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 900, color: '#fbbf24' }}>
                  {item.value?.toLocaleString()}
                </p>

                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>
                  {item.drop_rate}% chance
                </p>

                {/* Hover top line */}
                <motion.div
                  animate={{ opacity: isHov || isWon ? 1 : 0 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg,transparent,${rs.color},transparent)`,
                    pointerEvents: 'none',
                  }} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}