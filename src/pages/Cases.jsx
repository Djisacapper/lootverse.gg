import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Box, Search } from 'lucide-react';

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

@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.08), 0 4px 20px rgba(0,0,0,.6); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.22), 0 4px 20px rgba(0,0,0,.6), 0 0 28px rgba(251,191,36,.1); }
}
.gold-glow { animation: gold-pulse 3s ease-in-out infinite; }

.card-lift {
  transition: transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .26s ease;
}
.card-lift:hover { transform: translateY(-3px) scale(1.02); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#1a1200; border-radius:4px; }
`;

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'popular',    label: 'Most Popular' },
];

export default function Cases() {
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [sortBy,  setSortBy]  = useState('price_desc');
  const [hovId,   setHovId]   = useState(null);

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
      padding: '24px 20px 80px',
    }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,rgba(251,191,36,.2),rgba(168,85,247,.2))',
            border: '1px solid rgba(251,191,36,.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(251,191,36,.12)',
          }}>
            <Box style={{ width: 15, height: 15, color: '#fbbf24' }} />
          </div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(90deg,#fbbf24,#f59e0b 40%,#c084fc 75%,#a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Cases</h1>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(251,191,36,.4)', fontWeight: 600, letterSpacing: '.06em' }}>
              {loading ? '…' : `${filtered.length} available`}
            </p>
          </div>
        </div>
        <div style={{ height: 2, borderRadius: 2, background: 'linear-gradient(90deg,#fbbf24,#a855f7,transparent)', width: 150, marginTop: 6 }} />
      </motion.div>

      {/* ── Search + Sort ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}
        style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            width: 13, height: 13, color: 'rgba(251,191,36,.4)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases…"
            style={{
              width: '100%', height: 36, paddingLeft: 30, paddingRight: 12,
              background: 'rgba(251,191,36,.06)',
              border: '1px solid rgba(251,191,36,.14)',
              borderRadius: 9, outline: 'none',
              fontSize: 12, fontWeight: 600, fontFamily: 'Nunito,sans-serif',
              color: 'rgba(251,191,36,.9)', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            height: 36, padding: '0 10px',
            background: 'rgba(168,85,247,.1)',
            border: '1px solid rgba(168,85,247,.22)',
            borderRadius: 9, outline: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
            color: 'rgba(192,132,252,.9)',
          }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </motion.div>

      {/* ── Grid — 3 columns now ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {Array(9).fill(0).map((_, i) => (
            <div key={i} style={{
              borderRadius: 12, background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(251,191,36,.05)',
              padding: 12, height: 160,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {filtered.map((c, i) => {
            const isHov      = hovId === c.id;
            const isExpensive = c.price > 5000;
            const isNew      = i < 3;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12, scale: .95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * .025, duration: .45, ease: [.22,1,.36,1] }}>
                <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                  <div
                    className="shim card-lift gold-glow"
                    onMouseEnter={() => setHovId(c.id)}
                    onMouseLeave={() => setHovId(null)}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      borderRadius: 12, cursor: 'pointer',
                      background: isExpensive
                        ? 'linear-gradient(145deg,#0f0800,#1a0d00)'
                        : 'linear-gradient(145deg,#07000f,#100020)',
                      border: `1px solid ${isHov ? 'rgba(251,191,36,.32)' : 'rgba(251,191,36,.07)'}`,
                      padding: '12px 10px 10px',
                      transition: 'border-color .3s',
                    }}>

                    <div className="scan" />

                    {/* Ambient corner glow */}
                    <div style={{
                      position: 'absolute', top: 0, right: 0,
                      width: 55, height: 55,
                      background: isExpensive
                        ? 'radial-gradient(circle,rgba(251,191,36,.1) 0%,transparent 70%)'
                        : 'radial-gradient(circle,rgba(168,85,247,.1) 0%,transparent 70%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Badge */}
                    {(isNew || isExpensive) && (
                      <div style={{
                        position: 'absolute', top: 7, left: 7,
                        fontSize: 7, fontWeight: 800, letterSpacing: '.12em',
                        textTransform: 'uppercase', padding: '1px 5px', borderRadius: 4,
                        color: isExpensive ? '#000' : '#fff',
                        background: isExpensive
                          ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                          : '#7c3aed',
                        boxShadow: isExpensive ? '0 0 8px rgba(251,191,36,.5)' : undefined,
                        zIndex: 3, lineHeight: '14px',
                      }}>
                        {isExpensive ? '⭐ RARE' : 'NEW'}
                      </div>
                    )}

                    {/* Case image — smaller, tighter */}
                    <motion.div
                      animate={{ scale: isHov ? 1.1 : 1, y: isHov ? -4 : 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      style={{
                        width: '100%', height: 80,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8,
                      }}>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name}
                          style={{
                            width: 68, height: 68, objectFit: 'contain',
                            filter: isHov
                              ? `drop-shadow(0 0 12px ${isExpensive ? 'rgba(251,191,36,.75)' : 'rgba(168,85,247,.75)'})`
                              : `drop-shadow(0 0 5px ${isExpensive ? 'rgba(251,191,36,.25)' : 'rgba(168,85,247,.25)'})`,
                            transition: 'filter .3s',
                          }} />
                      ) : (
                        <Box style={{ width: 36, height: 36, color: '#fbbf24', opacity: .35 }} />
                      )}
                    </motion.div>

                    {/* Name */}
                    <p style={{
                      margin: '0 0 6px', fontSize: 10, fontWeight: 800, textAlign: 'center',
                      color: isHov ? '#fff' : 'rgba(255,255,255,.7)',
                      transition: 'color .3s',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}>{c.name}</p>

                    {/* Price */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 4, marginBottom: 8,
                    }}>
                      <div style={{
                        width: 13, height: 13, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 6px rgba(251,191,36,.45)', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 7, fontWeight: 900, color: '#000' }}>$</span>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 900,
                        color: isExpensive ? '#fbbf24' : 'rgba(251,191,36,.75)',
                        textShadow: isExpensive ? '0 0 10px rgba(251,191,36,.4)' : undefined,
                      }}>{c.price?.toLocaleString()}</span>
                    </div>

                    {/* Rarity bar */}
                    <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((c.price || 0) / 20000) * 100)}%`,
                        borderRadius: 99,
                        background: 'linear-gradient(90deg,#a855f7,#fbbf24)',
                        boxShadow: '0 0 4px rgba(251,191,36,.4)',
                      }} />
                    </div>

                    {/* Hover top line */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
            background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box style={{ width: 22, height: 22, color: 'rgba(251,191,36,.3)' }} />
          </div>
          <p style={{ color: 'rgba(251,191,36,.3)', fontWeight: 700, fontSize: 13 }}>No cases found</p>
          <p style={{ color: 'rgba(255,255,255,.15)', fontSize: 11, marginTop: 3 }}>Try a different search</p>
        </motion.div>
      )}
    </div>
  );
}