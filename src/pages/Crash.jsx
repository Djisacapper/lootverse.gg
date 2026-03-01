import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion } from 'framer-motion';
import { Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BETTING_DURATION = 30; // seconds
const CRASHED_DISPLAY_DURATION = 5000; // ms before next round

function generateCrashPoint() {
  const r = Math.random();
  return Math.max(1.01, Math.floor((1 / (1 - 0.04) / r) * 100) / 100);
}

function mColor(m, crashed) {
  if (crashed) return '#ef4444';
  if (m < 2) return '#4ade80';
  if (m < 5) return '#f59e0b';
  return '#f97316';
}

// Deterministic multiplier from elapsed seconds
function calcMultiplier(elapsedSec) {
  return Math.max(1.0, Math.floor(Math.pow(Math.E, elapsedSec * 0.15) * 100) / 100);
}

// Persist user bet across navigation
const BET_KEY = 'crash_bet';
function saveBet(data) { localStorage.setItem(BET_KEY, JSON.stringify(data)); }
function loadBet() { try { return JSON.parse(localStorage.getItem(BET_KEY)); } catch { return null; } }
function clearBet() { localStorage.removeItem(BET_KEY); }

export default function Crash() {
  const { user, balance, updateBalance, addXp, addRakeback } = useWallet();

  // ── UI State ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('loading');      // loading|betting|running|crashed
  const [countdown, setCountdown] = useState(BETTING_DURATION);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crash_history') || '[]'); } catch { return []; }
  });
  const [liveBets, setLiveBets] = useState([]);
  const [enrichedBets, setEnrichedBets] = useState([]);
  const [roundId, setRoundId] = useState(null);       // current round id shown in UI

  // Bet UI state
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState('');
  const [myBetRoundId, setMyBetRoundId] = useState(null);   // which round I bet on
  const [myBetAmount, setMyBetAmount] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(null);

  // Derived
  const hasBet = myBetRoundId !== null && myBetRoundId === roundId;
  const canBet = phase === 'betting' && !hasBet && betAmount > 0 && betAmount <= balance;
  const canCashout = phase === 'running' && hasBet && !cashedOut;

  // ── Stable Refs (never cause re-renders, safe in setInterval/RAF) ─────────
  const phaseRef = useRef('loading');
  const roundRef = useRef(null);              // full round object from DB
  const multiplierRef = useRef(1.0);
  const animRef = useRef(null);
  const creatingRef = useRef(false);
  const crashedAtRef = useRef(null);          // local timestamp when crashed phase entered
  const historyRef = useRef((() => { try { return JSON.parse(localStorage.getItem('crash_history') || '[]'); } catch { return []; } })());

  // Bet refs
  const myBetRoundIdRef = useRef(null);
  const myBetAmountRef = useRef(0);
  const autoCashoutRef = useRef('');
  const cashedOutRef = useRef(false);
  const betProcessedRef = useRef(false);      // guard against double cashout/loss

  // Wallet ref (avoid stale closure in RAF)
  const walletRef = useRef({ user, updateBalance, addXp, balance });
  walletRef.current = { user, updateBalance, addXp, balance };

  // Sync display refs
  autoCashoutRef.current = autoCashout;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function stopAnimation() {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }

  async function processCashout(atMultiplier, roundObj) {
    if (cashedOutRef.current) return;
    if (betProcessedRef.current) return;
    if (myBetRoundIdRef.current !== roundObj?.id) return;

    cashedOutRef.current = true;
    betProcessedRef.current = true;
    const amount = myBetAmountRef.current;
    const winnings = Math.floor(amount * atMultiplier);

    setCashedOut(true);
    setCashoutAt(atMultiplier);
    clearBet();

    const { updateBalance, addXp, user } = walletRef.current;
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${atMultiplier.toFixed(2)}x`);
    await addXp(Math.floor(winnings / 20));

    if (roundObj?.id && user?.email) {
      try {
        const fresh = await base44.entities.CrashRound.list('-created_date', 5);
        const latest = fresh?.find(x => x.id === roundObj.id);
        if (latest) {
          const bets = (latest.bets || []).map(b =>
            b.user_email === user.email
              ? { ...b, cashed_out_at: atMultiplier, profit: winnings }
              : b
          );
          await base44.entities.CrashRound.update(roundObj.id, { bets });
        }
      } catch {}
    }
  }

  function processLoss() {
    if (betProcessedRef.current) return;
    if (!myBetRoundIdRef.current) return;
    betProcessedRef.current = true;
    clearBet();
    // No balance deduction needed — it was already deducted when placing the bet
  }

  function startAnimation(crashPoint, runStartTime) {
    stopAnimation();
    // runStartTime is stored in DB — use it so all clients are in sync
    const origin = runStartTime || Date.now();

    const tick = () => {
      const elapsed = (Date.now() - origin) / 1000;
      const cur = calcMultiplier(elapsed);
      multiplierRef.current = cur;
      setMultiplier(cur);

      // Auto cashout
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
        // Mark crashed in DB (any client can do this — update is idempotent)
        const r = roundRef.current;
        if (r?.id) {
          base44.entities.CrashRound.update(r.id, { status: 'crashed' }).catch(() => {});
        }
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  // ── Load persisted bet on mount ───────────────────────────────────────────
  useEffect(() => {
    const saved = loadBet();
    if (saved) {
      myBetRoundIdRef.current = saved.roundId;
      myBetAmountRef.current = saved.amount;
      setMyBetRoundId(saved.roundId);
      setMyBetAmount(saved.amount);
      if (saved.autoCashout) {
        autoCashoutRef.current = saved.autoCashout;
        setAutoCashout(saved.autoCashout);
      }
    }
  }, []);

  // ── Main polling loop ─────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    async function sync() {
      if (destroyed) return;
      try {
        const rounds = await base44.entities.CrashRound.list('-created_date', 1);
        if (destroyed) return;

        const r = rounds?.[0];

        // ── No round exists → create one ──────────────────────────────────
        if (!r) {
          if (!creatingRef.current) {
            creatingRef.current = true;
            try {
              const nr = await base44.entities.CrashRound.create({
                crash_point: generateCrashPoint(),
                status: 'betting',
                bets: [],
                start_time: Date.now(),
              });
              if (!destroyed) {
                roundRef.current = nr;
                setRoundId(nr.id);
                phaseRef.current = 'betting';
                setPhase('betting');
                setCountdown(BETTING_DURATION);
                setLiveBets([]);
              }
            } finally {
              creatingRef.current = false;
            }
          }
          return;
        }

        // ── Round changed (new round started) ─────────────────────────────
        const isNewRound = roundRef.current?.id !== r.id;
        if (isNewRound) {
          stopAnimation();
          crashedAtRef.current = null;
          creatingRef.current = false;
          roundRef.current = r;
          setRoundId(r.id);
          setMultiplier(1.0);
          multiplierRef.current = 1.0;

          // If old persisted bet was on a DIFFERENT round → it's gone, clear it
          if (myBetRoundIdRef.current && myBetRoundIdRef.current !== r.id) {
            myBetRoundIdRef.current = null;
            myBetAmountRef.current = 0;
            betProcessedRef.current = false;
            cashedOutRef.current = false;
            setMyBetRoundId(null);
            setMyBetAmount(0);
            setCashedOut(false);
            setCashoutAt(null);
            clearBet();
          }
        } else {
          roundRef.current = r;
        }

        setLiveBets(r.bets || []);
        const now = Date.now();

        // ── BETTING phase ─────────────────────────────────────────────────
        if (r.status === 'betting') {
          const startMs = r.start_time || now;
          const elapsed = (now - startMs) / 1000;

          if (elapsed >= BETTING_DURATION) {
            // Only transition once — guard against multiple clients overwriting run_start_time
            if (!r.run_start_time) {
              await base44.entities.CrashRound.update(r.id, {
                status: 'running',
                run_start_time: Date.now(),
              });
            } else {
              await base44.entities.CrashRound.update(r.id, { status: 'running' });
            }
            return;
          }

          if (phaseRef.current !== 'betting') {
            phaseRef.current = 'betting';
            setPhase('betting');
            stopAnimation();
            // Reset cashout state for new betting phase
            cashedOutRef.current = false;
            betProcessedRef.current = false;
            setCashedOut(false);
            setCashoutAt(null);
          }
          setCountdown(Math.max(0, BETTING_DURATION - Math.floor(elapsed)));

        // ── RUNNING phase ─────────────────────────────────────────────────
        } else if (r.status === 'running') {
          if (phaseRef.current !== 'running') {
            phaseRef.current = 'running';
            setPhase('running');
            // Always use the DB-stored run_start_time so the multiplier is correct
            // even if the player navigated away and came back mid-round
            startAnimation(r.crash_point, r.run_start_time);
          }

          // If returning player: check if already cashed out in DB
          if (myBetRoundIdRef.current === r.id && !cashedOutRef.current && !betProcessedRef.current) {
            const myBet = (r.bets || []).find(b => b.user_email === walletRef.current.user?.email);
            if (myBet?.cashed_out_at) {
              cashedOutRef.current = true;
              betProcessedRef.current = true;
              setCashedOut(true);
              setCashoutAt(myBet.cashed_out_at);
              clearBet();
            }
          }

        // ── CRASHED phase ─────────────────────────────────────────────────
        } else if (r.status === 'crashed') {
          if (phaseRef.current !== 'crashed') {
            phaseRef.current = 'crashed';
            setPhase('crashed');
            setMultiplier(r.crash_point);
            multiplierRef.current = r.crash_point;
            stopAnimation();
            crashedAtRef.current = now;
            historyRef.current = [r.crash_point, ...historyRef.current].slice(0, 20);
            setHistory([...historyRef.current]);
            localStorage.setItem('crash_history', JSON.stringify(historyRef.current));

            // Settle bet for returning players
            if (myBetRoundIdRef.current === r.id && !betProcessedRef.current) {
              const myBet = (r.bets || []).find(b => b.user_email === walletRef.current.user?.email);
              if (myBet?.cashed_out_at) {
                // Already cashed out (another tab or was running when they left)
                cashedOutRef.current = true;
                betProcessedRef.current = true;
                setCashedOut(true);
                setCashoutAt(myBet.cashed_out_at);
                clearBet();
              } else if (!cashedOutRef.current) {
                // Check auto-cashout: if target was below crash point, honor it
                const ac = parseFloat(autoCashoutRef.current);
                if (!isNaN(ac) && ac >= 1.01 && ac <= r.crash_point) {
                  await processCashout(ac, r);
                } else {
                  // Player lost
                  processLoss();
                }
              }
            }
          }

          // Create next round after display duration
          const crashedAgo = now - (crashedAtRef.current || now);
          if (crashedAgo >= CRASHED_DISPLAY_DURATION && !creatingRef.current) {
            creatingRef.current = true;
            try {
              await base44.entities.CrashRound.create({
                crash_point: generateCrashPoint(),
                status: 'betting',
                bets: [],
                start_time: Date.now(),
              });
            } finally {
              creatingRef.current = false;
            }
          }
        }
      } catch (err) {
        console.error('[Crash] sync error:', err);
        creatingRef.current = false;
      }
    }

    sync();
    const interval = setInterval(sync, 1000);

    return () => {
      destroyed = true;
      clearInterval(interval);
      stopAnimation();
    };
  }, []); // Empty deps — everything is via refs. No stale closure issues.

  // ── Actions ───────────────────────────────────────────────────────────────

  const handlePlaceBet = async () => {
    if (!canBet || !roundRef.current?.id || !user) return;
    const rid = roundRef.current.id;
    const amt = betAmount;
    const ac = autoCashout;

    // Optimistic local state
    myBetRoundIdRef.current = rid;
    myBetAmountRef.current = amt;
    betProcessedRef.current = false;
    cashedOutRef.current = false;
    setMyBetRoundId(rid);
    setMyBetAmount(amt);
    saveBet({ roundId: rid, amount: amt, autoCashout: ac });

    await updateBalance(-amt, 'crash_bet', `Crash bet ${amt}`);
    addRakeback(amt);

    try {
      // Always fetch fresh user so avatar_url is current
      const freshUser = await base44.auth.me().catch(() => user);
      const fresh = await base44.entities.CrashRound.list('-created_date', 1);
      const latest = fresh?.find(x => x.id === rid);
      if (latest) {
        const avatarUrl = freshUser?.avatar_url && freshUser.avatar_url !== 'null' ? freshUser.avatar_url : null;
        const bets = [...(latest.bets || []), {
          user_email: freshUser?.email || user.email,
          user_name: freshUser?.username || freshUser?.full_name || 'Player',
          avatar_url: avatarUrl,
          amount: amt,
          auto_cashout: parseFloat(ac) >= 1.01 ? parseFloat(ac) : null,
          cashed_out_at: null,
          profit: null,
        }];
        await base44.entities.CrashRound.update(rid, { bets });
      }
    } catch {}
  };

  const handleManualCashout = () => {
    if (!canCashout) return;
    processCashout(multiplierRef.current, roundRef.current);
  };

  // ── Enrich live bets with fresh avatar/username from DB ──────────────────
  useEffect(() => {
    if (!liveBets || liveBets.length === 0) { setEnrichedBets([]); return; }
    setEnrichedBets(liveBets); // show immediately with existing data

    const realEmails = liveBets
      .filter(b => b.user_email && !b.user_email.startsWith('bot_'))
      .map(b => b.user_email);

    if (realEmails.length === 0) return;

    base44.functions.invoke('getUserAvatars', { emails: realEmails })
      .then(res => {
        const map = res?.data?.users || {};
        setEnrichedBets(prev => prev.map(b => {
          const info = map[b.user_email];
          if (!info) return b;
          return {
            ...b,
            avatar_url: info.avatar_url || b.avatar_url,
            user_name: info.username || b.user_name,
          };
        }));
      })
      .catch(() => {});
  }, [liveBets]);

  // ── Derived display ────────────────────────────────────────────────────────
  const col = mColor(multiplier, phase === 'crashed');
  const showLost = phase === 'crashed' && hasBet && !cashedOut && betProcessedRef.current;
  const showCashedOut = cashedOut && cashoutAt !== null && myBetRoundId === roundId;
  const displayBetAmount = hasBet ? myBetAmount : betAmount;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Crash</h1>
        <p className="text-white/40 text-sm">Place bets before launch — cash out before it crashes!</p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {history.map((h, i) => (
            <div key={i} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold
              ${h < 2 ? 'bg-red-500/10 text-red-400' : h < 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
              {h.toFixed(2)}x
            </div>
          ))}
        </div>
      )}

      {/* Main Display */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="relative h-60 md:h-72 flex items-center justify-center bg-gradient-to-b from-[#0a0a14] to-[#0e0e1c]">
          <div className="absolute inset-0 flex items-end pointer-events-none">
            <motion.div className="w-full rounded-t-2xl"
              animate={{
                height: phase === 'running' ? `${Math.min((multiplier - 1) * 8, 90)}%` : '0%',
                backgroundColor: phase === 'crashed' ? 'rgba(239,68,68,0.07)' : 'rgba(74,222,128,0.06)',
              }}
              transition={{ duration: 0.15 }}
            />
          </div>

          <div className="relative z-10 text-center px-4">
            {phase === 'loading' && (
              <p className="text-white/30 text-sm animate-pulse">Connecting...</p>
            )}

            {phase === 'betting' && (
              <div className="flex flex-col items-center gap-3">
                <Rocket className="w-10 h-10 text-white/20 animate-bounce" />
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Next round starts in</p>
                  <p className="text-6xl font-black text-white tabular-nums">{countdown}s</p>
                </div>
                {hasBet && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                    <p className="text-green-400 text-sm font-bold">✓ Bet placed — {myBetAmount.toLocaleString()} coins</p>
                  </motion.div>
                )}
              </div>
            )}

            {(phase === 'running' || phase === 'crashed') && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-7xl md:text-8xl font-black leading-none tabular-nums" style={{ color: col }}>
                  {multiplier.toFixed(2)}x
                </p>
                {phase === 'crashed' && (
                  <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-red-400 text-xl font-black tracking-widest">CRASHED!</motion.p>
                )}
                {showCashedOut && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                    <p className="text-green-400 text-sm font-bold">
                      Cashed out @ {cashoutAt.toFixed(2)}x — +{Math.floor(displayBetAmount * cashoutAt).toLocaleString()} coins!
                    </p>
                  </motion.div>
                )}
                {showLost && (
                  <p className="text-red-400/70 text-sm font-semibold">Lost {displayBetAmount.toLocaleString()} coins</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0">
              <label className="text-xs text-white/40 mb-1.5 block">Bet Amount</label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  disabled={phase !== 'betting' || hasBet}
                  className="bg-white/5 border-white/10 text-white rounded-xl flex-1 min-w-0"
                  min={1}
                />
                <button
                  onClick={() => setBetAmount(b => Math.max(1, Math.floor(b / 2)))}
                  disabled={phase !== 'betting' || hasBet}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >½</button>
                <button
                  onClick={() => setBetAmount(balance)}
                  disabled={phase !== 'betting' || hasBet}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/30 text-violet-300 hover:text-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >Max</button>
              </div>
            </div>

            <div className="w-32 flex-shrink-0">
              <label className="text-xs text-white/40 mb-1.5 block">Auto Cashout</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 2.0"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                disabled={hasBet && phase === 'running'}
                className="bg-white/5 border-white/10 text-white rounded-xl"
                min={1.01}
              />
            </div>

            <div className="flex-shrink-0">
              {canCashout ? (
                <Button onClick={handleManualCashout}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl h-10 px-6 font-bold w-full sm:w-auto">
                  Cash Out ({Math.floor(myBetAmount * multiplier).toLocaleString()})
                </Button>
              ) : (
                <Button onClick={handlePlaceBet} disabled={!canBet}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl h-10 px-6 font-bold disabled:opacity-40 w-full sm:w-auto">
                  {hasBet ? '✓ Bet Placed'
                    : phase === 'running' ? 'In Progress...'
                    : phase === 'crashed' ? 'Next Round...'
                    : 'Place Bet'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Bets */}
      {liveBets.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Users className="w-4 h-4 text-white/40" />
            <p className="text-sm font-semibold text-white/60">Live Bets</p>
            <span className="ml-auto text-xs text-white/30">{liveBets.length} player{liveBets.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-white/[0.03] max-h-48 overflow-y-auto">
            {liveBets.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 overflow-hidden flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                  {safeAvatarUrl(b.avatar_url)
                    ? <img src={safeAvatarUrl(b.avatar_url)} alt="" className="w-full h-full object-cover" />
                    : (b.user_name?.[0]?.toUpperCase() || '?')}
                </div>
                <p className="text-sm text-white/70 flex-1 truncate">{b.user_name || 'Player'}</p>
                <p className="text-xs text-amber-400 font-bold">{b.amount?.toLocaleString()}</p>
                {b.cashed_out_at ? (
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    {b.cashed_out_at.toFixed(2)}x
                  </span>
                ) : phase === 'crashed' ? (
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Lost</span>
                ) : (
                  <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {phase === 'running' ? `${multiplier.toFixed(2)}x` : 'Ready'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}