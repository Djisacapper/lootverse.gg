import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getRarityColor, getRarityBorder } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

export default function LiveFeed() {
  const [recentWins, setRecentWins] = useState([]);

  useEffect(() => {
    const load = async () => {
      const items = await base44.entities.UserInventory.list('-created_date', 10);
      setRecentWins(items.filter(i => i.status === 'owned'));
    };
    load();

    const unsub = base44.entities.UserInventory.subscribe((event) => {
      if (event.type === 'create') {
        setRecentWins(prev => [event.data, ...prev].slice(0, 10));
      }
    });
    return unsub;
  }, []);

  if (recentWins.length === 0) return null;

  return (
    <div className="w-full overflow-hidden py-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] uppercase tracking-widest text-white/30 font-medium">Live Drops</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <AnimatePresence mode="popLayout">
          {recentWins.map((item, i) => (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`flex-shrink-0 glass rounded-xl px-3 py-2 flex items-center gap-2 border ${getRarityBorder(item.rarity)}`}
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center`}>
                <Trophy className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/80 truncate max-w-[80px]">{item.item_name}</p>
                <p className="text-[10px] text-amber-400 font-semibold">{item.value?.toLocaleString()} coins</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}