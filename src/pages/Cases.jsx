import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, Sparkles, TrendingUp, ArrowUpDown } from 'lucide-react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');

.cv { font-family: 'Nunito', sans-serif; }

/* ── Scan line ── */
@keyframes scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:1; }
  95% { opacity:1; }
  100%{ top:100%; opacity:0; }
}
.scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.15),transparent);
  animation:scan 7s linear infinite; pointer-events:none;
}

/* ── Shimmer ── */
@keyframes shim {
  0%  { transform: translateX(-160%) skewX(-18deg); }
  100%{ transform: translateX(460%)  skewX(-18deg); }
}
.shim::after {
  content:''; position:absolute; top:0; left:0; width:18%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,220,0,.06),transparent);
  animation:shim 7s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

/* ── Pulse glow ── */
@keyframes gold-pulse {
  0%,100%{ box-shadow: 0 0 0 1px rgba(251,191,36,.06), 0 2px 12px rgba(0,0,0,.7); }
  50%    { box-shadow: 0 0 0 1px rgba(251,191,36,.18), 0 2px 12px rgba(0,0,0,.7), 0 0 20px rgba(251,191,36,.07); }
}
.gold-glow { animation: gold-pulse 3.5s ease-in-out infinite; }

/* ── Card hover ── */
.case-card {
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), border-color .22s, box-shadow .22s;
}
.case-card:hover {
  transform: translateY(-4px) scale(1.04);
  box-shadow: 0 8px 28px rgba(0,0,0,.8), 0 0 20px rgba(251,191,36,.12);
}

/* ── Category pill ── */
.cat-pill {
  cursor: pointer;
  transition: all .18s ease;
  user-select: none;
  white-space: nowrap;
}
.cat-pill:hover { transform: translateY(-1px); }

