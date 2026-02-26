import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Plus } from 'lucide-react';
import { getRarityColor } from './useWallet';

export default function CasePickerModal({ open, onOpenChange, cases, onAddCase }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('price_desc');

  const filtered = cases
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'price_asc') return a.price - b.price;
      return (b.total_opened || 0) - (a.total_opened || 0);
    });

  const rarityForCase = (c) => {
    if (c.price >= 5000) return 'legendary';
    if (c.price >= 1000) return 'epic';
    if (c.price >= 500) return 'rare';
    if (c.price >= 100) return 'uncommon';
    return 'common';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#13131e] border-white/10 text-white max-w-3xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-lg font-bold">Select Cases</DialogTitle>
        </DialogHeader>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search for cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(c => {
              const rarity = rarityForCase(c);
              return (
                <div
                  key={c.id}
                  className="bg-white/[0.04] border border-white/8 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-white/20 transition-all"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRarityColor(rarity)} flex items-center justify-center overflow-hidden`}>
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-violet-300 text-center leading-tight">{c.name}</p>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <div className="w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
                      <span className="text-[7px] font-black text-black">$</span>
                    </div>
                    {c.price?.toLocaleString()}
                  </div>
                  <button
                    onClick={() => onAddCase(c)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Case
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}