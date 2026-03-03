import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Rocket, Zap, TrendingUp, ArrowUp } from 'lucide-react';

const BETTING_DURATION = 30;
const CRASHED_DISPLAY_DURATION = 5000;

function generateCrashPoint() {
  const r = Math.random();
  return Math.max(1.01, Math.floor((1 / (1 - 0.04) / r) * 100) / 100);
}

function calcMultiplier(elapsedSec) {
  return Math.max(1.0, Math.floor(Math.pow(Math.E, elapsedSec * 0.15) * 100) / 100);
}

const BET_KEY = 'crash_bet';
function saveBet(data) { localStorage.setItem(BET_KEY, JSON.stringify(data)); }
function loadBet() { try { return JSON.parse(localStorage.getItem(BET_KEY)); } catch { return null; } }
function clearBet() { localStorage.removeItem(BET_KEY); }

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.cr { font-family: 'Nunito', sans-serif; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; } 95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.2),transparent);
  animation:scan 5s linear infinite; pointer-events:none;
}

@keyframes spin-loader { to { transform: rotate(360deg); } }

@keyframes multiplier-pulse {
  0%,100% { text-shadow: 0 0 20px currentColor; }
  50%     { text-shadow: 0 0 50px currentColor, 0 0 100px currentColor; }
}
.mult-glow { animation: multiplier-pulse 1s ease-in-out infinite; }

@keyframes rocket-fly {
  0%,100% { transform: translateY(0) rotate(-45deg); }
  50%     { transform: translateY(-12px) rotate(-45deg); }
}
.rocket-fly { animation: rocket-fly 1.5s ease-in-out infinite; }

@keyframes crash-shake {
  0%,100%{ transform: translateX(0); }
  20%    { transform: translateX(-6px); }
  40%    { transform: translateX(6px); }
  60%    { transform: translateX(-4px); }
  80%    { transform: translateX(4px); }
}
.crash-shake { animation: crash-shake .4s ease-in-out; }

@keyframes graph-line {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0; }
}
.graph-line { animation: graph-line 1s ease-out forwards; }

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.1), 0 8px 32px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.25), 0 8px 32px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.12); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

@keyframes bet-badge {
  0%  { transform: scale(.85); opacity:0; }
  100%{ transform: scale(1);   opacity:1; }
}
.bet-badge { animation: bet-badge .3s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes history-in {
  from { transform: translateX(-20px); opacity:0; }
  to   { transform: translateX(0);     opacity:1; }
}
.history-in { animation: history-in .3s ease-out forwards; }

.btn-gold {
  position:relative; overflow:hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
}
.btn-gold:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
.btn-gold:active:not(:disabled){ transform: scale(.97); }
.btn-gold::after {
  content:''; position:absolute; top:0; left:-60%; width:40%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
  transform:skewX(-15deg); transition:left .5s;
}
.btn-gold:hover::after { left:120%; }

::-webkit-scrollbar { width:4px; height:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

/* ─── Graph SVG ──────────────────────────────────────────── */
function CrashGraph({ phase, multiplier, crashPoint }) {
  const W = 400, H = 160;
  const progress = phase === 'crashed'
    ? 1
    : Math.min((multiplier - 1) / Math.max(crashPoint - 1, 0.1), 1);

  const pts = Array.from({ length: 40 }, (_, i) => {
    const t = (i / 39) * progress;
    const m = Math.pow(Math.E, t * (crashPoint - 1) * 0.6);
    return [
      (i / 39) * W,
      H - Math.min((m - 1) / Math.max(crashPoint - 1, 0.1) * (H - 20), H - 10),
    ];
  });

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillD = d + ` L ${pts[pts.length-1][0].toFixed(1)} ${H} L 0 ${H} Z`;

  const lineColor = phase === 'crashed' ? '#ef4444' : '#fbbf24';
  const glowColor = phase === 'crashed' ? 'rgba(239,68,68,.6)' : 'rgba(251,191,36,.6)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d={fillD} fill="url(#fillGrad)" />
      <path d={d} fill="none" stroke={lineColor} strokeWidth="2.5"
        filter="url(#glow)"
        style={{ filter:`drop-shadow(0 0 6px ${glowColor})` }}
      />
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="5"
          fill={lineColor}
          style={{ filter:`drop-shadow(0 0 8px ${glowColor})` }}
        />
      )}
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1="0" y1={H * t} x2={W} y2={H * t}
          stroke="rgba(255,255,255,.04)" strokeWidth="1" strokeDasharray="4 6" />
      ))}
    </svg>
  );
}

