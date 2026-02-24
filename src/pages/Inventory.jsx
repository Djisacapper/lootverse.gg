import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useWallet, getRarityColor, getRarityBorder, getRarityGlow } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Backpack, Coins, Sparkles, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Inventory() {
  const { user, balance, updateBalance, loading: walletLoading } = useWallet();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRarity, setFilterRarity] = useState('all');

  useEffect(() => {
    if (!user) return;
    base44.entities.UserInventory.filter(
      { user_email: user.email, status: 'owned' },
      '-created_date'
    ).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [user]);

  const handleSell = async (item) => {
    // Optimistically remove from UI first
    setItems(prev => prev.filter(i => i.id !== item.id));
    await base44.entities.UserInventory.update(item.id, { status: 'sold' });
    const newBal = await updateBalance(item.value, 'item_sell', `Sold ${item.item_name}`);
    // Force re-read balance into local state
    reload();
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'value_high') return (b.value || 0) - (a.value || 0);
    if (sortBy === 'value_low') return (a.value || 0) - (b.value || 0);
    return 0;
  });

  const filteredItems = sortedItems.filter(item => {
    return filterRarity === 'all' || item.rarity === filterRarity;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Inventory</h1>
          <p className="text-white/40 text-sm">{items.length} items · {totalValue.toLocaleString()} coins total</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterRarity} onValueChange={setFilterRarity}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="value_high">Value: High</SelectItem>
              <SelectItem value="value_low">Value: Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="w-16 h-16 bg-white/5 rounded-xl mx-auto mb-3" />
              <div className="h-3 bg-white/5 rounded mb-2 w-2/3 mx-auto" />
              <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Backpack className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-4">Your inventory is empty</p>
          <Link to={createPageUrl('Cases')}>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl">
              Open Cases
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`glass rounded-2xl p-4 text-center border ${getRarityBorder(item.rarity)} group hover:scale-[1.02] transition-all`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center mx-auto mb-3`}>
                {item.item_image_url ? (
                  <img src={item.item_image_url} alt="" className="w-12 h-12 object-contain" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white" />
                )}
              </div>
              <Badge className={`mb-2 bg-gradient-to-r ${getRarityColor(item.rarity)} text-white border-0 text-[9px] uppercase`}>
                {item.rarity}
              </Badge>
              <p className="text-xs font-medium text-white/80 mb-1 truncate">{item.item_name}</p>
              <p className="text-sm font-bold text-amber-400 mb-3">{item.value?.toLocaleString()}</p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={() => handleSell(item)}
                  className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20 text-[10px] h-7 rounded-lg"
                >
                  <Coins className="w-3 h-3 mr-1" /> Sell
                </Button>
                <Link to={createPageUrl('Upgrade') + `?itemId=${item.id}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-white/10 text-white/60 hover:bg-white/5 text-[10px] h-7 rounded-lg"
                  >
                    Upgrade
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}