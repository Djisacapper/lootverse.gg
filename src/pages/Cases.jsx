import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Box, Search, SlidersHorizontal, Flame, TrendingUp, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.cv { font-family: 'Nunito', sans-serif; }

@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; }
  95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.18),transparent);
  animation:scan 6s linear infinite; pointer-events:none;
}

@keyframes shim {
  0%  { transform: translateX(-120%) skewX(-15deg); }
  100%{ transform: translateX(380%)  skewX(-15deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:20%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.05),transparent);
  animation:shim 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes float-a {
  0%,100%{ transform:translateY(0) rotate(-3deg); }
  50%    { transform:translateY(-10px) rotate(1deg); }
}
@keyframes float-b {
  0%,100%{ transform:translateY(0) rotate(2deg); }
  50%    { transform:translateY(-14px) rotate(-2deg); }
}

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.1), 0 8px 32px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.25), 0 8px 32px rgba(0,0,0,.7), 0 0 40px rgba(251,191,36,.12); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

.card-lift {
  transition: transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .26s ease;
}
.card-lift:hover { transform: translateY(-4px) scale(1.015); }

.cv input::placeholder { color: rgba(251,191,36,.3) !important; }
.cv input { color: rgba(251,191,36,.9) !important; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'popular',    label: 'Most Popular' },
];