export default function Crash() {
  const { user, balance, updateBalance, addXp, addRakeback } = useWallet();

  const [phase,      setPhase]      = useState('loading');
  const [countdown,  setCountdown]  = useState(BETTING_DURATION);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history,    setHistory]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('crash_history') || '[]'); } catch { return []; }
  });
  const [liveBets,     setLiveBets]     = useState([]);
  const [enrichedBets, setEnrichedBets] = useState([]);
  const [roundId,      setRoundId]      = useState(null);

  const [betAmount,    setBetAmount]    = useState(100);
  const [autoCashout,  setAutoCashout]  = useState('');
  const [myBetRoundId, setMyBetRoundId] = useState(null);
  const [myBetAmount,  setMyBetAmount]  = useState(0);
  const [cashedOut,    setCashedOut]    = useState(false);
  const [cashoutAt,    setCashoutAt]    = useState(null);

  const hasBet   = myBetRoundId !== null && myBetRoundId === roundId;
  const canBet   = phase === 'betting' && !hasBet && betAmount > 0 && betAmount <= balance;
  const canCashout = phase === 'running' && hasBet && !cashedOut;

  const phaseRef          = useRef('loading');
  const roundRef          = useRef(null);
  const multiplierRef     = useRef(1.0);
  const animRef           = useRef(null);
  const creatingRef       = useRef(false);
  const crashedAtRef      = useRef(null);
  const historyRef        = useRef((() => { try { return JSON.parse(localStorage.getItem('crash_history') || '[]'); } catch { return []; } })());
  const myBetRoundIdRef   = useRef(null);
  const myBetAmountRef    = useRef(0);
  const autoCashoutRef    = useRef('');
  const cashedOutRef      = useRef(false);
  const betProcessedRef   = useRef(false);
  const walletRef         = useRef({ user, updateBalance, addXp, balance });
  walletRef.current = { user, updateBalance, addXp, balance };
  autoCashoutRef.current  = autoCashout;

  function stopAnimation() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }

  async function processCashout(atMultiplier, roundObj) {
    if (cashedOutRef.current || betProcessedRef.current) return;
    if (myBetRoundIdRef.current !== roundObj?.id) return;
    cashedOutRef.current = true;
    betProcessedRef.current = true;
    const amount = myBetAmountRef.current;
    const winnings = Math.floor(amount * atMultiplier);
    setCashedOut(true);
    setCashoutAt(atMultiplier);
    clearBet();
    const { updateBalance, addXp } = walletRef.current;
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${atMultiplier.toFixed(2)}x`);
    await addXp(Math.floor(winnings / 20));
    if (roundObj?.id && walletRef.current.user?.email) {
      try {
        const fresh = await base44.entities.CrashRound.list('-created_date', 5);
        const latest = fresh?.find(x => x.id === roundObj.id);
        if (latest) {
          const bets = (latest.bets || []).map(b =>
            b.user_email === walletRef.current.user.email
              ? { ...b, cashed_out_at: atMultiplier, profit: winnings } : b
          );
          await base44.entities.CrashRound.update(roundObj.id, { bets });
        }
      } catch {}
    }
  }

  function processLoss() {
    if (betProcessedRef.current || !myBetRoundIdRef.current) return;
    betProcessedRef.current = true;
    clearBet();
  }

  function startAnimation(crashPoint, runStartTime) {
    stopAnimation();
    const origin = runStartTime || Date.now();
    const tick = () => {
      const elapsed = (Date.now() - origin) / 1000;
      const cur = calcMultiplier(elapsed);
      multiplierRef.current = cur;
      setMultiplier(cur);
      const ac = parseFloat(autoCashoutRef.current);
      if (!isNaN(ac) && ac >= 1.01 && cur >= ac
        && myBetRoundIdRef.current === roundRef.current?.id
        && !cashedOutRef.current) {
        processCashout(Math.min(ac, cur), roundRef.current);
      }
      if (cur >= crashPoint) {
        setMultiplier(crashPoint);
        multiplierRef.current = crashPoint;
        stopAnimation();
        const r = roundRef.current;
        if (r?.id) base44.entities.CrashRound.update(r.id, { status: 'crashed' }).catch(() => {});
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    const saved = loadBet();
    if (saved) {
      myBetRoundIdRef.current = saved.roundId;
      myBetAmountRef.current = saved.amount;
      setMyBetRoundId(saved.roundId);
      setMyBetAmount(saved.amount);
      if (saved.autoCashout) { autoCashoutRef.current = saved.autoCashout; setAutoCashout(saved.autoCashout); }
    }
  }, []);

  useEffect(() => {
    let destroyed = false;
    async function sync() {
      if (destroyed) return;
      try {
        const rounds = await base44.entities.CrashRound.list('-created_date', 1);
        if (destroyed) return;
        const r = rounds?.[0];
        if (!r) {
          if (!creatingRef.current) {
            creatingRef.current = true;
            try {
              const nr = await base44.entities.CrashRound.create({ crash_point: generateCrashPoint(), status: 'betting', bets: [], start_time: Date.now() });
              if (!destroyed) { roundRef.current = nr; setRoundId(nr.id); phaseRef.current = 'betting'; setPhase('betting'); setCountdown(BETTING_DURATION); setLiveBets([]); }
            } finally { creatingRef.current = false; }
          }
          return;
        }
        const isNewRound = roundRef.current?.id !== r.id;
        if (isNewRound) {
          stopAnimation(); crashedAtRef.current = null; creatingRef.current = false;
          roundRef.current = r; setRoundId(r.id); setMultiplier(1.0); multiplierRef.current = 1.0;
          if (myBetRoundIdRef.current && myBetRoundIdRef.current !== r.id) {
            myBetRoundIdRef.current = null; myBetAmountRef.current = 0; betProcessedRef.current = false; cashedOutRef.current = false;
            setMyBetRoundId(null); setMyBetAmount(0); setCashedOut(false); setCashoutAt(null); clearBet();
          }
        } else { roundRef.current = r; }
        setLiveBets(r.bets || []);
        const now = Date.now();
        if (r.status === 'betting') {
          const elapsed = (now - (r.start_time || now)) / 1000;
          if (elapsed >= BETTING_DURATION) {
            if (!r.run_start_time) await base44.entities.CrashRound.update(r.id, { status: 'running', run_start_time: Date.now() });
            else await base44.entities.CrashRound.update(r.id, { status: 'running' });
            return;
          }
          if (phaseRef.current !== 'betting') { phaseRef.current = 'betting'; setPhase('betting'); stopAnimation(); cashedOutRef.current = false; betProcessedRef.current = false; setCashedOut(false); setCashoutAt(null); }
          setCountdown(Math.max(0, BETTING_DURATION - Math.floor(elapsed)));
        } else if (r.status === 'running') {
          if (phaseRef.current !== 'running') { phaseRef.current = 'running'; setPhase('running'); startAnimation(r.crash_point, r.run_start_time); }
          if (myBetRoundIdRef.current === r.id && !cashedOutRef.current && !betProcessedRef.current) {
            const myBet = (r.bets || []).find(b => b.user_email === walletRef.current.user?.email);
            if (myBet?.cashed_out_at) { cashedOutRef.current = true; betProcessedRef.current = true; setCashedOut(true); setCashoutAt(myBet.cashed_out_at); clearBet(); }
          }
        } else if (r.status === 'crashed') {
          if (phaseRef.current !== 'crashed') {
            phaseRef.current = 'crashed'; setPhase('crashed'); setMultiplier(r.crash_point); multiplierRef.current = r.crash_point; stopAnimation();
            crashedAtRef.current = now;
            historyRef.current = [r.crash_point, ...historyRef.current].slice(0, 20);
            setHistory([...historyRef.current]); localStorage.setItem('crash_history', JSON.stringify(historyRef.current));
            if (myBetRoundIdRef.current === r.id && !betProcessedRef.current) {
              const myBet = (r.bets || []).find(b => b.user_email === walletRef.current.user?.email);
              if (myBet?.cashed_out_at) { cashedOutRef.current = true; betProcessedRef.current = true; setCashedOut(true); setCashoutAt(myBet.cashed_out_at); clearBet(); }
              else if (!cashedOutRef.current) {
                const ac = parseFloat(autoCashoutRef.current);
                if (!isNaN(ac) && ac >= 1.01 && ac <= r.crash_point) await processCashout(ac, r);
                else processLoss();
              }
            }
          }
          const crashedAgo = now - (crashedAtRef.current || now);
          if (crashedAgo >= CRASHED_DISPLAY_DURATION && !creatingRef.current) {
            creatingRef.current = true;
            try { await base44.entities.CrashRound.create({ crash_point: generateCrashPoint(), status: 'betting', bets: [], start_time: Date.now() }); }
            finally { creatingRef.current = false; }
          }
        }
      } catch (err) { console.error('[Crash] sync error:', err); creatingRef.current = false; }
    }
    sync();
    const interval = setInterval(sync, 1000);
    return () => { destroyed = true; clearInterval(interval); stopAnimation(); };
  }, []);

  const handlePlaceBet = async () => {
    if (!canBet || !roundRef.current?.id || !user) return;
    const rid = roundRef.current.id; const amt = betAmount; const ac = autoCashout;
    myBetRoundIdRef.current = rid; myBetAmountRef.current = amt; betProcessedRef.current = false; cashedOutRef.current = false;
    setMyBetRoundId(rid); setMyBetAmount(amt);
    saveBet({ roundId: rid, amount: amt, autoCashout: ac });
    await updateBalance(-amt, 'crash_bet', `Crash bet ${amt}`);
    addRakeback(amt);
    try {
      const freshUser = await base44.auth.me().catch(() => user);
      const fresh = await base44.entities.CrashRound.list('-created_date', 1);
      const latest = fresh?.find(x => x.id === rid);
      if (latest) {
        const avatarUrl = freshUser?.avatar_url && freshUser.avatar_url !== 'null' ? freshUser.avatar_url : null;
        const bets = [...(latest.bets || []), {
          user_email: freshUser?.email || user.email,
          user_name: freshUser?.username || freshUser?.full_name || 'Player',
          avatar_url: avatarUrl, amount: amt,
          auto_cashout: parseFloat(ac) >= 1.01 ? parseFloat(ac) : null,
          cashed_out_at: null, profit: null,
        }];
        await base44.entities.CrashRound.update(rid, { bets });
      }
    } catch {}
  };

  const handleManualCashout = () => { if (!canCashout) return; processCashout(multiplierRef.current, roundRef.current); };

  const avatarCacheRef = useRef({});
  useEffect(() => {
    if (!liveBets || liveBets.length === 0) { setEnrichedBets([]); return; }
    const applyCache = (bets) => bets.map(b => { const c = avatarCacheRef.current[b.user_email]; return c ? { ...b, ...c } : b; });
    setEnrichedBets(applyCache(liveBets));
    const uncached = liveBets.filter(b => b.user_email && !b.user_email.startsWith('bot_') && !avatarCacheRef.current[b.user_email]).map(b => b.user_email);
    if (uncached.length === 0) return;
    base44.functions.invoke('getUserAvatars', { emails: uncached }).then(res => {
      const map = res?.data?.users || {};
      Object.entries(map).forEach(([email, info]) => { if (info) avatarCacheRef.current[email] = { avatar_url: info.avatar_url || null, user_name: info.username || null }; });
      setEnrichedBets(prev => applyCache(prev));
    }).catch(() => {});
  }, [liveBets]);

  const crashed = phase === 'crashed';
  const running = phase === 'running';
  const betting = phase === 'betting';
  const showLost = crashed && hasBet && !cashedOut && betProcessedRef.current;
  const showCashedOut = cashedOut && cashoutAt !== null && myBetRoundId === roundId;

  /* ── Multiplier color ── */
  const multColor = crashed ? '#ef4444' : multiplier < 2 ? '#fbbf24' : multiplier < 5 ? '#f97316' : '#a855f7';

  return (
    <div className="cr" style={{ background:'#04000a', minHeight:'100vh', marginLeft:-24, marginRight:-24, padding:'22px 18px 80px' }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:'linear-gradient(135deg,rgba(251,191,36,.2),rgba(168,85,247,.2))',
            border:'1px solid rgba(251,191,36,.22)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Rocket style={{ width:14, height:14, color:'#fbbf24' }} />
          </div>
          <div>
            <h1 style={{
              margin:0, fontSize:20, fontWeight:900, lineHeight:1,
              background:'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc 75%,#a855f7)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>Crash</h1>
            <p style={{ margin:0, fontSize:10, color:'rgba(251,191,36,.4)', fontWeight:600 }}>
              Cash out before it crashes!
            </p>
          </div>
        </div>
        <div style={{ height:2, borderRadius:2, background:'linear-gradient(90deg,#fbbf24,#a855f7,transparent)', width:130 }} />
      </motion.div>

      {/* ── History strip ── */}
      {history.length > 0 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
          {history.map((h, i) => (
            <div key={i} className="history-in" style={{
              flexShrink:0, padding:'3px 10px', borderRadius:8,
              fontSize:11, fontWeight:800,
              background: h < 2 ? 'rgba(239,68,68,.12)' : h < 5 ? 'rgba(251,191,36,.12)' : 'rgba(168,85,247,.15)',
              border: `1px solid ${h < 2 ? 'rgba(239,68,68,.25)' : h < 5 ? 'rgba(251,191,36,.25)' : 'rgba(168,85,247,.3)'}`,
              color: h < 2 ? '#f87171' : h < 5 ? '#fbbf24' : '#c084fc',
            }}>
              {h.toFixed(2)}x
            </div>
          ))}
        </div>
      )}

      {/* ── Main panel ── */}
      <div className="gold-glow" style={{
        position:'relative', overflow:'hidden', borderRadius:16,
        background:'linear-gradient(180deg,#0a0018 0%,#060010 100%)',
        border:'1px solid rgba(251,191,36,.1)',
        marginBottom:12,
      }}>
        <div className="scan" />

        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)', zIndex:3 }} />

        {/* Graph area */}
        <div style={{ position:'relative', height:200, overflow:'hidden' }}>
          {/* Ambient glow */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background: crashed
              ? 'radial-gradient(ellipse 60% 40% at 50% 100%,rgba(239,68,68,.08) 0%,transparent 70%)'
              : 'radial-gradient(ellipse 60% 40% at 50% 100%,rgba(251,191,36,.06) 0%,transparent 70%)',
            transition:'background 1s',
          }} />

          {/* Grid dots */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)',
            backgroundSize:'28px 28px',
          }} />

          {(running || crashed) && (
            <CrashGraph phase={phase} multiplier={multiplier} crashPoint={roundRef.current?.crash_point || 2} />
          )}

          {/* Center display */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>

            {phase === 'loading' && (
              <div style={{ position:'relative', width:36, height:36 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #fbbf24', animation:'spin-loader 1s linear infinite' }} />
                <div style={{ position:'absolute', inset:5, borderRadius:'50%', border:'2px solid #a855f7', animation:'spin-loader .7s linear infinite reverse' }} />
              </div>
            )}

            {betting && (
              <div style={{ textAlign:'center' }}>
                <div style={{ marginBottom:10 }}>
                  <Rocket className="rocket-fly" style={{ width:32, height:32, color:'rgba(251,191,36,.4)', margin:'0 auto 8px', display:'block' }} />
                </div>
                <p style={{ margin:'0 0 4px', fontSize:9, fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(251,191,36,.4)' }}>
                  NEXT ROUND IN
                </p>
                <p style={{ margin:0, fontSize:56, fontWeight:900, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                  {countdown}<span style={{ fontSize:24, color:'rgba(255,255,255,.4)' }}>s</span>
                </p>
                {hasBet && (
                  <div className="bet-badge" style={{
                    marginTop:10, display:'inline-flex', alignItems:'center', gap:6,
                    padding:'5px 14px', borderRadius:100,
                    background:'rgba(251,191,36,.12)', border:'1px solid rgba(251,191,36,.3)',
                  }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 6px #fbbf24' }} />
                    <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24' }}>
                      Bet placed — {myBetAmount.toLocaleString()} coins
                    </span>
                  </div>
                )}
              </div>
            )}

            {(running || crashed) && (
              <div style={{ textAlign:'center' }}>
                <motion.p
                  className={running ? 'mult-glow' : crashed ? 'crash-shake' : ''}
                  key={crashed ? 'crashed' : 'running'}
                  initial={{ scale:.8 }} animate={{ scale:1 }}
                  style={{
                    margin:0, fontSize:64, fontWeight:900, lineHeight:1,
                    color: multColor,
                    fontVariantNumeric:'tabular-nums',
                    textShadow:`0 0 40px ${multColor}80`,
                    transition:'color .3s',
                  }}>
                  {multiplier.toFixed(2)}x
                </motion.p>
                {crashed && (
                  <motion.p initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    style={{ margin:'6px 0 0', fontSize:13, fontWeight:900, letterSpacing:'.2em', textTransform:'uppercase', color:'#ef4444' }}>
                    CRASHED!
                  </motion.p>
                )}
                {showCashedOut && (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    style={{
                      marginTop:10, display:'inline-flex', alignItems:'center', gap:6,
                      padding:'5px 14px', borderRadius:100,
                      background:'rgba(251,191,36,.12)', border:'1px solid rgba(251,191,36,.3)',
                    }}>
                    <ArrowUp style={{ width:12, height:12, color:'#fbbf24' }} />
                    <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24' }}>
                      Cashed @ {cashoutAt.toFixed(2)}x
                    </span>
                  </motion.div>
                )}
                {showLost && (
                  <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ margin:'8px 0 0', fontSize:12, fontWeight:700, color:'rgba(239,68,68,.7)' }}>
                    Lost {myBetAmount.toLocaleString()} coins
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{
          padding:'14px 16px 16px',
          borderTop:'1px solid rgba(251,191,36,.08)',
          background:'rgba(0,0,0,.3)',
        }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>

            {/* Bet amount */}
            <div style={{ flex:1, minWidth:120 }}>
              <p style={{ margin:'0 0 5px', fontSize:10, fontWeight:700, color:'rgba(251,191,36,.5)', letterSpacing:'.06em' }}>BET AMOUNT</p>
              <div style={{ display:'flex', gap:5 }}>
                <div style={{ position:'relative', flex:1 }}>
                  <div style={{
                    position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
                    width:14, height:14, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    pointerEvents:'none',
                  }}>
                    <span style={{ fontSize:7, fontWeight:900, color:'#000' }}>$</span>
                  </div>
                  <input
                    type="number" value={betAmount} min={1}
                    onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))}
                    disabled={phase !== 'betting' || hasBet}
                    style={{
                      width:'100%', height:38, paddingLeft:30, paddingRight:10,
                      background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.18)',
                      borderRadius:9, outline:'none', fontSize:13, fontWeight:800,
                      fontFamily:'Nunito,sans-serif', color:'#fbbf24', boxSizing:'border-box',
                    }}
                  />
                </div>
                {[['½', () => setBetAmount(b => Math.max(1, Math.floor(b/2)))], ['2x', () => setBetAmount(b => b*2)], ['Max', () => setBetAmount(balance)]].map(([l, fn]) => (
                  <button key={l} onClick={fn} disabled={phase !== 'betting' || hasBet}
                    style={{
                      height:38, padding:'0 10px', borderRadius:9, border:'1px solid rgba(251,191,36,.18)',
                      background:'rgba(251,191,36,.08)', color:'rgba(251,191,36,.7)',
                      fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer',
                      transition:'all .2s',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto cashout */}
            <div style={{ width:110 }}>
              <p style={{ margin:'0 0 5px', fontSize:10, fontWeight:700, color:'rgba(168,85,247,.5)', letterSpacing:'.06em' }}>AUTO CASHOUT</p>
              <input
                type="number" step="0.1" placeholder="e.g. 2.0" value={autoCashout} min={1.01}
                onChange={e => setAutoCashout(e.target.value)}
                disabled={hasBet && phase === 'running'}
                style={{
                  width:'100%', height:38, padding:'0 10px',
                  background:'rgba(168,85,247,.08)', border:'1px solid rgba(168,85,247,.2)',
                  borderRadius:9, outline:'none', fontSize:12, fontWeight:700,
                  fontFamily:'Nunito,sans-serif', color:'rgba(192,132,252,.9)', boxSizing:'border-box',
                }}
              />
            </div>

            {/* Action button */}
            <div style={{ flexShrink:0 }}>
              {canCashout ? (
                <button className="btn-gold" onClick={handleManualCashout} style={{
                  height:38, padding:'0 18px', borderRadius:9, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000',
                  fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif',
                  boxShadow:'0 0 24px rgba(251,191,36,.4)',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                  <ArrowUp style={{ width:14, height:14 }} />
                  {Math.floor(myBetAmount * multiplier).toLocaleString()}
                </button>
              ) : (
                <button className="btn-gold" onClick={handlePlaceBet} disabled={!canBet} style={{
                  height:38, padding:'0 18px', borderRadius:9, border:'none',
                  cursor: canBet ? 'pointer' : 'not-allowed',
                  background: canBet ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.06)',
                  border: canBet ? 'none' : '1px solid rgba(255,255,255,.08)',
                  color: canBet ? '#000' : 'rgba(255,255,255,.25)',
                  fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif',
                  boxShadow: canBet ? '0 0 24px rgba(251,191,36,.35)' : 'none',
                  display:'flex', alignItems:'center', gap:6, transition:'all .3s',
                }}>
                  <Zap style={{ width:13, height:13 }} />
                  {hasBet ? '✓ Placed' : phase === 'running' ? 'In Progress' : phase === 'crashed' ? 'Next Round' : 'Place Bet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Bets ── */}
      {enrichedBets.length > 0 && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:14,
            background:'linear-gradient(145deg,#07000f,#0e001a)',
            border:'1px solid rgba(251,191,36,.08)',
            boxShadow:'0 8px 32px rgba(0,0,0,.6)',
          }}>
          <div className="scan" />

          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 14px 10px',
            borderBottom:'1px solid rgba(251,191,36,.07)',
          }}>
            <div style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#a855f7)' }} />
            <Users style={{ width:13, height:13, color:'#fbbf24' }} />
            <span style={{ fontSize:13, fontWeight:900, color:'rgba(255,255,255,.7)' }}>Live Bets</span>
            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'rgba(251,191,36,.4)', background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.15)', borderRadius:100, padding:'1px 8px' }}>
              {enrichedBets.length}
            </span>
          </div>

          {/* Bets list */}
          <div style={{ maxHeight:180, overflowY:'auto' }}>
            {enrichedBets.map((b, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 14px',
                  borderBottom:'1px solid rgba(255,255,255,.03)',
                }}>
                {/* Avatar */}
                <div style={{
                  width:26, height:26, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                  background:'rgba(168,85,247,.15)', border:'1px solid rgba(168,85,247,.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:800, color:'#c084fc',
                }}>
                  {safeAvatarUrl(b.avatar_url)
                    ? <img src={safeAvatarUrl(b.avatar_url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : (b.user_name?.[0]?.toUpperCase() || '?')}
                </div>

                <span style={{ flex:1, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {b.user_name || 'Player'}
                </span>

                {/* Bet amount */}
                <span style={{ fontSize:11, fontWeight:800, color:'#fbbf24' }}>
                  {b.amount?.toLocaleString()}
                </span>

                {/* Status */}
                {b.cashed_out_at ? (
                  <span style={{
                    fontSize:10, fontWeight:800, color:'#fbbf24',
                    background:'rgba(251,191,36,.12)', border:'1px solid rgba(251,191,36,.25)',
                    borderRadius:100, padding:'1px 8px',
                  }}>{b.cashed_out_at.toFixed(2)}x</span>
                ) : crashed ? (
                  <span style={{
                    fontSize:10, fontWeight:800, color:'#f87171',
                    background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)',
                    borderRadius:100, padding:'1px 8px',
                  }}>Lost</span>
                ) : (
                  <span style={{
                    fontSize:10, fontWeight:800, color:'rgba(255,255,255,.3)',
                    background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.07)',
                    borderRadius:100, padding:'1px 8px',
                  }}>{running ? `${multiplier.toFixed(2)}x` : 'Ready'}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}