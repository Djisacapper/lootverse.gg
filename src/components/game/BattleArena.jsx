import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Bot, User, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';

// Parse mode string to get teams array e.g. "2v2" -> [2,2], "1v1v1" -> [1,1,1]
function parseTeams(modeLabel) {
  return modeLabel.split('v').map(Number);
}

// Simple confetti burst using canvas
function ConfettiEffect() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 8 + 4,
      color: ['#f59e0b','#8b5cf6','#06b6d4','#10b981','#ef4444','#ec4899'][Math.floor(Math.random()*6)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      angle: Math.random() * 360,
      va: (Math.random() - 0.5) * 6,
    }));
    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.va;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r);
        ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(() => cancelAnimationFrame(frame), 4000);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// Vertical case spinner for a single round
function CaseSpinner({ items, winnerItem, onDone }) {
  const ITEM_H = 80;
  const TOTAL = 40;
  const winPos = 32;

  const strip = Array.from({ length: TOTAL }, (_, i) => {
    if (i === winPos) return winnerItem;
    return items[Math.floor(Math.random() * items.length)];
  });

  const VISIBLE_H = 240; // visible window height
  const targetY = -(winPos * ITEM_H - VISIBLE_H / 2 + ITEM_H / 2);

  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0d0d1a] border border-white/10 w-full" style={{ height: VISIBLE_H }}>
      {/* Center line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-400 z-10 pointer-events-none" />
      {/* Fade top/bottom */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0d0d1a] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0d1a] to-transparent z-10 pointer-events-none" />
      <motion.div
        className="flex flex-col items-center absolute left-0 right-0 top-0"
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{ duration: 2.8, ease: [0.1, 0.7, 0.3, 1] }}
      >
        {strip.map((item, i) => (
          <div
            key={i}
            className={`flex-shrink-0 flex items-center gap-3 w-full px-3 rounded-lg border my-0.5 bg-white/[0.04] ${i === winPos ? getRarityBorder(item?.rarity) : 'border-white/5'}`}
            style={{ height: ITEM_H - 4 }}
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex items-center justify-center overflow-hidden flex-shrink-0`}>
              {item?.image_url ? <img src={item.image_url} alt={item.name} className="w-11 h-11 object-contain" /> : <span className="text-xl">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 font-medium truncate">{item?.name}</p>
              <p className="text-xs text-amber-400 font-bold">{item?.value?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function PlayerCard({ player, items, isWinner, teamColor }) {
  const total = items.reduce((s, it) => s + (it?.value || 0), 0);
  return (
    <div className={`flex-1 min-w-0 rounded-2xl border p-3 transition-all duration-500
      ${isWinner ? 'border-amber-400/50 bg-amber-500/5' : `border-white/[0.06] bg-white/[0.02]`}`}
      style={isWinner ? {} : { borderColor: teamColor + '33' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: teamColor + '33', color: teamColor }}>
          {player.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{player.name}</p>
          {player.isBot && <p className="text-[9px]" style={{ color: teamColor }}>BOT</p>}
        </div>
        {isWinner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
      </div>
      <p className="text-xl font-bold text-amber-400 text-center mb-2">{total.toLocaleString()}</p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${getRarityBorder(item?.rarity)} bg-white/[0.02]`}>
            <div className={`w-7 h-7 rounded bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
              {item?.image_url ? <img src={item.image_url} alt={item.name} className="w-6 h-6 object-contain" /> : <span className="text-xs">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/70 truncate">{item?.name}</p>
              <p className="text-[10px] text-amber-400 font-bold">{item?.value?.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

export default function BattleArena({ battle, selectedCases, players, teams, modeLabel, userEmail, onClose, onReward }) {
  const totalRounds = selectedCases.length;
  const teamList = teams || [players.map((_, i) => i)]; // fallback: all in one team

  // State
  const [phase, setPhase] = useState('countdown'); // countdown | spinning | result
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinners, setSpinners] = useState([]); // [{ playerIdx, item }]
  const [playerItems, setPlayerItems] = useState(players.map(() => []));
  const [spinDoneCount, setSpinDoneCount] = useState(0);
  const [done, setDone] = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Pre-roll all items for all rounds upfront
  const allRolled = useRef(null);
  useEffect(() => {
    allRolled.current = selectedCases.map(c =>
      players.map(() => {
        const item = rollItem(c.items || []);
        return item || { name: 'Nothing', value: 0, rarity: 'common', image_url: null };
      })
    );
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) {
      setPhase('spinning');
      startRound(0);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const startRound = (round) => {
    const rolled = allRolled.current[round];
    setSpinners(players.map((_, pi) => ({ playerIdx: pi, item: rolled[pi] })));
    setSpinning(true);
    setSpinDoneCount(0);
  };

  const handleSpinnerDone = () => {
    setSpinDoneCount(prev => {
      const next = prev + 1;
      if (next >= players.length) {
        // All spinners done — reveal items
        const round = currentRound;
        const rolled = allRolled.current[round];
        setPlayerItems(prev2 => prev2.map((items, pi) => [...items, rolled[pi]]));
        setSpinning(false);

        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          // Battle done
          setTimeout(() => finishBattle(), 600);
        } else {
          setTimeout(() => {
            setCurrentRound(nextRound);
            startRound(nextRound);
          }, 800);
        }
      }
      return next;
    });
  };

  const finishBattle = () => {
    // Calculate team totals
    const teamTotals = teamList.map(memberIdxs =>
      memberIdxs.reduce((sum, pi) => {
        const items = allRolled.current.map(round => round[pi]);
        return sum + items.reduce((s, it) => s + (it?.value || 0), 0);
      }, 0)
    );
    const maxTotal = Math.max(...teamTotals);
    const winIdx = teamTotals.indexOf(maxTotal);
    setWinnerTeamIdx(winIdx);
    setDone(true);

    // Check if user is in winner team
    const userPlayerIdx = players.findIndex(p => p.email === userEmail);
    const userInWinnerTeam = teamList[winIdx]?.includes(userPlayerIdx);
    if (userInWinnerTeam) {
      setShowConfetti(true);
      const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
      onReward && onReward(totalPot);
    }
  };

  // Build player totals
  const playerTotals = playerItems.map(items => items.reduce((s, it) => s + (it?.value || 0), 0));
  const teamTotals = teamList.map(memberIdxs => memberIdxs.reduce((sum, pi) => sum + (playerTotals[pi] || 0), 0));

  const caseForRound = selectedCases[currentRound] || selectedCases[0];
  const caseItems = caseForRound?.items || [];

  return (
    <div className="space-y-4 relative">
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-white/40 font-medium">{modeLabel || '1v1'}</p>
          <p className="text-sm font-bold text-white/60">Battle cost <span className="text-amber-400">{(players.length * selectedCases.reduce((s,c)=>s+(c.price||0),0)).toLocaleString()}</span></p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <span>Rounds</span>
          <span className="text-white font-bold">{Math.min(currentRound + (done ? 0 : 0), totalRounds)} / {totalRounds}</span>
        </div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-9xl font-black text-white drop-shadow-2xl"
            >
              {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Over Banner */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/30 p-5 text-center"
        >
          <p className="text-2xl font-black text-white mb-2">🏆 The battle is over!</p>
          <div className="flex justify-center gap-6 flex-wrap">
            {teamList.map((memberIdxs, ti) => {
              const isWinner = ti === winnerTeamIdx;
              const total = teamTotals[ti];
              return (
                <div key={ti} className={`flex flex-col items-center gap-1 ${isWinner ? '' : 'opacity-50'}`}>
                  <div className="flex gap-1">
                    {memberIdxs.map(pi => (
                      <div key={pi} className="flex flex-col items-center">
                        {isWinner && <Crown className="w-5 h-5 text-amber-400 mb-1" />}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ background: TEAM_COLORS[ti] + '33', border: `2px solid ${TEAM_COLORS[ti]}66` }}>
                          {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-[10px] text-white/60 mt-1">{players[pi]?.name}</p>
                        <p className="text-[11px] text-amber-400 font-bold">{(playerTotals[pi] || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAM_COLORS[ti] }}>
                    Team {ti + 1}: {total.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Active round spinners */}
      {spinning && phase === 'spinning' && (
        <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40 font-medium">Round {currentRound + 1} / {totalRounds}</p>
            <div className="flex gap-1">
              {selectedCases.map((c, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i < currentRound ? 'w-4 bg-violet-500' : i === currentRound ? 'w-4 bg-amber-400' : 'w-3 bg-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            {players.map((p, pi) => (
              <div key={pi} className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-medium flex items-center gap-1.5 justify-center" style={{ color: TEAM_COLORS[teamList.findIndex(t => t.includes(pi))] }}>
                  {p.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {p.name}
                </p>
                {caseItems.length > 0 ? (
                  <CaseSpinner
                    key={`${currentRound}-${pi}`}
                    items={caseItems}
                    winnerItem={spinners[pi]?.item}
                    onDone={handleSpinnerDone}
                  />
                ) : (
                  <div className="h-60 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <p className="text-white/20 text-sm">Opening...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team layout — player cards */}
      <div className="flex gap-2 items-start">
        {teamList.map((memberIdxs, ti) => (
          <React.Fragment key={ti}>
            {/* Team column */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-center">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: TEAM_COLORS[ti] + '33', color: TEAM_COLORS[ti] }}>
                  Team {ti + 1}
                </span>
                {done && (
                  <span className="ml-2 text-xs text-amber-400 font-bold">{teamTotals[ti]?.toLocaleString()}</span>
                )}
              </div>
              <div className="flex gap-2">
                {memberIdxs.map(pi => (
                  <PlayerCard
                    key={pi}
                    player={players[pi]}
                    items={playerItems[pi] || []}
                    isWinner={done && ti === winnerTeamIdx}
                    teamColor={TEAM_COLORS[ti]}
                  />
                ))}
              </div>
            </div>
            {/* VS between teams */}
            {ti < teamList.length - 1 && (
              <div className="flex items-center justify-center px-2 pt-6">
                <div className="text-white/20 font-black text-base">VS</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {done && (
        <div className="flex justify-center pt-2">
          <Button onClick={onClose} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-10 h-11">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}