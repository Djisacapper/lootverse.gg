import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Round phases: 'betting' (30s countdown) | 'running' (multiplier rising) | 'crashed'
const BETTING_DURATION = 30; // seconds

function generateCrashPoint() {
  const e = 1 / (1 - 0.04);
  return Math.max(1.01, Math.floor((e / Math.random()) * 100) / 100);
}

function MultiplierColor(m, crashed) {
  if (crashed) return '#ef4444';
  if (m < 2) return '#4ade80';
  if (m < 5) return '#f59e0b';
  return '#f97316';
}

export default function Crash() {
  const { user, balance, updateBalance, addXp } = useWallet();

  // Game state
  const [phase, setPhase] = useState('betting'); // betting | running | crashed
  const [countdown, setCountdown] = useState(BETTING_DURATION);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(null);
  const [history, setHistory] = useState([]);

  // Player bet state
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState('');
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(null);

  // Live players list (other bets this round — stored in CrashRound entity)
  const [liveBets, setLiveBets] = useState([]);
  const [roundId, setRoundId] = useState(null);

  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const crashPointRef = useRef(null);
  const autoCashoutRef = useRef('');
  const hasBetRef = useRef(false);
  const cashedOutRef = useRef(false);
  const betAmountRef = useRef(100);
  const multiplierRef = useRef(1.0);
  const phaseRef = useRef('betting');

  // Keep refs in sync
  autoCashoutRef.current = autoCashout;
  hasBetRef.current = hasBet;
  cashedOutRef.current = cashedOut;
  betAmountRef.current = betAmount;
  multiplierRef.current = multiplier;
  phaseRef.current = phase;

  const doCashout = useCallback(async (atMultiplier) => {
    if (cashedOutRef.current || !hasBetRef.current) return;
    cashedOutRef.current = true;
    setCashedOut(true);
    setCashoutAt(atMultiplier);
    const winnings = Math.floor(betAmountRef.current * atMultiplier);
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${atMultiplier.toFixed(2)}x`);
    await addXp(Math.floor(winnings / 20));
    // Update our bet in the round
    if (roundId) {
      try {
        const rounds = await base44.entities.CrashRound.filter({ id: roundId });
        const round = rounds?.[0];
        if (round) {
          const bets = (round.bets || []).map(b =>
            b.user_email === user?.email
              ? { ...b, cashed_out_at: atMultiplier, profit: Math.floor(betAmountRef.current * atMultiplier) }
              : b
          );
          await base44.entities.CrashRound.update(roundId, { bets });
        }
      } catch {}
    }
  }, [updateBalance, addXp, roundId, user]);

  const startBettingPhase = useCallback(async () => {
    // Reset player state for new round
    setHasBet(false);
    setCashedOut(false);
    setCashoutAt(null);
    hasBetRef.current = false;
    cashedOutRef.current = false;
    setMultiplier(1.0);
    setPhase('betting');
    phaseRef.current = 'betting';
    setCountdown(BETTING_DURATION);

    // Create a new CrashRound in DB
    try {
      const cp = generateCrashPoint();
      crashPointRef.current = cp;
      setCrashPoint(null); // don't reveal yet
      const round = await base44.entities.CrashRound.create({
        crash_point: cp,
        status: 'betting',
        bets: [],
      });
      setRoundId(round.id);
      setLiveBets([]);
    } catch {}
  }, []);

  const startRunningPhase = useCallback(async () => {
    setPhase('running');
    phaseRef.current = 'running';
    startTimeRef.current = Date.now();

    // Update round status
    if (roundId) {
      try {
        await base44.entities.CrashRound.update(roundId, { status: 'running' });
      } catch {}
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const current = Math.pow(Math.E, elapsed * 0.15);
      const rounded = Math.floor(current * 100) / 100;
      multiplierRef.current = rounded;
      setMultiplier(rounded);

      // Check auto cashout
      const ac = parseFloat(autoCashoutRef.current);
      if (!isNaN(ac) && ac >= 1.01 && rounded >= ac && hasBetRef.current && !cashedOutRef.current) {
        doCashout(rounded);
      }

      if (rounded >= crashPointRef.current) {
        setMultiplier(crashPointRef.current);
        setCrashPoint(crashPointRef.current);
        setPhase('crashed');
        phaseRef.current = 'crashed';
        setHistory(prev => [crashPointRef.current, ...prev].slice(0, 20));
        // Update round in DB
        if (roundId) {
          base44.entities.CrashRound.update(roundId, { status: 'crashed' }).catch(() => {});
        }
        // After 5 seconds, start new betting phase
        setTimeout(() => startBettingPhase(), 5000);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [roundId, doCashout, startBettingPhase]);

  // Countdown timer during betting phase
  useEffect(() => {
    if (phase !== 'betting') return;
    if (countdown <= 0) {
      startRunningPhase();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, startRunningPhase]);

  // Initial round start
  useEffect(() => {
    startBettingPhase();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Poll live bets while running
  useEffect(() => {
    if (!roundId) return;
    const poll = async () => {
      try {
        const rounds = await base44.entities.CrashRound.filter({ id: roundId });
        const round = rounds?.[0];
        if (round) setLiveBets(round.bets || []);
      } catch {}
    };
    const interval = setInterval(poll, 2000);
    poll();
    return () => clearInterval(interval);
  }, [roundId]);

  const handlePlaceBet = async () => {
    if (hasBet || phase !== 'betting' || betAmount <= 0 || betAmount > balance) return;
    setHasBet(true);
    hasBetRef.current = true;
    await updateBalance(-betAmount, 'crash_bet', `Crash bet ${betAmount}`);
    // Add to round bets
    if (roundId) {
      try {
        const rounds = await base44.entities.CrashRound.filter({ id: roundId });
        const round = rounds?.[0];
        if (round) {
          const bets = [...(round.bets || []), {
            user_email: user?.email,
            user_name: user?.full_name || 'Player',
            amount: betAmount,
            cashed_out_at: null,
            profit: null,
          }];
          await base44.entities.CrashRound.update(roundId, { bets });
          setLiveBets(bets);
        }
      } catch {}
    }
  };

  const handleManualCashout = () => {
    if (phase !== 'running' || cashedOut || !hasBet) return;
    doCashout(multiplierRef.current);
  };

  const mColor = MultiplierColor(multiplier, phase === 'crashed');
  const canBet = phase === 'betting' && !hasBet && betAmount > 0 && betAmount <= balance;
  const canCashout = phase === 'running' && hasBet && !cashedOut;

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

      {/* Main Game Display */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        {/* Graph area */}
        <div className="relative h-60 md:h-72 flex items-center justify-center bg-gradient-to-b from-[#0a0a14] to-[#0e0e1c]">

          {/* Background glow */}
          <div className="absolute inset-0 flex items-end">
            <motion.div
              className="w-full rounded-t-2xl"
              animate={{
                height: phase === 'running' ? `${Math.min((multiplier - 1) * 8, 90)}%` : phase === 'crashed' ? '0%' : '0%',
                backgroundColor: phase === 'crashed' ? 'rgba(239,68,68,0.07)' : 'rgba(74,222,128,0.06)',
              }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* Multiplier display */}
          <div className="relative z-10 text-center">
            {phase === 'betting' && (
              <div className="flex flex-col items-center gap-3">
                <Rocket className="w-10 h-10 text-white/20 animate-bounce" />
                <div className="text-center">
                  <p className="text-white/50 text-sm font-semibold uppercase tracking-widest">Starting in</p>
                  <p className="text-6xl font-black text-white">{countdown}s</p>
                </div>
                {hasBet && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                    <p className="text-green-400 text-sm font-bold">Bet placed — {betAmount.toLocaleString()} coins</p>
                  </motion.div>
                )}
              </div>
            )}

            {(phase === 'running' || phase === 'crashed') && (
              <div className="flex flex-col items-center gap-2">
                <motion.p
                  key={Math.floor(multiplier * 10)}
                  className="text-7xl md:text-8xl font-black leading-none tabular-nums"
                  style={{ color: mColor }}
                >
                  {multiplier.toFixed(2)}x
                </motion.p>
                {phase === 'crashed' && (
                  <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-red-400 text-xl font-black tracking-widest">
                    CRASHED!
                  </motion.p>
                )}
                {cashedOut && cashoutAt && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                    <p className="text-green-400 text-sm font-bold">
                      Cashed out at {cashoutAt.toFixed(2)}x — +{Math.floor(betAmount * cashoutAt).toLocaleString()} coins!
                    </p>
                  </motion.div>
                )}
                {phase === 'crashed' && hasBet && !cashedOut && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-red-400/70 text-sm font-semibold">
                    Lost {betAmount.toLocaleString()} coins
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Bet amount */}
            <div className="flex-1">
              <label className="text-xs text-white/40 mb-1.5 block">Bet Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={phase !== 'betting' || hasBet}
                  className="bg-white/5 border-white/10 text-white rounded-xl"
                  min={1}
                />
                <Button variant="outline" onClick={() => setBetAmount(Math.floor(balance / 2))}
                  disabled={phase !== 'betting' || hasBet}
                  className="border-white/10 text-white/60 text-xs hover:bg-white/5 flex-shrink-0">½</Button>
                <Button variant="outline" onClick={() => setBetAmount(balance)}
                  disabled={phase !== 'betting' || hasBet}
                  className="border-white/10 text-white/60 text-xs hover:bg-white/5 flex-shrink-0">Max</Button>
              </div>
            </div>

            {/* Auto cashout */}
            <div className="w-36 flex-shrink-0">
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

            {/* Action button */}
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