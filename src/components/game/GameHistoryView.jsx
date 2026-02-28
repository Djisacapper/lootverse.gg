import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Swords, Box, Coins, TrendingUp, Loader, CheckCircle2, XCircle } from 'lucide-react';

const GAME_MODE_ICONS = {
  'case_purchase': { icon: Box, label: 'Case Opening' },
  'battle_entry': { icon: Swords, label: 'Battle' },
  'coinflip_bet': { icon: Coins, label: 'Coinflip' },
  'crash_bet': { icon: TrendingUp, label: 'Crash' },
};

export default function GameHistoryView({ userEmail }) {
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameHistory = async () => {
      setLoading(true);
      try {
        // Fetch battles
        const battles = await base44.asServiceRole.entities.CaseBattle.filter({ creator_email: userEmail });
        const battleHistory = battles.map(b => ({
          id: b.id,
          type: 'battle_entry',
          gameMode: 'Battle',
          amount: b.entry_cost,
          winner: b.winner_email,
          result: b.winner_email === userEmail ? 'Win' : b.status === 'completed' ? 'Loss' : 'Pending',
          timestamp: b.created_date,
          icon: Swords,
        }));

        // Fetch transactions to get other game history
        const transactions = await base44.entities.Transaction.filter({ 
          user_email: userEmail 
        });
        
        const otherGameHistory = transactions
          .filter(t => Object.keys(GAME_MODE_ICONS).includes(t.type))
          .map(t => ({
            id: t.id,
            type: t.type,
            gameMode: GAME_MODE_ICONS[t.type]?.label || 'Game',
            amount: Math.abs(t.amount || 0),
            result: t.amount > 0 ? 'Win' : 'Loss',
            timestamp: t.created_date,
            description: t.description,
            icon: GAME_MODE_ICONS[t.type]?.icon || Box,
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setGameHistory(otherGameHistory.slice(0, 50));
      } catch (error) {
        console.error('Failed to fetch game history:', error);
      }
      setLoading(false);
    };

    fetchGameHistory();
    const interval = setInterval(fetchGameHistory, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (gameHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <Box className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40">No game history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {gameHistory.map((game) => {
        const Icon = game.icon;
        const isWin = game.result === 'Win';
        return (
          <div
            key={game.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{game.gameMode}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isWin 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {isWin ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {game.result}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    ID: {game.id.slice(0, 8)}... • {new Date(game.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {isWin ? '+' : '-'}${game.amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}