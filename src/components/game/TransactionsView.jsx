import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader, ArrowDown, ArrowUp, Gift, User } from 'lucide-react';

const TRANSACTION_ICONS = {
  'deposit': { icon: ArrowDown, label: 'Deposit', color: 'text-green-400' },
  'withdrawal': { icon: ArrowUp, label: 'Withdrawal', color: 'text-blue-400' },
  'case_purchase': { icon: ArrowUp, label: 'Case Purchase', color: 'text-red-400' },
  'case_win': { icon: ArrowDown, label: 'Case Win', color: 'text-green-400' },
  'item_sell': { icon: ArrowDown, label: 'Item Sold', color: 'text-green-400' },
  'battle_entry': { icon: ArrowUp, label: 'Battle Entry', color: 'text-red-400' },
  'battle_win': { icon: ArrowDown, label: 'Battle Win', color: 'text-green-400' },
  'coinflip_bet': { icon: ArrowUp, label: 'Coinflip Bet', color: 'text-red-400' },
  'coinflip_win': { icon: ArrowDown, label: 'Coinflip Win', color: 'text-green-400' },
  'crash_bet': { icon: ArrowUp, label: 'Crash Bet', color: 'text-red-400' },
  'crash_win': { icon: ArrowDown, label: 'Crash Win', color: 'text-green-400' },
  'daily_reward': { icon: Gift, label: 'Daily Reward', color: 'text-yellow-400' },
  'referral_bonus': { icon: Gift, label: 'Referral Bonus', color: 'text-yellow-400' },
  'upgrade_loss': { icon: ArrowUp, label: 'Upgrade Loss', color: 'text-red-400' },
  'upgrade_win': { icon: ArrowDown, label: 'Upgrade Win', color: 'text-green-400' },
};

export default function TransactionsView({ userEmail }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const txs = await base44.entities.Transaction.filter({ 
          user_email: userEmail 
        });
        
        const sorted = txs
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 100);
        
        setTransactions(sorted);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
      setLoading(false);
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <ArrowDown className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = TRANSACTION_ICONS[tx.type] || { 
          icon: ArrowDown, 
          label: tx.type, 
          color: 'text-white/50' 
        };
        const Icon = config.icon;
        const isCredit = (tx.amount || 0) > 0;

        return (
          <div
            key={tx.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{config.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(tx.created_date).toLocaleDateString()} • {new Date(tx.created_date).toLocaleTimeString()}
                  </p>
                  {tx.description && (
                    <p className="text-xs text-white/30 mt-1 truncate">{tx.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                  {isCredit ? '+' : ''}{(tx.amount || 0).toLocaleString()}
                </p>
                {tx.balance_after && (
                  <p className="text-xs text-white/40 mt-1">
                    Balance: ${(tx.balance_after || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}