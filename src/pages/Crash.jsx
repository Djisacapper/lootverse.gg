import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Play, HandMetal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Crash() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [gameState, setGameState] = useState('idle'); // idle, betting, running, crashed
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(null);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(null);
  const [history, setHistory] = useState([]);
  const animRef = useRef(null);
  const startTime = useRef(null);

  const generateCrashPoint = () => {
    // House edge ~ 4%
    const e = 1 / (1 - 0.04);
    return Math.max(1.0, Math.floor(e / Math.random() * 100) / 100);
  };

  const startGame = useCallback(async () => {
    if (betAmount > balance || betAmount <= 0) return;

    const cp = generateCrashPoint();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setCashedOut(false);
    setCashoutMultiplier(null);
    setHasBet(true);

    await updateBalance(-betAmount, 'crash_bet', `Crash bet ${betAmount}`);

    setGameState('running');
    startTime.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const current = Math.pow(Math.E, elapsed * 0.15);
      const rounded = Math.floor(current * 100) / 100;

      if (rounded >= cp) {
        setMultiplier(cp);
        setGameState('crashed');
        setHistory(prev => [cp, ...prev].slice(0, 20));
        return;
      }

      setMultiplier(rounded);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [betAmount, balance, updateBalance]);

  const handleCashout = useCallback(async () => {
    if (gameState !== 'running' || cashedOut) return;

    setCashedOut(true);
    setCashoutMultiplier(multiplier);
    const winnings = Math.floor(betAmount * multiplier);
    await updateBalance(winnings, 'crash_win', `Crash cashout at ${multiplier}x`);
    await addXp(Math.floor(winnings / 20));
  }, [gameState, cashedOut, multiplier, betAmount, updateBalance, addXp]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier < 2) return 'text-green-400';
    if (multiplier < 5) return 'text-amber-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Crash</h1>
        <p className="text-white/40 text-sm">Place your bet and cash out before it crashes</p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {history.map((h, i) => (
            <div
              key={i}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold
                ${h < 2 ? 'bg-red-500/10 text-red-400' : h < 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}
            >
              {h.toFixed(2)}x
            </div>
          ))}
        </div>
      )}

      {/* Game Display */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="relative h-64 md:h-80 flex items-center justify-center bg-gradient-to-b from-transparent to-white/[0.02]">
          {/* Graph line visual */}
          {gameState === 'running' && (
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500/10 to-transparent"
                animate={{ height: `${Math.min(multiplier * 15, 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          <div className="relative z-10 text-center">
            {gameState === 'idle' && (
              <div>
                <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/30">Place your bet to start</p>
              </div>
            )}

            {gameState === 'running' && (
              <div>
                <p className={`text-7xl md:text-8xl font-bold ${getMultiplierColor()} transition-colors`}>
                  {multiplier.toFixed(2)}x
                </p>
                {cashedOut && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-lg font-semibold mt-2"
                  >
                    Cashed out at {cashoutMultiplier?.toFixed(2)}x! +{Math.floor(betAmount * cashoutMultiplier)} coins
                  </motion.p>
                )}
              </div>
            )}

            {gameState === 'crashed' && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <p className="text-7xl md:text-8xl font-bold text-red-500">{crashPoint?.toFixed(2)}x</p>
                <p className="text-red-400/60 text-lg mt-2">CRASHED!</p>
                {cashedOut ? (
                  <p className="text-green-400 mt-1">
                    You cashed out at {cashoutMultiplier?.toFixed(2)}x! +{Math.floor(betAmount * cashoutMultiplier)} coins
                  </p>
                ) : hasBet ? (
                  <p className="text-red-400/60 mt-1">You lost {betAmount} coins</p>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-white/40 mb-1 block">Bet Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={gameState === 'running'}
                  className="bg-white/5 border-white/10 text-white rounded-xl"
                  min={1}
                />
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(Math.floor(balance / 2))}
                  disabled={gameState === 'running'}
                  className="border-white/10 text-white/60 text-xs hover:bg-white/5"
                >
                  ½
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(balance)}
                  disabled={gameState === 'running'}
                  className="border-white/10 text-white/60 text-xs hover:bg-white/5"
                >
                  Max
                </Button>
              </div>
            </div>
            <div className="w-32">
              <label className="text-xs text-white/40 mb-1 block">Auto Cashout</label>
              <Input
                type="number"
                step="0.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Number(e.target.value))}
                disabled={gameState === 'running'}
                className="bg-white/5 border-white/10 text-white rounded-xl"
                min={1.01}
              />
            </div>
            <div className="flex items-end">
              {gameState === 'running' && !cashedOut ? (
                <Button
                  onClick={handleCashout}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl h-10 px-6 w-full sm:w-auto"
                >
                  <HandMetal className="w-4 h-4 mr-2" />
                  Cash Out ({(betAmount * multiplier).toFixed(0)})
                </Button>
              ) : (
                <Button
                  onClick={startGame}
                  disabled={gameState === 'running' || betAmount > balance || betAmount <= 0}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl h-10 px-6 w-full sm:w-auto disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {gameState === 'crashed' ? 'Play Again' : 'Start'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}