import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader, ArrowDown, ArrowUp, Gift, Tag } from 'lucide-react';

// Only balance/financial transactions — no game transactions here
const WALLET_TYPES = {
  'deposit':        { icon: ArrowDown, label: 'Deposit', color: 'text-green-400' },
  'item_sell':      { icon: Tag, label: 'Item Sold', color: 'text-green-400' },
  'daily_reward':   { icon: Gift, label: 'Daily Reward', color: 'text-yellow-400' },
  'referral_bonus': { icon: Gift, label: 'Referral Bonus', color: 'text-yellow-400' },
};

const WALLET_TYPE_KEYS = Object.keys(WALLET_TYPES);

export default function TransactionsView({ userEmail }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const txs = await base44.entities.Transaction.filter({ user_email: userEmail }, '-created_date', 200);
        const walletTxs = txs.filter(t => WALLET_TYPE_KEYS.includes(t.type));
        setTransactions(walletTxs.slice(0, 100));
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
      setLoading(false);
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader className="w-5 h-5 text-violet-400 animate-spin" />
    </div>
  );

  if (transactions.length === 0) return (
    <div className="text-center py-8">
      <ArrowDown className="w-12 h-12 text-white/20 mx-auto mb-3" />
      <p className="text-white/40">No transactions yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = WALLET_TYPES[tx.type] || { icon: ArrowDown, label: tx.type, color: 'text-white/50' };
        const Icon = config.icon;
        const isCredit = (tx.amount || 0) > 0;

        return (
          <div key={tx.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
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
                  <p className="text-xs text-white/40 mt-1">Balance: ${(tx.balance_after || 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}