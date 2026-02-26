import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';

function ConfettiEffect({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
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
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r); ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(() => cancelAnimationFrame(frame), 4000);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// TRUE vertical spinner — items scroll top-to-bottom
function VerticalSpinner({ items, winnerItem, onDone, isSpinning }) {
  const ITEM_H = 76;
  const TOTAL = 40;
  const WIN_POS = 30;
  const VISIBLE_H = 220;

  const strip = useRef(
    Array.from({ length: TOTAL }, (_, i) => {
      if (i === WIN_POS) return winnerItem;
      return items[Math.floor(Math.random() * items.length)];
    })
  );

  const targetY = -(WIN_POS * ITEM_H - VISIBLE_H / 2 + ITEM_H / 2);

  const doneFired = useRef(false);
  useEffect(() => {
    if (!isSpinning) return;
    doneFired.current = false;
    const t = setTimeout(() => {
      if (!doneFired.current) { doneFired.current = true; onDone(); }
    }, 3200);
    return () => clearTimeout(t);
  }, [isSpinning]);

  if (!isSpinning) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[#0a0a14] border border-white/10 w-full"
      style={{ height: VISIBLE_H }}
    >
      {/* Center highlight line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[76px] border-y border-amber-400/60 z-10 pointer-events-none bg-amber-400/5" />
      {/* Fade top */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#0a0a14] to-transparent z-20 pointer-events-none" />
      {/* Fade bottom */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0a0a14] to-transparent z-20 pointer-events-none" />

      <motion.div
        className="absolute left-0 right-0 top-0 flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{ duration: 3.0, ease: [0.05, 0.8, 0.2, 1] }}
      >
        {strip.current.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 border-b border-white/5 flex-shrink-0`}
            style={{ height: ITEM_H }}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex items-center justify-center overflow-hidden flex-shrink-0`}>
              {item?.image_url
                ? <img src={item.image_url} alt={item?.name} className="w-9 h-9 object-contain" />
                : <span className="text-lg">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/80 font-medium truncate">{item?.name}</p>
              <p className="text-[11px] text-amber-400 font-bold">{item?.value?.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

export default function BattleArena({ battle, selectedCases, players, teams, modeLabel, userEmail, onClose, onReward }) {
  const totalRounds = selectedCases.length;
  const teamList = teams || [players.map((_, i) => i)];

  const [phase, setPhase] = useState('countdown');
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinners, setSpinners] = useState([]);
  const [playerItems, setPlayerItems] = useState(players.map(() => []));
  const [spinDoneCount, setSpinDoneCount] = useState(0);
  const [done, setDone] = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const rewardGiven = useRef(false);

  const allRolled = useRef(null);
  useEffect(() => {
    allRolled.current = selectedCases.map(c =>
      players.map(() => rollItem(c.items || []) || { name: 'Nothing', value: 0, rarity: 'common', image_url: null })
    );
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('spinning'); startRound(0); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const startRound = (round) => {
    const rolled = allRolled.current[round];
    setSpinners(players.map((_, pi) => ({ playerIdx: pi, item: rolled[pi] })));
    setSpinDoneCount(0);
    setSpinning(true);
  };

  const spinDoneRef = useRef(0);
  const handleSpinnerDone = () => {
    spinDoneRef.current += 1;
    setSpinDoneCount(spinDoneRef.current);
    if (spinDoneRef.current >= players.length) {
      spinDoneRef.current = 0;
      const round = currentRound;
      const rolled = allRolled.current[round];
      // Reveal items
      setPlayerItems(prev => prev.map((items, pi) => [...items, rolled[pi]]));
      setSpinning(false);

      const nextRound = round + 1;
      if (nextRound >= totalRounds) {
        setTimeout(() => finishBattle(), 2500);
      } else {
        setTimeout(() => {
          setCurrentRound(nextRound);
          startRound(nextRound);
        }, 4000);
      }
    }
  };

  const finishBattle = () => {
    const teamTotals = teamList.map(memberIdxs =>
      memberIdxs.reduce((sum, pi) => {
        return sum + allRolled.current.reduce((s, round) => s + (round[pi]?.value || 0), 0);
      }, 0)
    );
    const winIdx = teamTotals.indexOf(Math.max(...teamTotals));
    setWinnerTeamIdx(winIdx);
    setDone(true);

    if (!rewardGiven.current) {
      rewardGiven.current = true;
      const userPlayerIdx = players.findIndex(p => p.email === userEmail);
      const userInWinnerTeam = teamList[winIdx]?.includes(userPlayerIdx);
      if (userInWinnerTeam) {
        setShowConfetti(true);
        const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
        onReward && onReward(totalPot);
        // Stop confetti after 4s
        setTimeout(() => setShowConfetti(false), 4500);
      }
    }
  };

  const playerTotals = playerItems.map(items => items.reduce((s, it) => s + (it?.value || 0), 0));
  const teamTotals = teamList.map(memberIdxs => memberIdxs.reduce((sum, pi) => sum + (playerTotals[pi] || 0), 0));
  const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
  const payoutPerWinner = done && winnerTeamIdx !== null
    ? Math.floor(totalPot / (teamList[winnerTeamIdx]?.length || 1))
    : 0;

  const caseForRound = selectedCases[currentRound] || selectedCases[0];
  const caseItems = caseForRound?.items || [];

  return (
    <div className="space-y-4 relative">
      <ConfettiEffect active={showConfetti} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-white/40 font-medium">{modeLabel || '1v1'}</p>
          <p className="text-sm font-bold text-white/60">
            Pot: <span className="text-amber-400">{totalPot.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {selectedCases.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300
              ${i < currentRound ? 'w-4 bg-violet-500' : i === currentRound && spinning ? 'w-4 bg-amber-400' : i === currentRound && done ? 'w-4 bg-violet-500' : 'w-3 bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      {/* Round label */}
      {phase === 'spinning' && (
        <p className="text-xs text-center text-white/30 font-medium">
          Round {currentRound + 1} / {totalRounds}
        </p>
      )}

      {/* Battle Over Banner */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/30 p-5 text-center"
        >
          <p className="text-2xl font-black text-white mb-3">🏆 Battle Over!</p>
          <div className="flex justify-center gap-8 flex-wrap">
            {teamList.map((memberIdxs, ti) => {
              const isWinner = ti === winnerTeamIdx;
              return (
                <div key={ti} className={`flex flex-col items-center gap-1.5 ${isWinner ? '' : 'opacity-40'}`}>
                  {isWinner && (
                    <p className="text-xs font-bold text-green-400 mb-1">
                      Each player gets <span className="text-white text-sm">{payoutPerWinner.toLocaleString()}</span> coins
                    </p>
                  )}
                  <div className="flex gap-4">
                    {memberIdxs.map(pi => (
                      <div key={pi} className="flex flex-col items-center gap-1">
                        {isWinner && <Crown className="w-5 h-5 text-amber-400" />}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                          style={{ background: TEAM_COLORS[ti] + '33', border: `2px solid ${TEAM_COLORS[ti]}66` }}>
                          {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-[10px] text-white/50">{players[pi]?.name}</p>
                        <p className="text-[11px] text-amber-400 font-bold">{(playerTotals[pi] || 0).toLocaleString()}</p>
                        {isWinner && <p className="text-[11px] text-green-400 font-bold">+{payoutPerWinner.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-bold mt-1" style={{ color: TEAM_COLORS[ti] }}>
                    {teamList.length > 1 ? `Team ${ti + 1}: ` : ''}{teamTotals[ti]?.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Players side by side — spinner is INSIDE each player card, VERTICALLY */}
      <div className="flex gap-2 items-start">
        {teamList.map((memberIdxs, ti) => (
          <React.Fragment key={ti}>
            <div className="flex-1 min-w-0">
              {/* Team label */}
              {teamList.length > 1 && (
                <div className="text-center mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: TEAM_COLORS[ti] + '33', color: TEAM_COLORS[ti] }}>
                    Team {ti + 1}
                    {done && <span className="ml-1 text-white/60">{teamTotals[ti]?.toLocaleString()}</span>}
                  </span>
                </div>
              )}

              {/* Player columns in this team, side by side */}
              <div className="flex gap-2">
                {memberIdxs.map(pi => {
                  const teamColor = TEAM_COLORS[ti];
                  const isWinner = done && ti === winnerTeamIdx;
                  const total = playerTotals[pi] || 0;
                  return (
                    <div key={pi}
                      className={`flex-1 min-w-0 rounded-2xl border transition-all duration-500 flex flex-col
                        ${isWinner ? 'border-amber-400/50 bg-amber-500/5' : 'border-white/[0.07] bg-white/[0.02]'}`}
                      style={!isWinner ? { borderColor: teamColor + '44' } : {}}
                    >
                      {/* Player header */}
                      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: teamColor + '33', color: teamColor }}>
                          {players[pi]?.isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-sm font-bold text-white truncate flex-1">{players[pi]?.name}</p>
                        {isWinner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      </div>

                      {/* Total */}
                      <p className="text-lg font-bold text-amber-400 text-center pb-1">{total.toLocaleString()}</p>

                      {/* VERTICAL SPINNER — only shown when this round is spinning */}
                      {spinning && phase === 'spinning' && (
                        <div className="px-2 pb-2">
                          <VerticalSpinner
                            key={`${currentRound}-${pi}`}
                            items={caseItems}
                            winnerItem={spinners[pi]?.item}
                            onDone={handleSpinnerDone}
                            isSpinning={spinning}
                          />
                        </div>
                      )}

                      {/* Won items — no scroll */}
                      <div className="px-2 pb-3 space-y-1">
                        {(playerItems[pi] || []).map((item, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${getRarityBorder(item?.rarity)} bg-white/[0.02]`}
                          >
                            <div className={`w-7 h-7 rounded bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
                              {item?.image_url
                                ? <img src={item.image_url} alt={item.name} className="w-6 h-6 object-contain" />
                                : <span className="text-xs">📦</span>}
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
                })}
              </div>
            </div>

            {/* VS divider between teams */}
            {ti < teamList.length - 1 && (
              <div className="flex items-center justify-center px-1 pt-8">
                <span className="text-white/20 font-black text-sm">VS</span>
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

      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <motion.div key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-9xl font-black text-white drop-shadow-2xl">
              {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}