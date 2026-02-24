import React from 'react';
import { Coins, Zap, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WalletBar({ balance, level, xpProgress, compact }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">{(balance || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/80">Lv {level || 1}</span>
        </div>
        <Link to={createPageUrl('Deposit')}>
          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full h-8 px-3 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Balance</p>
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              {(balance || 0).toLocaleString()}
            </span>
          </div>
        </div>
        <Link to={createPageUrl('Deposit')}>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Deposit
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-violet-500/10 rounded-lg px-3 py-1.5">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">Level {level || 1}</span>
        </div>
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress || 0}%` }}
          />
        </div>
        <span className="text-xs text-white/40">{Math.round(xpProgress || 0)}%</span>
      </div>
    </div>
  );
}