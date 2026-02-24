import React, { useState } from 'react';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Coins, Plus, Sparkles, CheckCircle, CreditCard, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

export default function Deposit() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [amount, setAmount] = useState(1000);
  const [depositing, setDepositing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    if (amount <= 0 || depositing) return;
    setDepositing(true);

    // Simulate deposit (in production would go through payment processor)
    await new Promise(r => setTimeout(r, 1500));
    await updateBalance(amount, 'deposit', `Deposited ${amount} coins`);
    await addXp(Math.floor(amount / 50));

    setDepositing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Deposit</h1>
        <p className="text-white/40 text-sm">Add coins to your balance</p>
      </div>

      {/* Current Balance */}
      <div className="glass rounded-2xl p-6 border border-white/5 text-center">
        <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Current Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="w-8 h-8 text-amber-400" />
          <span className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
            {(balance || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Deposit Card */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Add Coins</h2>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all border
                ${amount === a
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                }`}
            >
              {a.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mb-6">
          <label className="text-sm text-white/40 mb-2 block">Custom Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="bg-white/5 border-white/10 text-white text-lg rounded-xl h-12"
            min={1}
          />
        </div>

        {/* Success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-500/10 text-green-400 p-4 rounded-xl border border-green-500/20 mb-4"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Successfully deposited {amount.toLocaleString()} coins!</span>
          </motion.div>
        )}

        {/* Deposit button */}
        <Button
          onClick={handleDeposit}
          disabled={depositing || amount <= 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-14 text-lg"
        >
          {depositing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <CreditCard className="w-5 h-5 mr-2" />
          )}
          {depositing ? 'Processing...' : `Deposit ${amount.toLocaleString()} Coins`}
        </Button>

        <p className="text-[11px] text-white/20 text-center mt-4">
          Demo mode — coins are added instantly for testing purposes
        </p>
      </div>

      {/* Bonus info */}
      <div className="glass rounded-2xl p-5 border border-amber-400/10 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Deposit Bonus</p>
            <p className="text-xs text-white/40">Earn XP with every deposit. Level up to unlock exclusive rewards and better rakeback rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}