export default function Cases() {
  const [cases, setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');
  const [hovId, setHovId]   = useState(null);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  const filtered = cases
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular')    return (b.total_opened || 0) - (a.total_opened || 0);
      return 0;
    });

  return (
    <div className="cv" style={{
      minHeight: '100vh',
      background: '#04000a',
      marginLeft: -24, marginRight: -24,
      padding: '28px 24px 80px',
    }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,rgba(251,191,36,.2),rgba(168,85,247,.2))',
            border: '1px solid rgba(251,191,36,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(251,191,36,.15)',
          }}>
            <Box style={{ width: 18, height: 18, color: '#fbbf24' }} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc 75%,#a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Cases</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(251,191,36,.4)', fontWeight: 600, letterSpacing: '.06em' }}>
              {loading ? '...' : `${filtered.length} available`}
            </p>
          </div>
        </div>

        {/* Gold/purple accent line */}
        <div style={{
          height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg,#fbbf24,#a855f7,transparent)',
          width: 180, marginTop: 8,
        }} />
      </motion.div>

      {/* ── Search + Sort ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
        style={{ display: 'flex', gap: 10, marginBottom: 24 }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 15, height: 15, color: 'rgba(251,191,36,.4)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases…"
            style={{
              width: '100%', height: 40, paddingLeft: 36, paddingRight: 14,
              background: 'rgba(251,191,36,.06)',
              border: '1px solid rgba(251,191,36,.15)',
              borderRadius: 10, outline: 'none',
              fontSize: 13, fontWeight: 600, fontFamily: 'Nunito,sans-serif',
              color: 'rgba(251,191,36,.9)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            height: 40, padding: '0 14px',
            background: 'rgba(168,85,247,.1)',
            border: '1px solid rgba(168,85,247,.25)',
            borderRadius: 10, outline: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
            color: 'rgba(192,132,252,.9)',
          }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </motion.div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} style={{
              borderRadius: 14, background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(251,191,36,.06)',
              padding: 16, aspectRatio: '3/4',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {filtered.map((c, i) => {
            const isHov = hovId === c.id;
            const isExpensive = c.price > 5000;
            const isNew = i < 3;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16, scale: .96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * .03, duration: .5, ease: [.22,1,.36,1] }}>
                <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                  <div
                    className="shim card-lift gold-glow"
                    onMouseEnter={() => setHovId(c.id)}
                    onMouseLeave={() => setHovId(null)}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      borderRadius: 14, cursor: 'pointer',
                      background: isExpensive
                        ? 'linear-gradient(145deg,#0f0800,#1a0d00)'
                        : 'linear-gradient(145deg,#07000f,#100020)',
                      border: `1px solid ${isHov
                        ? 'rgba(251,191,36,.35)'
                        : 'rgba(251,191,36,.08)'}`,
                      padding: '18px 14px 14px',
                      transition: 'border-color .3s',
                    }}>

                    <div className="scan" />

                    {/* Ambient glow top-right */}
                    <div style={{
                      position: 'absolute', top: 0, right: 0,
                      width: 80, height: 80,
                      background: isExpensive
                        ? 'radial-gradient(circle,rgba(251,191,36,.12) 0%,transparent 70%)'
                        : 'radial-gradient(circle,rgba(168,85,247,.12) 0%,transparent 70%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Badge */}
                    {(isNew || isExpensive) && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        fontSize: 8, fontWeight: 800, letterSpacing: '.14em',
                        textTransform: 'uppercase', padding: '2px 7px', borderRadius: 5,
                        color: isExpensive ? '#000' : '#fff',
                        background: isExpensive
                          ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                          : '#7c3aed',
                        boxShadow: isExpensive ? '0 0 10px rgba(251,191,36,.5)' : undefined,
                        zIndex: 3,
                      }}>
                        {isExpensive ? '⭐ RARE' : 'NEW'}
                      </div>
                    )}

                    {/* Case image */}
                    <motion.div
                      animate={{ scale: isHov ? 1.08 : 1, y: isHov ? -6 : 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                      style={{
                        width: '100%', aspectRatio: '1/1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 12,
                      }}>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name}
                          style={{
                            width: '85%', height: '85%', objectFit: 'contain',
                            filter: isHov
                              ? `drop-shadow(0 0 18px ${isExpensive ? 'rgba(251,191,36,.7)' : 'rgba(168,85,247,.7)'})`
                              : `drop-shadow(0 0 8px ${isExpensive ? 'rgba(251,191,36,.3)' : 'rgba(168,85,247,.3)'})`,
                            transition: 'filter .3s',
                          }} />
                      ) : (
                        <Box style={{ width: 56, height: 56, color: '#fbbf24', opacity: .4 }} />
                      )}
                    </motion.div>

                    {/* Name */}
                    <h3 style={{
                      margin: '0 0 8px', fontSize: 12, fontWeight: 800, textAlign: 'center',
                      color: isHov ? '#fff' : 'rgba(255,255,255,.75)',
                      transition: 'color .3s',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{c.name}</h3>

                    {/* Price pill */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, marginBottom: 10,
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(251,191,36,.5)',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#000' }}>$</span>
                      </div>
                      <span style={{
                        fontSize: 14, fontWeight: 900,
                        color: isExpensive ? '#fbbf24' : 'rgba(251,191,36,.8)',
                        textShadow: isExpensive ? '0 0 12px rgba(251,191,36,.4)' : undefined,
                      }}>{c.price?.toLocaleString()}</span>
                    </div>

                    {/* Rarity bar */}
                    <div style={{
                      width: '100%', height: 3,
                      background: 'rgba(255,255,255,.05)',
                      borderRadius: 99, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${Math.min(100, ((c.price || 0) / 20000) * 100)}%`,
                        borderRadius: 99,
                        background: 'linear-gradient(90deg,#a855f7,#fbbf24)',
                        boxShadow: '0 0 6px rgba(251,191,36,.4)',
                      }} />
                    </div>

                    {/* Hover: top glow line */}
                    <motion.div
                      animate={{ opacity: isHov ? 1 : 0 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: 'linear-gradient(90deg,transparent,#fbbf24,#a855f7,transparent)',
                        pointerEvents: 'none',
                      }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box style={{ width: 28, height: 28, color: 'rgba(251,191,36,.3)' }} />
          </div>
          <p style={{ color: 'rgba(251,191,36,.3)', fontWeight: 700, fontSize: 14 }}>No cases found</p>
          <p style={{ color: 'rgba(255,255,255,.15)', fontSize: 12, marginTop: 4 }}>Try a different search</p>
        </motion.div>
      )}
    </div>
  );
}