/* ── Sort select ── */
.sort-select option { background: #0d0015; }

/* ── Search input focus ── */
.search-input:focus {
  border-color: rgba(251,191,36,.35) !important;
  background: rgba(251,191,36,.09) !important;
  outline: none;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #1a0f00; border-radius: 4px; }

/* ── Background grid lines ── */
.bg-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(251,191,36,.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251,191,36,.018) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── Floating orbs ── */
@keyframes float1 { 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(20px,-30px); } }
@keyframes float2 { 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(-15px,25px); } }
.orb1 { animation: float1 12s ease-in-out infinite; }
.orb2 { animation: float2 16s ease-in-out infinite; }
`;

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'High → Low',  icon: '↓' },
  { value: 'price_asc',  label: 'Low → High',  icon: '↑' },
  { value: 'popular',    label: 'Most Opened', icon: '🔥' },
];

const CATEGORIES = [
  { id: 'all',       label: 'All Cases',  emoji: '🗂️',  color: 'rgba(251,191,36,1)',   bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.35)' },
  { id: 'real_life', label: 'Real Life',  emoji: '💎',  color: 'rgba(56,189,248,1)',   bg: 'rgba(56,189,248,.12)',  border: 'rgba(56,189,248,.35)' },
  { id: 'roblox',    label: 'Roblox',     emoji: '🟥',  color: 'rgba(239,68,68,1)',    bg: 'rgba(239,68,68,.12)',   border: 'rgba(239,68,68,.35)'  },
  { id: 'csgo',      label: 'CS:GO',      emoji: '🔫',  color: 'rgba(251,146,60,1)',   bg: 'rgba(251,146,60,.12)',  border: 'rgba(251,146,60,.35)' },
];

export default function Cases() {
  useRequireAuth();
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('price_desc');
  const [category, setCategory] = useState('all');
  const [hovId,    setHovId]    = useState(null);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  const activeCat = CATEGORIES.find(c => c.id === category);

  const filtered = cases
    .filter(c => {
      const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat    = category === 'all' || (c.category || 'real_life') === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular')    return (b.total_opened || 0) - (a.total_opened || 0);
      return 0;
    });

  const catCounts = {
    all:       cases.length,
    real_life: cases.filter(c => (c.category || 'real_life') === 'real_life').length,
    roblox:    cases.filter(c => c.category === 'roblox').length,
    csgo:      cases.filter(c => c.category === 'csgo').length,
  };

  return (
    <div className="cv" style={{
      minHeight: '100vh',
      background: '#060010',
      marginLeft: -24, marginRight: -24,
      padding: '20px 16px 80px',
      position: 'relative',
    }}>
      <style>{CSS}</style>

      {/* Background effects */}
      <div className="bg-grid" />
      <div className="orb1" style={{
        position:'fixed', top:'10%', right:'5%', width:280, height:280,
        borderRadius:'50%', pointerEvents:'none', zIndex:0,
        background:'radial-gradient(circle,rgba(168,85,247,.07) 0%,transparent 70%)',
      }} />
      <div className="orb2" style={{
        position:'fixed', bottom:'20%', left:'3%', width:200, height:200,
        borderRadius:'50%', pointerEvents:'none', zIndex:0,
        background:'radial-gradient(circle,rgba(251,191,36,.05) 0%,transparent 70%)',
      }} />

      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:'linear-gradient(135deg,rgba(251,191,36,.25),rgba(168,85,247,.25))',
                border:'1px solid rgba(251,191,36,.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 16px rgba(251,191,36,.12)',
              }}>
                <Box style={{ width:16, height:16, color:'#fbbf24' }} />
              </div>
              <div>
                <h1 style={{
                  margin:0, fontSize:22, fontWeight:900, lineHeight:1,
                  fontFamily:"'Rajdhani', sans-serif", letterSpacing:'.04em',
                  background:'linear-gradient(90deg,#fbbf24 0%,#f59e0b 35%,#c084fc 70%,#a855f7 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                }}>CASES</h1>
                <p style={{ margin:0, fontSize:10, color:'rgba(251,191,36,.4)', fontWeight:700, letterSpacing:'.08em' }}>
                  {loading ? 'LOADING…' : `${filtered.length} AVAILABLE`}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Sparkles style={{ width:10, height:10, color:'rgba(251,191,36,.3)' }} />
              <span style={{ fontSize:9, color:'rgba(251,191,36,.25)', fontWeight:700, letterSpacing:'.12em' }}>LIVE</span>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />
            </div>
          </div>
          <div style={{
            height:2, borderRadius:2, marginTop:10,
            background:'linear-gradient(90deg,#fbbf24,#a855f7,transparent)', width:160,
          }} />
        </motion.div>

        {/* ── Category Filters ── */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
          style={{ display:'flex', gap:7, marginBottom:12, overflowX:'auto', paddingBottom:2 }}>
          {CATEGORIES.map(cat => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                className="cat-pill"
                onClick={() => setCategory(cat.id)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'6px 12px', borderRadius:8, border:'none',
                  background: isActive ? cat.bg : 'rgba(255,255,255,.03)',
                  border: `1px solid ${isActive ? cat.border : 'rgba(255,255,255,.07)'}`,
                  color: isActive ? cat.color : 'rgba(255,255,255,.35)',
                  fontSize:11, fontWeight:800, fontFamily:"'Nunito', sans-serif",
                  cursor:'pointer',
                  boxShadow: isActive ? `0 0 14px ${cat.bg}, inset 0 0 8px ${cat.bg}` : 'none',
                  letterSpacing:'.03em',
                }}>
                <span style={{ fontSize:13 }}>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span style={{
                  padding:'1px 5px', borderRadius:4, fontSize:9, fontWeight:900,
                  background: isActive ? `rgba(0,0,0,.3)` : 'rgba(255,255,255,.05)',
                  color: isActive ? cat.color : 'rgba(255,255,255,.2)',
                }}>{catCounts[cat.id]}</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Search + Sort ── */}
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
          style={{ display:'flex', gap:8, marginBottom:16 }}>

          <div style={{ position:'relative', flex:1 }}>
            <Search style={{
              position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
              width:13, height:13, color:'rgba(251,191,36,.35)', pointerEvents:'none',
            }} />
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeCat?.label ?? 'cases'}…`}
              style={{
                width:'100%', height:36, paddingLeft:30, paddingRight:12,
                background:'rgba(255,255,255,.04)', border:'1px solid rgba(251,191,36,.12)',
                borderRadius:9, fontSize:11, fontWeight:700,
                fontFamily:"'Nunito', sans-serif", color:'rgba(251,191,36,.9)',
                boxSizing:'border-box', transition:'all .2s',
              }}
            />
          </div>

          <div style={{ position:'relative' }}>
            <ArrowUpDown style={{
              position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
              width:11, height:11, color:'rgba(192,132,252,.5)', pointerEvents:'none', zIndex:1,
            }} />
            <select
              className="sort-select"
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{
                height:36, padding:'0 12px 0 26px',
                background:'rgba(168,85,247,.08)', border:'1px solid rgba(168,85,247,.2)',
                borderRadius:9, outline:'none', cursor:'pointer',
                fontSize:11, fontWeight:700, fontFamily:"'Nunito', sans-serif",
                color:'rgba(192,132,252,.85)', appearance:'none',
              }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </motion.div>

        {/* ── Active category indicator ── */}
        {category !== 'all' && (
          <motion.div
            initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
            style={{
              display:'flex', alignItems:'center', gap:6, marginBottom:12,
              padding:'5px 10px', borderRadius:7, width:'fit-content',
              background: activeCat.bg, border:`1px solid ${activeCat.border}`,
            }}>
            <span style={{ fontSize:12 }}>{activeCat.emoji}</span>
            <span style={{ fontSize:10, fontWeight:800, color: activeCat.color, letterSpacing:'.06em' }}>
              {activeCat.label.toUpperCase()} CASES
            </span>
            <span style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:700 }}>
              {filtered.length} results
            </span>
            <button
              onClick={() => setCategory('all')}
              style={{
                marginLeft:2, background:'none', border:'none', cursor:'pointer',
                color:'rgba(255,255,255,.3)', fontSize:12, padding:'0 2px', lineHeight:1,
              }}>×</button>
          </motion.div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} style={{
                borderRadius:12, height:175,
                background:`rgba(255,255,255,${0.015 + (i % 3) * 0.005})`,
                border:'1px solid rgba(251,191,36,.04)',
                animation:'gold-pulse 2s ease-in-out infinite',
                animationDelay:`${i * 0.1}s`,
              }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
              {filtered.map((c, i) => {
                const isHov        = hovId === c.id;
                const isExpensive  = c.price > 5000;
                const isNew        = i < 3;
                const cat          = c.category || 'real_life';

                // Per-category accent color
                const accentColor =
                  cat === 'csgo'      ? '#fb923c' :
                  cat === 'roblox'    ? '#ef4444' :
                  isExpensive         ? '#fbbf24' : 'rgba(168,85,247,1)';
                const accentFaint =
                  cat === 'csgo'      ? 'rgba(251,146,60,' :
                  cat === 'roblox'    ? 'rgba(239,68,68,' :
                  isExpensive         ? 'rgba(251,191,36,' : 'rgba(168,85,247,';

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity:0, scale:.88, y:12 }}
                    animate={{ opacity:1, scale:1, y:0 }}
                    exit={{ opacity:0, scale:.88, y:12 }}
                    transition={{ delay: i * .018, duration:.35, ease:[.22,1,.36,1] }}>
                    <Link to={createPageUrl('CaseOpen') + `?id=${c.id}`}>
                      <div
                        className="shim case-card gold-glow"
                        onMouseEnter={() => setHovId(c.id)}
                        onMouseLeave={() => setHovId(null)}
                        style={{
                          position:'relative', overflow:'hidden', borderRadius:12, cursor:'pointer',
                          background: isExpensive
                            ? 'linear-gradient(160deg,#0f0800,#1c0e00)'
                            : 'linear-gradient(160deg,#080012,#0e001e)',
                          border:`1px solid ${isHov ? accentFaint+'0.3)' : accentFaint+'0.07)'}`,
                          padding:'12px 10px 13px',
                          display:'flex', flexDirection:'column', alignItems:'center',
                        }}>

                        <div className="scan" />

                        {/* Corner glow */}
                        <div style={{
                          position:'absolute', top:0, right:0, width:60, height:60, pointerEvents:'none',
                          background:`radial-gradient(circle,${accentFaint}0.14) 0%,transparent 70%)`,
                        }} />

                        {/* Category dot */}
                        <div style={{
                          position:'absolute', top:7, right:7, width:6, height:6,
                          borderRadius:'50%', background: accentColor,
                          boxShadow:`0 0 6px ${accentColor}`,
                          opacity: 0.8,
                        }} />

                        {/* Badge */}
                        {(isNew || isExpensive) && (
                          <div style={{
                            position:'absolute', top:7, left:7, zIndex:3,
                            fontSize:8, fontWeight:900, letterSpacing:'.08em',
                            textTransform:'uppercase', padding:'2px 6px',
                            borderRadius:4, lineHeight:'14px',
                            color: isExpensive ? '#000' : '#fff',
                            background: isExpensive
                              ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                              : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                            boxShadow: isExpensive ? '0 0 8px rgba(251,191,36,.5)' : '0 0 8px rgba(124,58,237,.5)',
                          }}>
                            {isExpensive ? '⭐' : 'NEW'}
                          </div>
                        )}

                        {/* Case image */}
                        <motion.div
                          animate={{ scale: isHov ? 1.1 : 1, y: isHov ? -4 : 0 }}
                          transition={{ type:'spring', stiffness:240, damping:18 }}
                          style={{
                            width:'100%', display:'flex',
                            alignItems:'center', justifyContent:'center',
                            marginBottom:8, height:90,
                          }}>
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              style={{
                                maxWidth:'92%', maxHeight:88,
                                width:'auto', height:'auto',
                                objectFit:'contain',
                                filter: isHov
                                  ? `drop-shadow(0 0 12px ${accentColor})`
                                  : `drop-shadow(0 0 5px ${accentFaint}0.35))`,
                                transition:'filter .25s',
                              }}
                            />
                          ) : (
                            <Box style={{ width:38, height:38, color: accentColor, opacity:.3 }} />
                          )}
                        </motion.div>

                        {/* Name */}
                        <p style={{
                          margin:'0 0 5px', fontSize:11, fontWeight:800, textAlign:'center',
                          color: isHov ? '#fff' : 'rgba(255,255,255,.7)',
                          transition:'color .25s',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          width:'100%', lineHeight:1.2, letterSpacing:'.01em',
                        }}>{c.name}</p>

                        {/* Price */}
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:7 }}>
                          <div style={{
                            width:14, height:14, borderRadius:'50%', flexShrink:0,
                            background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            boxShadow:'0 0 6px rgba(251,191,36,.45)',
                          }}>
                            <span style={{ fontSize:8, fontWeight:900, color:'#000' }}>$</span>
                          </div>
                          <span style={{
                            fontSize:13, fontWeight:900,
                            color: isExpensive ? '#fbbf24' : 'rgba(251,191,36,.75)',
                            textShadow: isExpensive ? '0 0 10px rgba(251,191,36,.4)' : undefined,
                          }}>{c.price?.toLocaleString()}</span>
                        </div>

                        {/* Rarity bar */}
                        <div style={{ width:'100%', height:2, background:'rgba(255,255,255,.04)', borderRadius:99, overflow:'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width:`${Math.min(100,((c.price||0)/20000)*100)}%` }}
                            transition={{ delay: i * .018 + .3, duration:.6, ease:'easeOut' }}
                            style={{
                              height:'100%', borderRadius:99,
                              background:`linear-gradient(90deg,${accentFaint}0.6),${accentColor})`,
                              boxShadow:`0 0 4px ${accentFaint}0.3)`,
                            }} />
                        </div>

                        {/* Hover top bar */}
                        <motion.div
                          animate={{ opacity: isHov ? 1 : 0, scaleX: isHov ? 1 : 0 }}
                          style={{
                            position:'absolute', top:0, left:0, right:0, height:2,
                            background:`linear-gradient(90deg,transparent,${accentColor},transparent)`,
                            pointerEvents:'none', originX:.5,
                          }} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', paddingTop:50 }}>
            <div style={{
              width:52, height:52, borderRadius:14, margin:'0 auto 14px',
              background:'rgba(251,191,36,.05)', border:'1px solid rgba(251,191,36,.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Box style={{ width:22, height:22, color:'rgba(251,191,36,.25)' }} />
            </div>
            <p style={{ color:'rgba(251,191,36,.35)', fontWeight:800, fontSize:13, margin:'0 0 4px', letterSpacing:'.04em' }}>
              NO CASES FOUND
            </p>
            <p style={{ color:'rgba(255,255,255,.12)', fontSize:11, margin:0 }}>
              {category !== 'all' ? `No ${activeCat?.label} cases yet` : 'Try a different search'}
            </p>
            {category !== 'all' && (
              <button
                onClick={() => setCategory('all')}
                style={{
                  marginTop:14, padding:'7px 16px', borderRadius:8, border:'none',
                  background:'rgba(251,191,36,.1)', border:'1px solid rgba(251,191,36,.2)',
                  color:'rgba(251,191,36,.7)', fontSize:11, fontWeight:800,
                  cursor:'pointer', fontFamily:"'Nunito', sans-serif",
                }}>View All Cases</button>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}