import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Swords, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Coinflip() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedSide, setSelectedSide] = useState('heads');
  const [flipping, setFlipping] = useState(null);
  const [flipResult, setFlipResult] = useState(null);

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

  const handleCreate = async () => {
    if (betAmount <= 0 || betAmount > balance) return;
    await updateBalance(-betAmount, 'coinflip_bet', `Created coinflip for ${betAmount}`);
    await base44.entities.CoinflipGame.create({
      creator_email: user.email,
      creator_name: user.full_name || 'Anonymous',
      creator_side: selectedSide,
      bet_amount: betAmount,
      status: 'waiting',
    });
    setShowCreate(false);
    loadGames();
  };

  const handleJoin = async (game) => {
    if (game.bet_amount > balance) return;

    await updateBalance(-game.bet_amount, 'coinflip_bet', `Joined coinflip for ${game.bet_amount}`);

    // Flip the coin
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerEmail = result === game.creator_side ? game.creator_email : user.email;

    setFlipping(game.id);
    setFlipResult({ result, winnerEmail, game });

    // Animate
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
      }, 2000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Coinflip</h1>
          <p className="text-white/40 text-sm">Pick a side, bet your coins, winner takes all</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Game
        </Button>
      </div>

      {/* Flip Result Overlay */}
      <AnimatePresence>
        {flipping && flipResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div className="text-center">
              <motion.div
                animate={{ rotateY: [0, 1800] }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-2xl glow-gold"
              >
                <span className="text-4xl font-bold text-white">{flipResult.result === 'heads' ? 'H' : 'T'}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                <p className="text-2xl font-bold text-white mb-2">
                  {flipResult.result === 'heads' ? '👑 Heads!' : '🪙 Tails!'}
                </p>
                <p className={`text-lg font-semibold ${flipResult.winnerEmail === user?.email ? 'text-green-400' : 'text-red-400'}`}>
                  {flipResult.winnerEmail === user?.email ? `You won ${flipResult.game.bet_amount * 2} coins!` : 'You lost!'}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Games */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <Coins className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-4">No active games</p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl"
          >
            Create First Game
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-white/5 hover:border-amber-400/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                    {game.creator_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{game.creator_name}</p>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] uppercase">
                      {game.creator_side}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/30">Bet Amount</p>
                  <p className="text-lg font-bold text-amber-400">{game.bet_amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <Swords className="w-3.5 h-3.5" />
                  <span>vs Anyone</span>
                </div>
                {game.creator_email !== user?.email ? (
                  <Button
                    onClick={() => handleJoin(game)}
                    disabled={game.bet_amount > balance}
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl"
                  >
                    <Swords className="w-3.5 h-3.5 mr-1.5" /> Join
                  </Button>
                ) : (
                  <Badge className="bg-white/5 text-white/30 border-white/10">Your Game</Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#16161f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Create Coinflip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-white/50 mb-2 block">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white rounded-xl"
                min={1}
                max={balance}
              />
              <p className="text-xs text-white/30 mt-1">Balance: {balance?.toLocaleString()} coins</p>
            </div>
            <div>
              <label className="text-sm text-white/50 mb-2 block">Pick Your Side</label>
              <div className="flex gap-3">
                {['heads', 'tails'].map(side => (
                  <button
                    key={side}
                    onClick={() => setSelectedSide(side)}
                    className={`flex-1 py-4 rounded-xl border transition-all text-center capitalize font-semibold
                      ${selectedSide === side
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                  >
                    <Crown className="w-8 h-8 mx-auto mb-2" />
                    {side}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={betAmount <= 0 || betAmount > balance}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl h-12"
            >
              Create Game ({betAmount?.toLocaleString()} coins)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}