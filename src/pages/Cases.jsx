import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Box, Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['all', 'budget', 'standard', 'premium', 'legendary', 'event'];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then((data) => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  const filtered = cases
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular') return (b.total_opened || 0) - (a.total_opened || 0);
      return 0;
    });

  return (
    <div className="space-y-5 min-h-screen bg-gradient-to-br from-[#0a0805] via-[#1a1815] to-[#0d0c0a] -mx-4 md:-mx-5 lg:-mx-6 px-4 md:px-5 lg:px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-6 h-6 text-[#ff006e]" />
          <h1 className="text-2xl font-bold text-[#00d9ff]">Unboxing</h1>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00d9ff]/40" />
           <Input
             placeholder="Search for cases"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10 bg-[#1a1a2e]/40 border-[#00d9ff]/20 text-[#00d9ff] placeholder:text-[#00d9ff]/30 rounded-lg h-10"
           />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-[#1a1a2e]/40 border-[#00d9ff]/20 text-[#00d9ff] rounded-lg h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_desc">Price Descending</SelectItem>
            <SelectItem value="price_asc">Price Ascending</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse">
              <div className="w-20 h-20 bg-white/5 rounded-xl mx-auto mb-3" />
              <div className="h-3 bg-white/5 rounded mb-2 w-2/3 mx-auto" />
              <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                <div className="relative bg-[#1a1b2e] border border-[#00d9ff]/10 rounded-xl p-4 group cursor-pointer transition-all hover:border-[#ff006e]/50 hover:bg-[#1a1b2e]/80">
                  {/* Eye icon top-left */}
                  <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center opacity-60">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  
                  {/* Case Image */}
                  <div className="w-full aspect-square flex items-center justify-center mb-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-full h-full object-contain drop-shadow-2xl" />
                    ) : (
                      <Box className="w-16 h-16 text-[#ff006e]" />
                    )}
                  </div>

                  {/* Case Name */}
                  <h3 className="text-sm font-medium text-[#00d9ff] text-center mb-2">{c.name}</h3>
                  
                  {/* Price */}
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded-full bg-[#ff006e] flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">$</span>
                    </div>
                    <span className="text-sm font-bold text-[#ff006e]">{c.price?.toLocaleString()}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Box className="w-16 h-16 text-[#00d9ff]/20 mx-auto mb-4" />
          <p className="text-[#00d9ff]/40">No cases found</p>
        </div>
      )}
    </div>
  );
}