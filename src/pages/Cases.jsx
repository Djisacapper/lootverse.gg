import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const CASES_PER_PAGE = 24;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

:root {
  --bg:          #09000f;
  --surface:     #110018;
  --surface2:    #1a0028;
  --border:      rgba(139,92,246,.14);
  --border-h:    rgba(251,191,36,.38);
  --gold:        #fbbf24;
  --gold-dim:    rgba(251,191,36,.55);
  --purple:      #a855f7;
  --purple-dim:  rgba(168,85,247,.6);
  --text:        #f0e6ff;
  --text-dim:    rgba(240,230,255,.45);
  --text-faint:  rgba(240,230,255,.2);
}

*, *::before, *::after { box-sizing: border-box; }

.cv {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  margin-left: -24px;
  margin-right: -24px;
  padding: 0 16px 80px;
}

.cv-wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding-top: 28px;
}

/* ── Header ── */
.cv-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.cv-title {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -.01em;
  margin: 0;
  color: var(--text);
}

.cv-title-dot {
  color: var(--gold);
  margin-left: 4px;
}

.cv-count {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: .08em;
  color: var(--text-faint);
  text-transform: uppercase;
}

/* ── Filter bar ── */
.cv-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cv-cats {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.cat-btn {
  height: 34px;
  padding: 0 13px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .04em;
  color: var(--text-dim);
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-btn:hover {
  border-color: rgba(168,85,247,.4);
  color: var(--purple-dim);
  background: rgba(168,85,247,.05);
}
.cat-btn.active {
  background: rgba(168,85,247,.15);
  border-color: rgba(168,85,247,.55);
  color: var(--purple);
}
.cat-btn .cnt {
  font-size: 9px;
  color: var(--text-faint);
}
.cat-btn.active .cnt { color: rgba(168,85,247,.5); }

.cv-spacer { flex: 1; min-width: 8px; }

.cv-search {
  position: relative;
  width: 210px;
}
.cv-search input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 30px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}
.cv-search input::placeholder { color: var(--text-faint); }
.cv-search input:focus { border-color: rgba(168,85,247,.5); }
.cv-search svg {
  position: absolute;
  left: 9px; top: 50%;
  transform: translateY(-50%);
  width: 13px; height: 13px;
  color: var(--text-faint);
  pointer-events: none;
}

.cv-sort {
  height: 34px;
  padding: 0 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-dim);
  outline: none;
  cursor: pointer;
  letter-spacing: .03em;
}
.cv-sort option { background: #110018; }

/* ── Grid — 4 columns, bigger cards ── */
.cv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* ── Card ── */
.cv-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.cv-card:hover {
  border-color: var(--border-h);
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(0,0,0,.55), 0 0 0 1px rgba(251,191,36,.07);
}

/* gold top line on hover */
.cv-card::before {
  content: '';
  position: absolute;
  top: 0; left: 15%; right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0;
  transition: opacity .2s;
  z-index: 3;
}
.cv-card:hover::before { opacity: 1; }

/* image area */
.cv-card-img {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  background: linear-gradient(155deg, #160024 0%, #0e0019 100%);
  border-bottom: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.cv-card-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 65% 25%, rgba(168,85,247,.08) 0%, transparent 60%);
  pointer-events: none;
}

.cv-card-img img {
  max-width: 88%;
  max-height: 140px;
  width: auto;
  height: auto;
  object-fit: contain;
  position: relative;
  z-index: 1;
  transition: transform .25s ease;
  filter: drop-shadow(0 6px 20px rgba(0,0,0,.7));
}
.cv-card:hover .cv-card-img img {
  transform: scale(1.09) translateY(-4px);
}

/* body */
.cv-card-body {
  padding: 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.cv-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.cv-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cv-card-price {
  font-family: 'DM Mono', monospace;
  font-size: 15px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: -.01em;
}

.cv-card-opens {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--text-faint);
  letter-spacing: .03em;
}

/* tags */
.cv-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: .07em;
  text-transform: uppercase;
  padding: 3px 7px;
  border-radius: 4px;
  line-height: 1.4;
  z-index: 4;
}
.tag-new {
  background: rgba(168,85,247,.2);
  border: 1px solid rgba(168,85,247,.4);
  color: var(--purple);
}
.tag-hot {
  background: rgba(251,191,36,.15);
  border: 1px solid rgba(251,191,36,.4);
  color: var(--gold);
}

/* ── Skeleton ── */
@keyframes skelMove {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skel {
  background: linear-gradient(90deg,
    var(--surface) 25%,
    rgba(139,92,246,.1) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: skelMove 1.6s ease-in-out infinite;
  border-radius: 4px;
}

/* ── Pagination ── */
.cv-pag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 10px;
}
.cv-pag-info {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: .04em;
}
.cv-pag-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pag-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .14s ease;
}
.pag-btn:hover:not(:disabled) {
  border-color: rgba(251,191,36,.4);
  color: var(--gold);
  background: rgba(251,191,36,.06);
}
.pag-btn:disabled { opacity: .25; cursor: not-allowed; }
.pag-btn.active {
  background: rgba(251,191,36,.12);
  border-color: rgba(251,191,36,.5);
  color: var(--gold);
}
.pag-ellipsis {
  width: 28px;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--text-faint);
  line-height: 34px;
}

