import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ArrowLeft, Crown, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRarityColor, getRarityBorder, rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import JackpotWheel from './JackpotWheel';

const TEAM_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];
const PLAYER_COLORS = ['#8b5cf6','#3b82f6','#ef4444','#10b981','#f59e0b','#ec4899','#06b6d4','#84cc16'];

/* ─── Confetti ─────────────────────────────────────────────────────────────── */
function ConfettiEffect({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      r: Math.random() * 8 + 4,
      color: ['#f59e0b','#8b5cf6','#06b6d4','#10b981','#ef4444','#ec4899'][Math.floor(Math.random()*6)],
      vx: (Math.random()-.5)*4, vy: Math.random()*4+2,
      angle: Math.random()*360, va: (Math.random()-.5)*6,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.angle+=p.va;
        if (p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const t = setTimeout(()=>cancelAnimationFrame(frame), 4500);
    return ()=>{ cancelAnimationFrame(frame); clearTimeout(t); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-50" />;
}

/* ─── Vertical Spinner ──────────────────────────────────────────────────────── */
function VerticalSpinner({ items, winnerItem, onDone, fast }) {
  const ITEM_H = 80;
  const WIN_POS = 28;
  const TOTAL = 36;
  const VISIBLE_H = 240;
  const duration = fast ? 1.4 : 3.0;

  const strip = useRef(
    Array.from({ length: TOTAL }, (_, i) =>
      i === WIN_POS ? winnerItem : items[Math.floor(Math.random() * items.length)]
    )
  ).current;

  const targetY = -(WIN_POS * ITEM_H - VISIBLE_H / 2 + ITEM_H / 2);

  useEffect(() => {
    const t = setTimeout(onDone, fast ? 1600 : 3300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#08080f]" style={{ height: VISIBLE_H }}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ height: ITEM_H, background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(245,158,11,0.5)', borderBottom: '1px solid rgba(245,158,11,0.5)' }} />
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, #08080f 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, #08080f 0%, transparent 100%)' }} />
      <motion.div
        className="absolute left-0 right-0 top-0 flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{ duration, ease: [0.04, 0.82, 0.165, 1] }}
      >
        {strip.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 flex-shrink-0" style={{ height: ITEM_H }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
              {item?.image_url
                ? <img src={item.image_url} alt={item?.name} className="w-11 h-11 object-contain" />
                : <span className="text-2xl">📦</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/80 font-medium truncate">{item?.name || '—'}</p>
              <p className="text-xs text-amber-400 font-bold">{item?.value?.toLocaleString() || 0}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Item Chip ──────────────────────────────────────────────────────────────── */
function ItemChip({ item, hidden }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${hidden ? 'border-white/10' : getRarityBorder(item?.rarity)} bg-white/[0.02]`}
    >
      {hidden ? (
        <>
          <div className="w-7 h-7 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center">
            <EyeOff className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 truncate">Hidden item</p>
            <p className="text-[10px] text-white/20 font-bold">???</p>
          </div>
        </>
      ) : (
        <>
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRarityColor(item?.rarity || 'common')} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
            {item?.image_url
              ? <img src={item.image_url} alt={item.name} className="w-6 h-6 object-contain" />
              : <span className="text-xs">📦</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/70 truncate">{item?.name}</p>
            <p className="text-[10px] text-amber-400 font-bold">{item?.value?.toLocaleString()}</p>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─── Player Column ──────────────────────────────────────────────────────────── */
function PlayerColumn({ player, playerColor, isWinner, wonItems, isSpinning, caseItems, spinnerKey, spinnerItem, onSpinDone, fast, magicSpin, pct, grandTotal }) {
  const total = wonItems.reduce((s, it) => s + (it?.value || 0), 0);
  const HIDDEN_RARITIES = ['epic', 'legendary'];
  const showPct = grandTotal > 0;

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col rounded-2xl border transition-all duration-500
        ${isWinner ? 'border-amber-400/60 shadow-lg shadow-amber-400/10' : ''}`}
      style={{
        borderColor: isWinner ? undefined : playerColor + '55',
        background: isWinner ? 'rgba(245,158,11,0.05)' : (playerColor + '0d'),
      }}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: playerColor + '33', color: playerColor, border: `2px solid ${playerColor}66` }}>
          {player.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{player.name}</p>
          {player.isBot && <p className="text-[9px] font-semibold" style={{ color: playerColor }}>BOT</p>}
        </div>
        {isWinner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
      </div>

      <p className="text-xl font-black text-amber-400 text-center py-1">{total.toLocaleString()}</p>

      {/* Live percentage bar */}
      {showPct && (
        <div className="px-3 pb-1">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold" style={{ color: playerColor }}>{Math.round(pct * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: playerColor }}
              initial={{ width: '0%' }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {isSpinning && caseItems.length > 0 && (
        <div className="px-2 pb-2">
          <VerticalSpinner
            key={spinnerKey}
            items={caseItems}
            winnerItem={spinnerItem}
            onDone={onSpinDone}
            fast={fast}
          />
        </div>
      )}

      <div className="px-2 pb-3 space-y-1">
        {wonItems.map((item, i) => {
          const isHidden = magicSpin && HIDDEN_RARITIES.includes(item?.rarity);
          return <ItemChip key={i} item={item} hidden={isHidden} />;
        })}
      </div>
    </div>
  );
}

/* ─── Battle Arena ──────────────────────────────────────────────────────────── */
export default function BattleArena({ battle, selectedCases, players, teams, modeLabel, battleModes = {}, userEmail, onClose, onReward }) {
  const totalRounds = selectedCases.length;
  const teamList = teams || [players.map((_, i) => i)];

  // --- Battle Mode flags ---
  const isCrazy     = !!battleModes.crazy;       // lowest value wins
  const isTerminal  = !!battleModes.terminal;    // only last round counts
  const isGroup     = !!battleModes.group;       // split pot among all
  const isMagicSpin = !!battleModes.magic_spin;  // epic/legendary items hidden
  const isFastMode  = !!battleModes.fast_mode;   // faster spinners
  const isJackpot   = !!battleModes.jackpot;     // jackpot wheel at end

  const [phase, setPhase]             = useState('countdown');
  const [countdown, setCountdown]     = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [spinning, setSpinning]       = useState(false);
  const [spinners, setSpinners]       = useState([]);
  const [playerItems, setPlayerItems] = useState(players.map(() => []));
  const [done, setDone]               = useState(false);
  const [jackpotPhase, setJackpotPhase] = useState(false);
  const [winnerTeamIdx, setWinnerTeamIdx] = useState(null);
  const [showConfetti, setShowConfetti]   = useState(false);

  const allRolled   = useRef(null);
  const spinsDone   = useRef(0);
  const rewardGiven = useRef(false);
  const currentRoundRef = useRef(0);

  useEffect(() => {
    allRolled.current = selectedCases.map(c =>
      players.map(() => rollItem(c.items || []) || { name: 'Nothing', value: 0, rarity: 'common', image_url: null })
    );
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) { setPhase('spinning'); launchRound(0); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const launchRound = (round) => {
    spinsDone.current = 0;
    currentRoundRef.current = round;
    setCurrentRound(round);
    setSpinners(allRolled.current[round]);
    setSpinning(true);
  };

  const handleSpinDone = () => {
    spinsDone.current += 1;
    if (spinsDone.current < players.length) return;

    const round = currentRoundRef.current;
    const rolled = allRolled.current[round];
    setPlayerItems(prev => prev.map((items, pi) => [...items, rolled[pi]]));
    setSpinning(false);

    if (round + 1 >= totalRounds) {
      setTimeout(() => {
        if (isJackpot) {
          setJackpotPhase(true);
        } else {
          finishBattle();
        }
      }, isFastMode ? 1200 : 2500);
    } else {
      setTimeout(() => launchRound(round + 1), isFastMode ? 1500 : 4500);
    }
  };

  // Single source of truth — always reads from allRolled.current
  // In team battles, we compare team totals. In 1v1 each "team" is a single player.
  const getPlayerTotal = (pi) => {
    if (!allRolled.current) return 0;
    if (isTerminal) {
      const lastRound = allRolled.current[totalRounds - 1];
      return lastRound?.[pi]?.value || 0;
    }
    return allRolled.current.reduce((s, r) => s + (r[pi]?.value || 0), 0);
  };

  // For team battles: average per-player value so team size doesn't bias the result
  const getTeamTotal = (mi) => {
    if (mi.length === 0) return 0;
    const sum = mi.reduce((s, pi) => s + getPlayerTotal(pi), 0);
    return sum / mi.length; // average so 2v2 doesn't unfairly advantage bigger teams
  };

  const finishBattle = (forcedWinnerTi = null) => {
    let winIdx;

    if (forcedWinnerTi !== null) {
      winIdx = forcedWinnerTi;
    } else if (isGroup) {
      winIdx = -1;
    } else {
      const teamVals = teamList.map(mi => getTeamTotal(mi));
      // Crazy = LOWEST average wins. Normal = HIGHEST average wins.
      if (isCrazy) {
        winIdx = teamVals.indexOf(Math.min(...teamVals));
      } else {
        winIdx = teamVals.indexOf(Math.max(...teamVals));
      }
    }

    setWinnerTeamIdx(winIdx);
    setDone(true);
    setJackpotPhase(false);

    if (!rewardGiven.current) {
      rewardGiven.current = true;
      const totalPot = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);
      const userPi   = players.findIndex(p => p.email === userEmail);

      if (isGroup) {
        // Everyone gets an equal share
        const share = Math.floor(totalPot / players.length);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        onReward && onReward(share);
      } else {
        const userWins = winIdx >= 0 && teamList[winIdx]?.includes(userPi);
        if (userWins) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          onReward && onReward(totalPot);
        }
      }
    }
  };

  // Derived values for display
  const playerTotals = playerItems.map(items => items.reduce((s, it) => s + (it?.value || 0), 0));
  const teamTotals   = teamList.map(mi => mi.reduce((s, pi) => s + (playerTotals[pi] || 0), 0));
  const totalPot     = players.length * selectedCases.reduce((s, c) => s + (c.price || 0), 0);

  let payoutLabel = '';
  if (done) {
    if (isGroup) {
      payoutLabel = `Everyone gets ${Math.floor(totalPot / players.length).toLocaleString()} coins`;
    } else if (winnerTeamIdx >= 0) {
      const winnerCount = teamList[winnerTeamIdx]?.length || 1;
      payoutLabel = `Each winner gets ${Math.floor(totalPot / winnerCount).toLocaleString()} coins`;
    }
  }

  const caseItems = (selectedCases[currentRound] || selectedCases[0])?.items || [];

  // Active mode badges
  const activeModes = [
    isCrazy     && { icon: '🎭', label: 'Crazy', color: '#ec4899' },
    isTerminal  && { icon: '⚡', label: 'Terminal', color: '#f59e0b' },
    isGroup     && { icon: '🔄', label: 'Group', color: '#10b981' },
    isMagicSpin && { icon: '✨', label: 'Magic Spin', color: '#8b5cf6' },
    isFastMode  && { icon: '⚡', label: 'Fast', color: '#06b6d4' },
    isJackpot   && { icon: '👑', label: 'Jackpot', color: '#f59e0b' },
  ].filter(Boolean);

  return (
    <div className="space-y-4 relative">
      <ConfettiEffect active={showConfetti} />

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-white/40">{modeLabel || '1v1'}</p>
          <p className="text-sm font-bold text-white/60">
            Battle cost <span className="text-amber-400">{totalPot.toLocaleString()}</span>
          </p>
        </div>
        {/* Active mode pills */}
        {activeModes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {activeModes.map(m => (
              <span key={m.label} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: m.color + '22', color: m.color, border: `1px solid ${m.color}44` }}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {selectedCases.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300
              ${i < currentRound ? 'w-5 bg-violet-500'
                : i === currentRound ? 'w-5 bg-amber-400'
                : 'w-2 bg-white/10'}`} />
          ))}
        </div>
        <p className="text-xs font-bold text-white/50">
          Rounds {done ? totalRounds : currentRound + 1}/{totalRounds}
        </p>
      </div>

      {/* ── Terminal mode notice ── */}
      {isTerminal && !done && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400/80">Terminal mode — only the <strong>last round</strong> determines the winner.</p>
        </div>
      )}
      {isMagicSpin && !done && (
        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-400/20 rounded-xl px-3 py-2">
          <EyeOff className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <p className="text-xs text-violet-400/80">Magic Spin — epic & legendary items are hidden until the end.</p>
        </div>
      )}
      {isCrazy && !done && (
        <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-400/20 rounded-xl px-3 py-2">
          <span className="text-sm">🎭</span>
          <p className="text-xs text-pink-400/80">Crazy mode — the player with the <strong>lowest</strong> total wins!</p>
        </div>
      )}
      {isGroup && !done && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2">
          <span className="text-sm">🔄</span>
          <p className="text-xs text-green-400/80">Group mode — all profit is split equally among all players.</p>
        </div>
      )}

      {/* ── Jackpot Wheel ── */}
      {jackpotPhase && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <JackpotWheel
            teamList={teamList}
            players={players}
            playerTotals={players.map((_, pi) => getPlayerTotal(pi))}
            onWinner={(winnerTi) => setTimeout(() => finishBattle(winnerTi), 800)}
          />
        </motion.div>
      )}

      {/* ── Battle Over Banner ── */}
      {done && (
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5 text-center">
          <p className="text-2xl font-black text-white mb-1">🏆 The battle is over!</p>
          {payoutLabel && <p className="text-sm text-green-400 font-semibold mb-4">{payoutLabel}</p>}
          <div className="flex justify-center gap-8 flex-wrap">
            {teamList.map((mi, ti) => {
              const isW = isGroup || ti === winnerTeamIdx;
              return (
                <div key={ti} className={`flex flex-col items-center gap-2 ${isW ? '' : 'opacity-35'}`}>
                  <div className="flex gap-4">
                    {mi.map(pi => (
                      <div key={pi} className="flex flex-col items-center gap-1">
                        {isW && <span className="text-2xl">{isGroup ? '🎁' : '👑'}</span>}
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                          style={{ background: TEAM_COLORS[ti] + '33', border: `2px solid ${TEAM_COLORS[ti]}88` }}>
                          {players[pi]?.isBot ? '🤖' : players[pi]?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <p className="text-xs text-white/60">{players[pi]?.name}</p>
                        <p className="text-sm font-bold text-amber-400">{playerTotals[pi]?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAM_COLORS[ti] }}>
                    {teamList.length > 1 ? `Team ${ti+1}: ` : ''}{teamTotals[ti]?.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-5">
            <Button onClick={onClose} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-12 h-11">
              Done
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── Countdown overlay ── */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75">
            <motion.div key={countdown}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-[10rem] font-black text-white drop-shadow-2xl select-none">
              {countdown === 0 ? '🎲' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player Grid ── */}
      <div className="flex gap-2 items-start">
        {teamList.map((mi, ti) => (
          <React.Fragment key={ti}>
            <div className="flex-1 min-w-0 space-y-2">
              {teamList.length > 1 && (
                <div className="text-center">
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full"
                    style={{ background: TEAM_COLORS[ti] + '33', color: TEAM_COLORS[ti] }}>
                    Team {ti + 1}{done ? ` · ${teamTotals[ti]?.toLocaleString()}` : ''}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                {mi.map(pi => (
                  <PlayerColumn
                    key={pi}
                    player={players[pi]}
                    teamColor={TEAM_COLORS[ti]}
                    isWinner={done && (isGroup || ti === winnerTeamIdx)}
                    wonItems={playerItems[pi] || []}
                    isSpinning={spinning}
                    caseItems={caseItems}
                    spinnerKey={`${currentRound}-${pi}`}
                    spinnerItem={spinners[pi]}
                    onSpinDone={handleSpinDone}
                    fast={isFastMode}
                    magicSpin={isMagicSpin && !done}
                  />
                ))}
              </div>
            </div>
            {ti < teamList.length - 1 && (
              <div className="flex items-start justify-center pt-10 px-1">
                <span className="text-white/20 font-black text-sm">VS</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}