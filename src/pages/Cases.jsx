import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Box, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['all', 'budget', 'standard', 'premium', 'legendary', 'event'];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then((data) => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  const filtered = cases.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cases</h1>
        <p className="text-white/40">Choose a case and try your luck</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all
                ${category === cat
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="w-24 h-24 bg-white/5 rounded-2xl mx-auto mb-4" />
              <div className="h-4 bg-white/5 rounded mb-2 w-2/3 mx-auto" />
              <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                <div className="glass glass-hover rounded-2xl p-5 text-center group cursor-pointer transition-all hover:scale-[1.02] hover:glow-purple">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-20 h-20 object-contain" />
                    ) : (
                      <Box className="w-12 h-12 text-violet-400" />
                    )}
                  </div>
                  {c.category && (
                    <Badge className="mb-2 bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] uppercase">
                      {c.category}
                    </Badge>
                  )}
                  <h3 className="text-sm font-semibold text-white mb-1">{c.name}</h3>
                  <p className="text-xs text-white/30 mb-2 line-clamp-1">{c.description}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">$</span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">{c.price?.toLocaleString()}</span>
                  </div>
                  {c.total_opened > 0 && (
                    <p className="text-[10px] text-white/20 mt-2">{c.total_opened?.toLocaleString()} opened</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Box className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <p className="text-white/40">No cases found</p>
        </div>
      )}
    </div>
  );
}