import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Users, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BETTING_DURATION = 30;

function generateCrashPoint() {
  const e = 1 / (1 - 0.04);
  return Math.max(1.01, Math.floor((e / Math.random()) * 100) / 100);
}

function mColor(m, crashed) {
  if (crashed) return '#ef4444';
  if (m < 2) return '#4ade80';
  if (m < 5) return '#f59e0b';
  return '#f97316';
}

export default function Crash() {
  const { user, balance, updateBalance, addXp } = useWallet();

  // Synced round state from DB
  const [round, setRound] = useState(null); // the CrashRound entity
  const [phase, setPhase] = useState('loading'); // loading | betting | running | crashed
  const [countdown, setCountdown] = useState(BETTING_DURATION);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState([]);

  // Per-user bet state
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState('');
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(null);

  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const roundRef = useRef(null);
  const autoCashoutRef = useRef('');
  const hasBetRef = useRef(false);
  const cashedOutRef = useRef(false);
  const betAmountRef = useRef(100);
  const multiplierRef = useRef(1.0);
  const phaseRef = useRef('loading');
  const creatingRoundRef = useRef(false);

  autoCashoutRef.current = autoCashout;
  hasBetRef.current = hasBet;
  cashedOutRef.current = cashedOut;
  betAmountRef.current = betAmount;
  multiplierRef.current = multiplier;
  phaseRef.current = phase;
  roundRef.current = round;

  // Cashout helper
  const doCashout = useCallback(async (atMultiplier) => {
    if (cashedOutRef.current || !hasBetRef.current) return;
    cashedOutRef.current = true;
    setCashedOut(true);
    setCashoutAt(atMultiplier);
    const winnings = Math.floor(betAmountRef.current * atMultiplier);
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${atMultiplier.toFixed(2)}x`);
    await addXp(Math.floor(winnings / 20));
    // Update bet record
    const r = roundRef.current;
    if (r?.id) {
      try {
        const fresh = await base44.entities.CrashRound.filter({ id: r.id });
        const latest = fresh?.[0];
        if (latest) {
          const bets = (latest.bets || []).map(b =>
            b.user_email === user?.email
              ? { ...b, cashed_out_at: atMultiplier, profit: winnings }
              : b
          );
          await base44.entities.CrashRound.update(r.id, { bets });
        }
      } catch {}
    }
  }, [updateBalance, addXp, user]);

  // Start the multiplier animation for the current round
  const startAnimation = useCallback((r) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startTimeRef.current = Date.now();
    const cp = r.crash_point;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const cur = Math.max(1.0, Math.floor(Math.pow(Math.E, elapsed * 0.15) * 100) / 100);
      multiplierRef.current = cur;
      setMultiplier(cur);

      // Auto cashout check
      const ac = parseFloat(autoCashoutRef.current);
      if (!isNaN(ac) && ac >= 1.01 && cur >= ac && hasBetRef.current && !cashedOutRef.current) {
        doCashout(cur);
      }

      if (cur >= cp) {
        setMultiplier(cp);
        setPhase('crashed');
        phaseRef.current = 'crashed';
        setHistory(prev => [cp, ...prev].slice(0, 20));
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [doCashout]);

  // Fetch latest round from DB and sync local state
  const syncRound = useCallback(async () => {
    try {
      const rounds = await base44.entities.CrashRound.list('-created_date', 1);
      let r = rounds?.[0];

      // If the latest round is stale (no start_time or start_time is very old and still in betting), reset it
      if (r && r.status === 'betting' && r.start_time) {
        const elapsed = (Date.now() - r.start_time) / 1000;
        if (elapsed > BETTING_DURATION + 5) {
          // Stale round, mark as crashed and create new
          await base44.entities.CrashRound.update(r.id, { status: 'crashed' });
          r = null;
        }
      }

      if (!r) {
        // No valid round — create one (only one client should do this)
        if (!creatingRoundRef.current) {
          creatingRoundRef.current = true;
          const cp = generateCrashPoint();
          const newRound = await base44.entities.CrashRound.create({
            crash_point: cp,
            status: 'betting',
            bets: [],
            start_time: Date.now(),
          });
          setRound(newRound);
          roundRef.current = newRound;
          setPhase('betting');
          setCountdown(BETTING_DURATION);
          creatingRoundRef.current = false;
        }
        return;
      }

      // Detect round change — reset player state
      if (roundRef.current?.id !== r.id) {
        setRound(r);
        roundRef.current = r;
        setHasBet(false);
        setCashedOut(false);
        setCashoutAt(null);
        hasBetRef.current = false;
        cashedOutRef.current = false;
        setMultiplier(1.0);
        multiplierRef.current = 1.0;
        if (animRef.current) cancelAnimationFrame(animRef.current);
      } else {
        setRound(r);
        roundRef.current = r;
      }

      // Sync phase from DB status
      if (r.status === 'betting') {
        if (phaseRef.current !== 'betting') {
          setPhase('betting');
          phaseRef.current = 'betting';
          // Use stored start_time for accurate countdown
          const startMs = r.start_time || new Date(r.created_date).getTime();
          const elapsed = Math.floor((Date.now() - startMs) / 1000);
          const remaining = Math.max(0, BETTING_DURATION - elapsed);
          setCountdown(remaining);
          if (animRef.current) cancelAnimationFrame(animRef.current);
        }
      } else if (r.status === 'running') {
        if (phaseRef.current !== 'running') {
          setPhase('running');
          phaseRef.current = 'running';
          // Estimate start time from when status changed (use updated_date)
          const updated = new Date(r.updated_date).getTime();
          startTimeRef.current = updated;
          startAnimation(r);
        }
      } else if (r.status === 'crashed') {
        if (phaseRef.current !== 'crashed') {
          setPhase('crashed');
          phaseRef.current = 'crashed';
          setMultiplier(r.crash_point);
          setHistory(prev => {
            const already = prev[0] === r.crash_point;
            return already ? prev : [r.crash_point, ...prev].slice(0, 20);
          });
          if (animRef.current) cancelAnimationFrame(animRef.current);
        }
      }
    } catch {}
  }, [startAnimation]);

  // The "host" logic: one client advances the round states
  const advanceRound = useCallback(async () => {
    const r = roundRef.current;
    if (!r?.id) return;
    const now = Date.now();

    if (r.status === 'betting') {
      const startMs = r.start_time || new Date(r.created_date).getTime();
      const elapsed = (now - startMs) / 1000;
      if (elapsed >= BETTING_DURATION) {
        await base44.entities.CrashRound.update(r.id, { status: 'running' });
      }
    } else if (r.status === 'crashed') {
      const updated = new Date(r.updated_date).getTime();
      const elapsed = (now - updated) / 1000;
      if (elapsed >= 5) {
        // Create next round with explicit start_time
        const cp = generateCrashPoint();
        await base44.entities.CrashRound.create({
          crash_point: cp,
          status: 'betting',
          bets: [],
          start_time: Date.now(),
        });
      }
    }
  }, []);

  // Poll DB every 1s for sync + advance
  useEffect(() => {
    syncRound();
    const interval = setInterval(async () => {
      await advanceRound();
      await syncRound();
    }, 1000);
    return () => {
      clearInterval(interval);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [syncRound, advanceRound]);

  // Local countdown display (use stored start_time)
  useEffect(() => {
    if (phase !== 'betting' || !round) return;
    const startMs = round.start_time || new Date(round.created_date).getTime();
    const update = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      setCountdown(Math.max(0, BETTING_DURATION - elapsed));
    };
    update();
    const t = setInterval(update, 500);
    return () => clearInterval(t);
  }, [phase, round]);

  const handlePlaceBet = async () => {
    if (hasBet || phase !== 'betting' || betAmount <= 0 || betAmount > balance || !round?.id) return;
    setHasBet(true);
    hasBetRef.current = true;
    await updateBalance(-betAmount, 'crash_bet', `Crash bet ${betAmount}`);
    try {
      const fresh = await base44.entities.CrashRound.filter({ id: round.id });
      const latest = fresh?.[0];
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
          {/* Background glow */}
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
                {cashedOut && cashoutAt && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-400/30">
                    <p className="text-green-400 text-sm font-bold">
                      Cashed out @ {cashoutAt.toFixed(2)}x — +{Math.floor(betAmount * cashoutAt).toLocaleString()} coins!
                    </p>
                  </motion.div>
                )}
                {phase === 'crashed' && hasBet && !cashedOut && (
                  <p className="text-red-400/70 text-sm font-semibold">Lost {betAmount.toLocaleString()} coins</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Bet amount */}
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
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount(balance)}
                  disabled={phase !== 'betting' || hasBet}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/30 text-violet-300 hover:text-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Auto cashout */}
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