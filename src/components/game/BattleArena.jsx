import React, { useState, useEffect } from 'react';
import { Trophy, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';

const BOT_NAMES = ['CrateBot', 'LootBot', 'RNG_Pro', 'ShadowBot', 'CryptoBot', 'NightBot'];

function PlayerColumn({ player, isBot, revealedItems, currentRound, totalRounds, isWinner }) {
  return (
    <div className={`flex-1 rounded-2xl border p-4 transition-all duration-500 ${isWinner ? 'border-amber-400/50 bg-amber-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isBot ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{player.name}</p>
          {isBot && <p className="text-[10px] text-purple-400">BOT</p>}
        </div>
        {isWinner && <Trophy className="w-5 h-5 text-amber-400" />}
      </div>

      {/* Total value */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-amber-400">{(player.total_value || 0).toLocaleString()}</p>
        <p className="text-[10px] text-white/30">coins</p>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {Array.from({ length: totalRounds }).map((_, i) => {
          const item = revealedItems[i];
          return (
            <AnimatePresence key={i}>
              {item ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border ${getRarityBorder(item.rarity)} bg-white/[0.03]`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center flex-shrink-0`}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-amber-400 font-bold">{item.value?.toLocaleString()}</p>
                  </div>
                </motion.div>
              ) : (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border border-white/5 bg-white/[0.02] ${i === currentRound ? 'animate-pulse' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-2 bg-white/5 rounded w-2/3 mb-1" />
                    <div className="h-2 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}

export default function BattleArena({ battle, selectedCases, players, userEmail, onClose, onReward }) {
  const totalRounds = selectedCases.length;
  const [currentRound, setCurrentRound] = useState(-1);
  const [playerItems, setPlayerItems] = useState(players.map(() => []));
  const [playerTotals, setPlayerTotals] = useState(players.map(() => 0));
  const [done, setDone] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState(null);

  useEffect(() => {
    let round = 0;
    const interval = setInterval(() => {
      if (round >= totalRounds) {
        clearInterval(interval);
        setDone(true);
        return;
      }

      const caseTemplate = selectedCases[round];
      setCurrentRound(round);

      setPlayerItems(prev => {
        const next = prev.map((items, pi) => {
          const won = rollItem(caseTemplate.items || []);
          return [...items, won || { name: 'Nothing', value: 0, rarity: 'common' }];
        });
        setPlayerTotals(prev2 => next.map((items) => items.reduce((s, it) => s + (it.value || 0), 0)));
        return next;
      });

      round++;
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (done) {
      const maxVal = Math.max(...playerTotals);
      const idx = playerTotals.indexOf(maxVal);
      setWinnerIdx(idx);
      if (players[idx]?.email === userEmail) {
        onReward && onReward(playerTotals.reduce((a, b) => a + b, 0));
      }
    }
  }, [done]);

  const playersWithData = players.map((p, i) => ({
    ...p,
    total_value: playerTotals[i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">
          {done ? '🏆 Battle Complete!' : `Round ${Math.min(currentRound + 1, totalRounds)} / ${totalRounds}`}
        </h1>
        {!done && (
          <div className="flex gap-1">
            {selectedCases.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i <= currentRound ? 'bg-violet-500' : 'bg-white/10'}`} />
            ))}
          </div>
        )}
      </div>

      {/* VS divider label */}
      {done && winnerIdx !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-2 bg-amber-500/10 border border-amber-400/20 rounded-xl"
        >
          <p className="text-amber-400 font-bold">
            🏆 {playersWithData[winnerIdx]?.name} wins {playerTotals.reduce((a, b) => a + b, 0).toLocaleString()} coins!
          </p>
        </motion.div>
      )}

      {/* Player columns */}
      <div className="flex gap-3">
        {playersWithData.map((p, i) => {
          // Insert VS badge between each pair
          return (
            <React.Fragment key={i}>
              <PlayerColumn
                player={p}
                isBot={p.isBot}
                revealedItems={playerItems[i] || []}
                currentRound={currentRound}
                totalRounds={totalRounds}
                isWinner={done && winnerIdx === i}
              />
              {i < playersWithData.length - 1 && (
                <div className="flex items-center justify-center px-1">
                  <div className="text-white/20 font-black text-lg">VS</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {done && (
        <div className="flex justify-center">
          <Button onClick={onClose} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-8">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}