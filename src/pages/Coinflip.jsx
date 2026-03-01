import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { safeAvatarUrl } from '../components/game/usePlayerAvatars';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

function CoinDisplay({ side, size = 'md', spinning = false }) {
  const sizeMap = { sm: 40, md: 64, lg: 96 };
  const px = sizeMap[size];
  const fs = { sm: '1.1rem', md: '1.6rem', lg: '2.5rem' }[size];
  // heads = rotateY 0 (front), tails = rotateY 180 (back)
  // When spinning, do many full rotations and land on the correct face
  const landAngle = side === 'tails' ? 180 : 0;
  const spinEnd = 1440 + landAngle; // 4 full flips + land angle

  return (
    <div style={{ width: px, height: px, perspective: px * 6, flexShrink: 0 }}>
      <motion.div
        animate={spinning
          ? { rotateY: [0, spinEnd] }
          : { rotateY: landAngle }
        }
        transition={spinning
          ? { duration: 2.4, ease: [0.25, 0.1, 0.25, 1] }
          : { duration: 0 }
        }
        style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Heads face (front) */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fde68a, #f59e0b 50%, #92400e)',
          boxShadow: '0 0 28px rgba(245,158,11,0.6), inset -4px -4px 12px rgba(0,0,0,0.3), inset 4px 4px 10px rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs,
        }}>
          👑
        </div>
        {/* Tails face (back, rotated 180) */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #e2e8f0, #64748b 50%, #1e293b)',
          boxShadow: '0 0 28px rgba(148,163,184,0.5), inset -4px -4px 12px rgba(0,0,0,0.3), inset 4px 4px 10px rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs,
        }}>
          🔱
        </div>
      </motion.div>
    </div>
  );
}

