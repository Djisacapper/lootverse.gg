import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BETTING_DURATION = 30; // seconds

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

// Multiplier based on elapsed seconds since "running" started
function calcMultiplier(elapsedSec) {
  return Math.max(1.0, Math.floor(Math.pow(Math.E, elapsedSec * 0.15) * 100) / 100);
}

export default function Crash() {
  const { user, balance, updateBalance, addXp } = useWallet();

  const [round, setRound] = useState(null);
  const [phase, setPhase] = useState('loading');   // loading | betting | running | crashed
  const [countdown, setCountdown] = useState(BETTING_DURATION);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState([]);

  // Bet state — roundId tracks which round the bet belongs to
  const [betRoundId, setBetRoundId] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState('');
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(null);

  const hasBet = betRoundId !== null && betRoundId === round?.id;

  // Refs for use inside RAF/intervals
  const animRef = useRef(null);
  const runStartRef = useRef(null);   // wall-clock ms when THIS client started the running animation
  const roundRef = useRef(null);
  const phaseRef = useRef('loading');
  const betRoundIdRef = useRef(null);
  const cashedOutRef = useRef(false);
  const betAmountRef = useRef(100);
  const autoCashoutRef = useRef('');
  const multiplierRef = useRef(1.0);
  const creatingRef = useRef(false);
  const historyRef = useRef([]);

  // Sync refs
  phaseRef.current = phase;
  roundRef.current = round;
  betRoundIdRef.current = betRoundId;
  cashedOutRef.current = cashedOut;
  betAmountRef.current = betAmount;
  autoCashoutRef.current = autoCashout;
  multiplierRef.current = multiplier;

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const doCashout = useCallback(async (atMultiplier) => {
    if (cashedOutRef.current) return;
    if (betRoundIdRef.current !== roundRef.current?.id) return;
    cashedOutRef.current = true;
    setCashedOut(true);
    setCashoutAt(atMultiplier);
    const winnings = Math.floor(betAmountRef.current * atMultiplier);
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${atMultiplier.toFixed(2)}x`);
    await addXp(Math.floor(winnings / 20));
    const r = roundRef.current;
    if (r?.id && user?.email) {
      try {
        const fresh = await base44.entities.CrashRound.list('-created_date', 1);
        const latest = fresh?.find(x => x.id === r.id);
        if (latest) {
          const bets = (latest.bets || []).map(b =>
            b.user_email === user.email
              ? { ...b, cashed_out_at: atMultiplier, profit: winnings }
              : b
          );
          await base44.entities.CrashRound.update(r.id, { bets });
        }
      } catch {}
    }
  }, [updateBalance, addXp, user]);

  const startRunningAnimation = useCallback((crashPoint) => {
    stopAnimation();
    runStartRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - runStartRef.current) / 1000;
      const cur = calcMultiplier(elapsed);
      multiplierRef.current = cur;
      setMultiplier(cur);

      // Auto cashout check
      const ac = parseFloat(autoCashoutRef.current);
      const hasBetNow = betRoundIdRef.current === roundRef.current?.id;
      if (!isNaN(ac) && ac >= 1.01 && cur >= ac && hasBetNow && !cashedOutRef.current) {
        doCashout(ac);
      }

      if (cur >= crashPoint) {
        // Hit crash point — update DB and stop
        setMultiplier(crashPoint);
        multiplierRef.current = crashPoint;
        stopAnimation();
        const r = roundRef.current;
        if (r?.id) {
          base44.entities.CrashRound.update(r.id, { status: 'crashed' }).catch(() => {});
        }
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [stopAnimation, doCashout]);

  const resetBetState = useCallback(() => {
    setCashedOut(false);
    cashedOutRef.current = false;
    setCashoutAt(null);
    setMultiplier(1.0);
    multiplierRef.current = 1.0;
  }, []);

  const syncRound = useCallback(async () => {
    try {
      const rounds = await base44.entities.CrashRound.list('-created_date', 1);
      const r = rounds?.[0];

      if (!r) {
        if (!creatingRef.current) {
          creatingRef.current = true;
          const newRound = await base44.entities.CrashRound.create({
            crash_point: generateCrashPoint(),
            status: 'betting',
            bets: [],
            start_time: Date.now(),
          });
          setRound(newRound);
          roundRef.current = newRound;
          setPhase('betting');
          phaseRef.current = 'betting';
          setCountdown(BETTING_DURATION);
          creatingRef.current = false;
        }
        return;
      }

      const isNewRound = roundRef.current?.id !== r.id;
      if (isNewRound) {
        stopAnimation();
        setRound(r);
        roundRef.current = r;
        resetBetState();
        // betRoundId intentionally NOT reset here — hasBet becomes false naturally since IDs differ
      } else {
        setRound(r);
        roundRef.current = r;
      }

      const now = Date.now();

      if (r.status === 'betting') {
        const startMs = r.start_time || now;
        const elapsed = (now - startMs) / 1000;

        // Transition to running when betting time is up
        if (elapsed >= BETTING_DURATION) {
          await base44.entities.CrashRound.update(r.id, {
            status: 'running',
            run_start_time: Date.now(), // store when running actually started
          });
          return;
        }

        if (phaseRef.current !== 'betting') {
          setPhase('betting');
          phaseRef.current = 'betting';
          stopAnimation();
        }
        setCountdown(Math.max(0, BETTING_DURATION - Math.floor(elapsed)));

      } else if (r.status === 'running') {
        if (phaseRef.current !== 'running') {
          setPhase('running');
          phaseRef.current = 'running';
          startRunningAnimation(r.crash_point);
        }

      } else if (r.status === 'crashed') {
        if (phaseRef.current !== 'crashed') {
          setPhase('crashed');
          phaseRef.current = 'crashed';
          setMultiplier(r.crash_point);
          multiplierRef.current = r.crash_point;
          stopAnimation();
          historyRef.current = [r.crash_point, ...historyRef.current].slice(0, 20);
          setHistory([...historyRef.current]);
        }

        // Create next round after 5s
        // Use a local crash timestamp to avoid relying solely on DB updated_date
        if (!roundRef._crashedAt) {
          roundRef._crashedAt = now;
        }
        const crashedAgo = now - roundRef._crashedAt;
        if (crashedAgo >= 5000 && !creatingRef.current) {
          creatingRef.current = true;
          roundRef._crashedAt = null;
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
    } catch (e) {
      console.error('syncRound error', e);
      creatingRef.current = false;
    }
  }, [startRunningAnimation, stopAnimation, resetBetState]);

  useEffect(() => {
    syncRound();
    const interval = setInterval(syncRound, 1000);
    return () => {
      clearInterval(interval);
      stopAnimation();
    };
  }, [syncRound, stopAnimation]);

  const handlePlaceBet = async () => {
    if (hasBet || phase !== 'betting' || betAmount <= 0 || betAmount > balance || !round?.id) return;
    setBetRoundId(round.id);
    betRoundIdRef.current = round.id;
    await updateBalance(-betAmount, 'crash_bet', `Crash bet ${betAmount}`);
    try {
      const fresh = await base44.entities.CrashRound.list('-created_date', 1);
      const latest = fresh?.find(x => x.id === round.id);
      if (latest) {
        const bets = [...(latest.bets || []), {
          user_email: user?.email,
          user_name: user?.full_name || 'Player',
          amount: betAmount,
          cashed_out_at: null,
          profit: null,
        }];
        await base44.entities.CrashRound.update(round.id, { bets });
      }
    } catch {}
  };

  const handleManualCashout = () => {
    if (phase !== 'running' || cashedOut || !hasBet) return;
    doCashout(multiplierRef.current);
  };

  const liveBets = round?.bets || [];
  const canBet = phase === 'betting' && !hasBet && betAmount > 0 && betAmount <= balance;
  const canCashout = phase === 'running' && hasBet && !cashedOut;
  const col = mColor(multiplier, phase === 'crashed');

  // Only show "Lost" if: crashed AND had a bet on THIS round AND did NOT cash out
  const showLost = phase === 'crashed' && hasBet && !cashedOut;
  // Only show "Cashed out" if: cashed out on THIS round
  const showCashedOut = cashedOut && cashoutAt !== null && betRoundId === round?.id;

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
              <p className="text-white/30 text-sm">Connecting...</p>
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
                    <p className="text-green-400 text-sm font-bold">✓ Bet placed — {betAmount.toLocaleString()} coins</p>
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
                      Cashed out @ {cashoutAt.toFixed(2)}x — +{Math.floor(betAmount * cashoutAt).toLocaleString()} coins!
                    </p>
                  </motion.div>
                )}
                {showLost && (
                  <p className="text-red-400/70 text-sm font-semibold">Lost {betAmount.toLocaleString()} coins</p>
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
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={phase !== 'betting' || hasBet}
                  className="bg-white/5 border-white/10 text-white rounded-xl flex-1 min-w-0"
                  min={1}
                />
                <button
                  onClick={() => setBetAmount(Math.floor(balance / 2))}
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
                  Cash Out ({Math.floor(betAmount * multiplier).toLocaleString()})
                </Button>
              ) : (
                <Button onClick={handlePlaceBet} disabled={!canBet}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl h-10 px-6 font-bold disabled:opacity-40 w-full sm:w-auto">
                  {hasBet ? '✓ Bet Placed' : phase === 'running' ? 'In Progress...' : phase === 'crashed' ? 'Next Round...' : 'Place Bet'}
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
                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                  {b.user_name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-sm text-white/70 flex-1 truncate">{b.user_name}</p>
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