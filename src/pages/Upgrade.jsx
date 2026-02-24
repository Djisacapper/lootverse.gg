import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, getRarityColor, getRarityGlow } from '../components/game/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const UPGRADE_TARGETS = [
  { name: 'Bronze Bundle', rarity: 'uncommon', value: 250 },
  { name: 'Silver Stash', rarity: 'rare', value: 500 },
  { name: 'Gold Cache', rarity: 'epic', value: 1500 },
  { name: 'Diamond Vault', rarity: 'legendary', value: 5000 },
  { name: 'Emerald Crown', rarity: 'legendary', value: 10000 },
];

export default function Upgrade() {
  const { user, balance, updateBalance, addXp } = useWallet();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetItem, setTargetItem] = useState(UPGRADE_TARGETS[1]);
  const [upgrading, setUpgrading] = useState(false);
  const [result, setResult] = useState(null); // 'win' | 'lose'

  useEffect(() => {
    if (!user) return;
    base44.entities.UserInventory.filter(
      { user_email: user.email, status: 'owned' },
      '-value'
    ).then(setItems);
  }, [user]);

  const chance = selectedItem
    ? Math.min(95, Math.max(5, Math.round((selectedItem.value / targetItem.value) * 100)))
    : 0;

  const handleUpgrade = async () => {
    if (!selectedItem || upgrading) return;

    setUpgrading(true);
    setResult(null);

    // Wait for animation
    await new Promise(r => setTimeout(r, 2000));

    const won = Math.random() * 100 < chance;

    if (won) {
      setResult('win');
      // Mark old item as upgraded
      await base44.entities.UserInventory.update(selectedItem.id, { status: 'upgraded' });
      // Create new item
      await base44.entities.UserInventory.create({
        user_email: user.email,
        item_name: targetItem.name,
        rarity: targetItem.rarity,
        value: targetItem.value,
        source: 'upgrade',
        status: 'owned',
      });
      await updateBalance(0, 'upgrade_win', `Upgraded to ${targetItem.name}`);
      await addXp(100);
    } else {
      setResult('lose');
      await base44.entities.UserInventory.update(selectedItem.id, { status: 'destroyed' });
      await updateBalance(0, 'upgrade_loss', `Failed upgrade, lost ${selectedItem.item_name}`);
    }

    // Refresh inventory
    const refreshed = await base44.entities.UserInventory.filter(
      { user_email: user.email, status: 'owned' },
      '-value'
    );
    setItems(refreshed);
    setUpgrading(false);
  };

  const handleReset = () => {
    setSelectedItem(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Upgrade</h1>
        <p className="text-white/40 text-sm">Risk an item for a chance at something better</p>
      </div>

      {/* Upgrade Arena */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Selected Item */}
          <div className="flex-1 text-center w-full">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Your Item</p>
            {selectedItem ? (
              <div className={`glass rounded-2xl p-6 border ${selectedItem ? 'border-white/10' : 'border-white/5'}`}>
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRarityColor(selectedItem.rarity)} flex items-center justify-center mx-auto mb-3`}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">{selectedItem.item_name}</p>
                <p className="text-lg font-bold text-amber-400">{selectedItem.value?.toLocaleString()} coins</p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 border border-dashed border-white/10 text-white/20">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8" />
                </div>
                <p className="text-sm">Select an item below</p>
              </div>
            )}
          </div>

          {/* Arrow + Chance */}
          <div className="flex flex-col items-center gap-2 py-4">
            {upgrading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-8 h-8 text-violet-400" />
              </motion.div>
            ) : result === 'win' ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : result === 'lose' ? (
              <XCircle className="w-10 h-10 text-red-400" />
            ) : (
              <ArrowRight className="w-8 h-8 text-white/20" />
            )}
            <div className={`text-2xl font-bold ${chance >= 50 ? 'text-green-400' : chance >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
              {chance}%
            </div>
            <p className="text-[10px] text-white/30">Success Rate</p>
          </div>

          {/* Target Item */}
          <div className="flex-1 text-center w-full">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Target Item</p>
            <div className={`glass rounded-2xl p-6 border border-white/10`}>
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRarityColor(targetItem.rarity)} flex items-center justify-center mx-auto mb-3 ${getRarityGlow(targetItem.rarity)} shadow-2xl`}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">{targetItem.name}</p>
              <p className="text-lg font-bold text-amber-400">{targetItem.value?.toLocaleString()} coins</p>
            </div>
          </div>
        </div>

        {/* Result message */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center mt-6 p-4 rounded-xl ${
                result === 'win' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p className={`text-lg font-bold ${result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                {result === 'win' ? `🎉 Upgrade Successful! You got ${targetItem.name}!` : `💥 Upgrade Failed! Item destroyed.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <div className="flex justify-center mt-6 gap-3">
          {result ? (
            <Button onClick={handleReset} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl h-12 px-8">
              Try Again
            </Button>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={!selectedItem || upgrading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl h-12 px-8 disabled:opacity-50"
            >
              {upgrading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {upgrading ? 'Upgrading...' : 'Upgrade'}
            </Button>
          )}
        </div>
      </div>

      {/* Target Selection */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-3">Choose Target</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {UPGRADE_TARGETS.map((t) => (
            <button
              key={t.name}
              onClick={() => { setTargetItem(t); setResult(null); }}
              className={`glass rounded-xl p-3 text-center transition-all border
                ${targetItem.name === t.name
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/5 hover:border-white/10'
                }`}
            >
              <p className="text-xs font-medium text-white/80">{t.name}</p>
              <p className="text-sm font-bold text-amber-400">{t.value.toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Selection */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 mb-3">Select Item to Upgrade</h3>
        {items.length === 0 ? (
          <p className="text-white/30 text-sm">No items in inventory</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setResult(null); }}
                className={`glass rounded-xl p-3 text-center transition-all border
                  ${selectedItem?.id === item.id
                    ? 'border-amber-400/40 bg-amber-500/10'
                    : 'border-white/5 hover:border-white/10'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center mx-auto mb-1.5`}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-[10px] text-white/70 truncate">{item.item_name}</p>
                <p className="text-xs font-bold text-amber-400">{item.value?.toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}