/* ── Empty ── */
.cv-empty {
  grid-column: 1 / -1;
  padding: 70px 0;
  text-align: center;
}
.cv-empty h3 {
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-dim);
  margin: 0 0 6px;
}
.cv-empty p {
  font-size: 12px;
  color: var(--text-faint);
  margin: 0 0 16px;
}
.cv-empty button {
  padding: 8px 18px;
  border-radius: 6px;
  border: 1px solid rgba(168,85,247,.3);
  background: rgba(168,85,247,.08);
  color: var(--purple-dim);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  letter-spacing: .04em;
  transition: all .15s;
}
.cv-empty button:hover {
  border-color: rgba(168,85,247,.55);
  background: rgba(168,85,247,.15);
}
`;

const CATEGORIES = [
  { id: 'all',       label: 'All Cases'  },
  { id: 'real_life', label: 'Real Life'  },
  { id: 'roblox',    label: 'Roblox'     },
  { id: 'csgo',      label: 'CS:GO'      },
];

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'popular',    label: 'Most Opened'        },
];

function buildPageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Cases() {
  useRequireAuth();
  const [cases,   setCases]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [sortBy,  setSortBy]  = useState('price_desc');
  const [cat,     setCat]     = useState('all');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { setPage(1); }, [search, sortBy, cat]);

  const filtered = useMemo(() => cases
    .filter(c => {
      const ms = c.name?.toLowerCase().includes(search.toLowerCase());
      const mc = cat === 'all' || (c.category || 'real_life') === cat;
      return ms && mc;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular')    return (b.total_opened || 0) - (a.total_opened || 0);
      return 0;
    }), [cases, search, sortBy, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CASES_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * CASES_PER_PAGE, safePage * CASES_PER_PAGE);
  const pageNums   = buildPageNums(safePage, totalPages);
  const start      = (safePage - 1) * CASES_PER_PAGE + 1;
  const end        = Math.min(safePage * CASES_PER_PAGE, filtered.length);

  const catCounts = {
    all:       cases.length,
    real_life: cases.filter(c => (c.category || 'real_life') === 'real_life').length,
    roblox:    cases.filter(c => c.category === 'roblox').length,
    csgo:      cases.filter(c => c.category === 'csgo').length,
  };

  const goPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="cv">
      <style>{CSS}</style>
      <div className="cv-wrap">

        {/* Header */}
        <div className="cv-header">
          <h1 className="cv-title">
            Cases<span className="cv-title-dot">·</span>
          </h1>
          <span className="cv-count">
            {loading ? 'Loading…' : `${filtered.length} available`}
          </span>
        </div>

        {/* Filters */}
        <div className="cv-filters">
          <div className="cv-cats">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`cat-btn${cat === c.id ? ' active' : ''}`}
                onClick={() => setCat(c.id)}
              >
                {c.label}
                <span className="cnt">{catCounts[c.id]}</span>
              </button>
            ))}
          </div>

          <div className="cv-spacer" />

          <div className="cv-search">
            <Search />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cases…"
            />
          </div>

          <select
            className="cv-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cv-grid"
            >
              {Array(8).fill(0).map((_, i) => (
                <div key={i} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  <div className="skel" style={{ height: 180 }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skel" style={{ height: 13, width: '68%' }} />
                    <div className="skel" style={{ height: 12, width: '38%' }} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`pg-${safePage}-${cat}-${sortBy}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .22 }}
              className="cv-grid"
            >
              {pageItems.length === 0 ? (
                <div className="cv-empty">
                  <h3>Nothing here</h3>
                  <p>
                    {cat !== 'all'
                      ? 'No cases in this category yet'
                      : 'Try a different search term'}
                  </p>
                  {cat !== 'all' && (
                    <button onClick={() => setCat('all')}>View all cases</button>
                  )}
                </div>
              ) : pageItems.map((c, i) => {
                const isHot = (c.total_opened || 0) > 500;
                const isNew = !isHot && i < 3 && safePage === 1;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .015, duration: .24, ease: [.22, 1, .36, 1] }}
                  >
                    <Link
                      to={createPageUrl('CaseOpen') + `?id=${c.id}`}
                      className="cv-card"
                    >
                      <div className="cv-card-img">
                        {(isNew || isHot) && (
                          <span className={`cv-tag ${isHot ? 'tag-hot' : 'tag-new'}`}>
                            {isHot ? 'Hot' : 'New'}
                          </span>
                        )}
                        {c.image_url
                          ? <img src={c.image_url} alt={c.name} />
                          : <Box style={{ width: 44, height: 44, color: 'rgba(168,85,247,.18)' }} />
                        }
                      </div>
                      <div className="cv-card-body">
                        <div className="cv-card-name">{c.name}</div>
                        <div className="cv-card-row">
                          <span className="cv-card-price">
                            ${c.price?.toLocaleString()}
                          </span>
                          {c.total_opened > 0 && (
                            <span className="cv-card-opens">
                              {c.total_opened?.toLocaleString()} opens
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!loading && filtered.length > CASES_PER_PAGE && (
          <div className="cv-pag">
            <span className="cv-pag-info">
              Showing {start}–{end} of {filtered.length}
            </span>
            <div className="cv-pag-btns">
              <button
                className="pag-btn"
                disabled={safePage === 1}
                onClick={() => goPage(safePage - 1)}
              >
                <ChevronLeft size={14} />
              </button>

              {pageNums.map((p, i) =>
                p === '…'
                  ? <span key={`e${i}`} className="pag-ellipsis">…</span>
                  : <button
                      key={p}
                      className={`pag-btn${p === safePage ? ' active' : ''}`}
                      onClick={() => goPage(p)}
                    >{p}</button>
              )}

              <button
                className="pag-btn"
                disabled={safePage === totalPages}
                onClick={() => goPage(safePage + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}