function PlayerAvatar({ avatarUrl, name, size = 8 }) {
  const px = `w-${size} h-${size}`;
  const safe = safeAvatarUrl(avatarUrl);
  return (
    <div className={`${px} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0`}>
      {safe
        ? <img src={safe} alt="" className="w-full h-full object-cover" />
        : (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

function GameCard({ game, user, balance, onJoin, onAddBot }) {
  const isOwn = game.creator_email === user?.email;
  const opponentSide = game.creator_side === 'heads' ? 'tails' : 'heads';
  const pot = game.bet_amount * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-white/[0.07] bg-[#13131e] overflow-hidden hover:border-amber-400/20 transition-all duration-200 group"
    >
      {/* Top accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0" />

      <div className="p-4">
        {/* Players row */}
        <div className="flex items-center gap-3 mb-4">
          {/* Creator */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <CoinDisplay side={game.creator_side} size="sm" />
            <PlayerAvatar avatarUrl={game.creator_avatar_url} name={game.creator_name} />
            <p className="text-[11px] text-white/60 truncate max-w-[70px] text-center">{game.creator_name}</p>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
              ${game.creator_side === 'heads' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-300'}`}>
              {game.creator_side}
            </span>
          </div>

          {/* VS + Pot */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-white/20 tracking-widest">VS</span>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-wider">Pot</p>
              <p className="text-sm font-black text-amber-400">{pot.toLocaleString()}</p>
            </div>
          </div>

          {/* Opponent slot */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <CoinDisplay side={opponentSide} size="sm" />
            <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-dashed border-white/15 flex items-center justify-center">
              <span className="text-white/20 text-sm">?</span>
            </div>
            <p className="text-[11px] text-white/25">Waiting...</p>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
              ${opponentSide === 'heads' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-300'}`}>
              {opponentSide}
            </span>
          </div>
        </div>

        {/* Action */}
        {isOwn ? (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center h-9 rounded-xl border border-white/[0.07] bg-white/[0.03]">
              <span className="text-xs text-white/25 font-medium">Waiting for opponent...</span>
            </div>
            <button
              onClick={() => onAddBot(game)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-xs font-bold transition-all"
            >
              🤖 Add Bot
            </button>
          </div>
        ) : (
          <Button
            onClick={() => onJoin(game)}
            disabled={game.bet_amount > balance}
            className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Swords className="w-3.5 h-3.5 mr-1.5" />
            Join for {game.bet_amount.toLocaleString()} coins
          </Button>
        )}
      </div>
    </motion.div>
  );
}

const BOT_NAMES = ['CoinBot', 'FlipMaster', 'LuckyBot', 'RNGod', 'ShadowBot', 'CryptoBot'];

function CreatePanel({ balance, onClose, onCreate }) {
  const [amount, setAmount] = useState(1000);
  const [side, setSide] = useState('heads');
  const [vsBot, setVsBot] = useState(false);

  const canCreate = amount > 0 && amount <= balance;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-amber-400/20 bg-[#13131e] p-5 mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-white text-base">Create Coinflip</p>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Opponent picker */}
      <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Opponent</p>
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setVsBot(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all
            ${!vsBot ? 'border-blue-400/50 bg-blue-500/10 text-blue-300' : 'border-white/[0.07] bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'}`}
        >
          <span>👤</span> Real Player
        </button>
        <button
          onClick={() => setVsBot(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all
            ${vsBot ? 'border-violet-400/50 bg-violet-500/10 text-violet-300' : 'border-white/[0.07] bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'}`}
        >
          <span>🤖</span> vs Bot
        </button>
      </div>

      {/* Side picker */}
      <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Pick your side</p>
      <div className="flex gap-3 mb-5">
        {['heads', 'tails'].map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200
              ${side === s
                ? s === 'heads' ? 'border-amber-400/50 bg-amber-500/10' : 'border-slate-400/50 bg-slate-500/10'
                : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
          >
            <CoinDisplay side={s} size="sm" />
            <span className={`text-xs font-bold capitalize ${side === s ? (s === 'heads' ? 'text-amber-400' : 'text-slate-300') : 'text-white/40'}`}>
              {s}
            </span>
          </button>
        ))}
      </div>

      {/* Amount */}
      <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Bet amount</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {QUICK_AMOUNTS.map(v => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all
              ${amount === v ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white border border-transparent'}`}
          >
            {v.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-amber-400/40 mb-1"
        min={1}
        max={balance}
      />
      <p className="text-[11px] text-white/25 mb-4">Balance: {balance?.toLocaleString()} coins</p>

      <Button
        onClick={() => onCreate(amount, side, vsBot)}
        disabled={!canCreate}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-white disabled:opacity-40"
      >
        {vsBot ? '🤖 Play vs Bot' : '🎲 Create Game'} — Win {(amount * 2).toLocaleString()} coins
      </Button>
    </motion.div>
  );
}

function FlipOverlay({ flipResult, user }) {
  const won = flipResult?.winnerEmail === user?.email;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="text-center flex flex-col items-center gap-6">
        <CoinDisplay side={flipResult?.result} size="lg" spinning />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="space-y-2"
        >
          <p className="text-3xl font-black text-white">
            {flipResult?.result === 'heads' ? '👑 Heads!' : '🔱 Tails!'}
          </p>
          <p className={`text-xl font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
            {won
              ? `+${(flipResult.game.bet_amount * 2).toLocaleString()} coins!`
              : 'Better luck next time!'}
          </p>
          <p className="text-white/30 text-sm">{won ? '🎉 You won!' : '😔 You lost'}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Coinflip() {
  const { user, balance, updateBalance, addXp, addRakeback } = useWallet();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [flipping, setFlipping] = useState(null);
  const [flipResult, setFlipResult] = useState(null);

  const handleAddBot = async (game) => {
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const botSide = game.creator_side === 'heads' ? 'tails' : 'heads';
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerEmail = result === game.creator_side ? game.creator_email : 'bot@system';

    await base44.entities.CoinflipGame.update(game.id, {
      opponent_email: 'bot@system',
      opponent_name: botName,
      status: 'completed',
      result,
      winner_email: winnerEmail,
    });

    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });

    setTimeout(async () => {
      if (winnerEmail === user.email) {
        await updateBalance(game.bet_amount * 2, 'coinflip_win', `Won coinflip vs bot for ${game.bet_amount * 2}`);
        await addXp(50);
      }
      setTimeout(() => { setFlipping(null); setFlipResult(null); loadGames(); }, 2500);
    }, 2000);
  };

  useEffect(() => {
    loadGames();
    const unsub = base44.entities.CoinflipGame.subscribe(() => loadGames());
    return unsub;
  }, []);

  const loadGames = async () => {
    const data = await base44.entities.CoinflipGame.filter({ status: 'waiting' }, '-created_date', 20);
    setGames(data);
    setLoading(false);
  };

  const handleCreate = async (amount, side, vsBot = false) => {
    if (amount <= 0 || amount > balance) return;
    await updateBalance(-amount, 'coinflip_bet', `Created coinflip for ${amount}`);
    addRakeback(amount);

    // Always fetch fresh user so avatar_url is current
    const freshUser = await base44.auth.me().catch(() => user);
    const creatorName = freshUser?.username || freshUser?.full_name || 'Anonymous';
    const creatorAvatar = safeAvatarUrl(freshUser?.avatar_url);

    if (vsBot) {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const winnerEmail = result === side ? freshUser.email : `bot@system`;

      const game = await base44.entities.CoinflipGame.create({
        creator_email: freshUser.email,
        creator_name: creatorName,
        creator_avatar_url: creatorAvatar,
        creator_side: side,
        bet_amount: amount,
        opponent_email: 'bot@system',
        opponent_name: botName,
        status: 'completed',
        result,
        winner_email: winnerEmail,
      });

      setShowCreate(false);
      setFlipping(game.id);
      setFlipResult({ result, winnerEmail, game: { ...game, bet_amount: amount } });

      setTimeout(async () => {
        if (winnerEmail === freshUser.email) {
          await updateBalance(amount * 2, 'coinflip_win', `Won coinflip vs bot for ${amount * 2}`);
          await addXp(50);
        }
        setTimeout(() => { setFlipping(null); setFlipResult(null); loadGames(); }, 2500);
      }, 2000);
    } else {
      await base44.entities.CoinflipGame.create({
        creator_email: freshUser.email,
        creator_name: creatorName,
        creator_avatar_url: creatorAvatar,
        creator_side: side,
        bet_amount: amount,
        status: 'waiting',
      });
      setShowCreate(false);
      loadGames();
    }
  };

  const handleJoin = async (game) => {
    if (game.bet_amount > balance) return;
    await updateBalance(-game.bet_amount, 'coinflip_bet', `Joined coinflip for ${game.bet_amount}`);
    addRakeback(game.bet_amount);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerEmail = result === game.creator_side ? game.creator_email : user.email;
    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });

    setTimeout(async () => {
      const winnings = game.bet_amount * 2;
      await base44.entities.CoinflipGame.update(game.id, {
        opponent_email: user.email,
        opponent_name: user.full_name || 'Anonymous',
        status: 'completed',
        result,
        winner_email: winnerEmail,
      });
      if (winnerEmail === user.email) {
        await updateBalance(winnings, 'coinflip_win', `Won coinflip for ${winnings}`);
        await addXp(50);
      }
      setTimeout(() => {
        setFlipping(null);
        setFlipResult(null);
        loadGames();
      }, 2500);
    }, 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-[#0a0805] via-[#1a1815] to-[#0d0c0a] -mx-4 md:-mx-5 lg:-mx-6 px-4 md:px-5 lg:px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-black text-[#00d9ff] tracking-tight">Coinflip</h1>
            <p className="text-[#00d9ff]/50 text-sm mt-0.5">Pick a side · Winner takes all</p>
          </div>
          <Button
            onClick={() => setShowCreate(v => !v)}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#00d9ff] to-[#ff006e] hover:from-[#00d9ff]/90 hover:to-[#ff006e]/90 font-bold text-sm text-[#0a0a15]"
          >
          <Plus className="w-4 h-4 mr-1.5" /> Create
        </Button>
      </div>

      {/* Create panel */}
      <AnimatePresence>
        {showCreate && (
          <CreatePanel
            balance={balance}
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>

      {/* Games grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#13131e] h-44 animate-pulse border border-white/[0.05]" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <CoinDisplay side="heads" size="lg" />
          <div>
            <p className="text-white/40 font-medium">No active games</p>
            <p className="text-white/20 text-sm">Be the first to create one!</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm"
          >
            Create Game
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              user={user}
              balance={balance}
              onJoin={handleJoin}
              onAddBot={handleAddBot}
            />
          ))}
        </div>
      )}

      {/* Flip overlay */}
      <AnimatePresence>
        {flipping && flipResult && (
          <FlipOverlay flipResult={flipResult} user={user} />
        )}
      </AnimatePresence>
    </div>
  );
}