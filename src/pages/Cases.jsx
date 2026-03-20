import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

const CASES_PER_PAGE = 24;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.cases-root {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #f5f0e8;
  color: #1a1208;
}

/* ─── Layout ─── */
.cases-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 80px;
}

/* ─── Header strip ─── */
.cases-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-top: 3px solid #1a1208;
  border-bottom: 1px solid rgba(26,18,8,.15);
  padding: 14px 0 12px;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}

.cases-title {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 0;
  line-height: 1;
}

.cases-meta {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: rgba(26,18,8,.4);
  letter-spacing: .04em;
}

/* ─── Filter bar ─── */
.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-search {
  flex: 1;
  min-width: 180px;
  position: relative;
}

.filter-search input {
  width: 100%;
  height: 38px;
  border: 1.5px solid rgba(26,18,8,.2);
  border-radius: 4px;
  background: #fff;
  padding: 0 12px 0 34px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #1a1208;
  outline: none;
  transition: border-color .15s;
}
.filter-search input::placeholder { color: rgba(26,18,8,.3); }
.filter-search input:focus { border-color: #1a1208; }
.filter-search svg {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  width: 14px; height: 14px;
  color: rgba(26,18,8,.35);
  pointer-events: none;
}

.cat-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1.5px solid rgba(26,18,8,.18);
  background: transparent;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .04em;
  color: rgba(26,18,8,.55);
  cursor: pointer;
  white-space: nowrap;
  transition: all .14s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-btn:hover {
  border-color: #1a1208;
  color: #1a1208;
  background: rgba(26,18,8,.03);
}
.cat-btn.active {
  background: #1a1208;
  border-color: #1a1208;
  color: #f5f0e8;
}
.cat-btn .count {
  font-size: 10px;
  opacity: .6;
}

.sort-select {
  height: 38px;
  padding: 0 10px;
  border: 1.5px solid rgba(26,18,8,.18);
  border-radius: 4px;
  background: #fff;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: rgba(26,18,8,.7);
  outline: none;
  cursor: pointer;
  letter-spacing: .03em;
}

/* ─── Grid ─── */
.cases-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
}

/* ─── Card ─── */
.case-card {
  background: #fff;
  border: 1px solid rgba(26,18,8,.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  position: relative;
}

.case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26,18,8,.12);
  z-index: 2;
}

.case-card-img {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #faf8f4;
  border-bottom: 1px solid rgba(26,18,8,.06);
  overflow: hidden;
  position: relative;
}

.case-card-img img {
  max-width: 90%;
  max-height: 80px;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform .22s ease;
}
.case-card:hover .case-card-img img {
  transform: scale(1.07);
}

.case-card-body {
  padding: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.case-card-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 11.5px;
  font-weight: 600;
  color: #1a1208;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.case-card-price {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  color: #1a1208;
  letter-spacing: -.01em;
}

.case-card-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 2px;
  line-height: 14px;
}

.tag-new {
  background: #1a1208;
  color: #f5f0e8;
}
.tag-hot {
  background: #c84b1a;
  color: #fff;
}

/* ─── Skeleton ─── */
.skel {
  background: linear-gradient(90deg, #ede8de 25%, #e4dfd4 50%, #ede8de 75%);
  background-size: 200% 100%;
  animation: skelAnim 1.4s ease-in-out infinite;
  border-radius: 2px;
}
@keyframes skelAnim {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Pagination ─── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid rgba(26,18,8,.12);
}

.pag-info {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: rgba(26,18,8,.4);
  letter-spacing: .03em;
}

.pag-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pag-btn {
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba(26,18,8,.18);
  border-radius: 3px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(26,18,8,.6);
  transition: all .13s;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}
.pag-btn:hover:not(:disabled) {
  background: #1a1208;
  border-color: #1a1208;
  color: #f5f0e8;
}
.pag-btn:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.pag-btn.active {
  background: #1a1208;
  border-color: #1a1208;
  color: #f5f0e8;
}

/* ─── Empty ─── */
.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
  text-align: center;
}
.empty-state h3 {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
  color: rgba(26,18,8,.4);
}
.empty-state p {
  font-size: 13px;
  color: rgba(26,18,8,.25);
  margin: 0;
}
`;

const CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'real_life', label: 'Real Life' },
  { id: 'roblox',    label: 'Roblox' },
  { id: 'csgo',      label: 'CS:GO' },
];

const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'popular',    label: 'Most Opened' },
];

function PagButton({ children, active, disabled, onClick }) {
  return (
    <button
      className={`pag-btn${active ? ' active' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >{children}</button>
  );
}

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
  const [cases,    setCases]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('price_desc');
  const [category, setCategory] = useState('all');
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    base44.entities.CaseTemplate.filter({ is_active: true }).then(data => {
      setCases(data);
      setLoading(false);
    });
  }, []);

  // Reset page whenever filters change
  useEffect(() => { setPage(1); }, [search, sortBy, category]);

  const filtered = useMemo(() => cases
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
    }), [cases, search, sortBy, category]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / CASES_PER_PAGE));
  const safePage    = Math.min(page, totalPages);
  const pageItems   = filtered.slice((safePage - 1) * CASES_PER_PAGE, safePage * CASES_PER_PAGE);
  const pageNums    = buildPageNums(safePage, totalPages);

  const catCounts = {
    all:       cases.length,
    real_life: cases.filter(c => (c.category || 'real_life') === 'real_life').length,
    roblox:    cases.filter(c => c.category === 'roblox').length,
    csgo:      cases.filter(c => c.category === 'csgo').length,
  };

  const startIdx = (safePage - 1) * CASES_PER_PAGE + 1;
  const endIdx   = Math.min(safePage * CASES_PER_PAGE, filtered.length);

  return (
    <div className="cases-root">
      <style>{CSS}</style>
      <div className="cases-wrap">

        {/* Header */}
        <div className="cases-header">
          <h1 className="cases-title">Cases</h1>
          <span className="cases-meta">
            {loading ? 'LOADING' : `${filtered.length} ITEMS`}
          </span>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {/* Categories */}
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`cat-btn${category === cat.id ? ' active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
              <span className="count">{catCounts[cat.id]}</span>
            </button>
          ))}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Search */}
          <div className="filter-search">
            <Search />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cases…"
            />
          </div>

          {/* Sort */}
          <select
            className="sort-select"
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
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cases-grid"
            >
              {Array(12).fill(0).map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid rgba(26,18,8,.1)', overflow: 'hidden' }}>
                  <div className="skel" style={{ height: 110 }} />
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skel" style={{ height: 12, width: '75%' }} />
                    <div className="skel" style={{ height: 11, width: '45%' }} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`page-${safePage}-${category}-${sortBy}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: .22 }}
              className="cases-grid"
            >
              {pageItems.length === 0 ? (
                <div className="empty-state">
                  <h3>No cases found</h3>
                  <p>{category !== 'all' ? `No cases in this category yet` : 'Try adjusting your search'}</p>
                </div>
              ) : pageItems.map((c, i) => {
                const isHot = (c.total_opened || 0) > 500;
                const isNew = !isHot && i < 3 && safePage === 1;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .012, duration: .22 }}
                  >
                    <Link
                      to={createPageUrl('CaseOpen') + `?id=${c.id}`}
                      className="case-card"
                    >
                      <div className="case-card-img">
                        {(isNew || isHot) && (
                          <span className={`case-card-tag ${isHot ? 'tag-hot' : 'tag-new'}`}>
                            {isHot ? 'HOT' : 'NEW'}
                          </span>
                        )}
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} />
                        ) : (
                          <Box style={{ width: 32, height: 32, color: 'rgba(26,18,8,.15)' }} />
                        )}
                      </div>
                      <div className="case-card-body">
                        <div className="case-card-name">{c.name}</div>
                        <div className="case-card-price">
                          ${c.price?.toLocaleString()}
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
          <div className="pagination">
            <span className="pag-info">
              {startIdx}–{endIdx} of {filtered.length}
            </span>
            <div className="pag-controls">
              <PagButton
                disabled={safePage === 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
              >
                <ChevronLeft size={14} />
              </PagButton>

              {pageNums.map((p, i) =>
                p === '…'
                  ? <span key={`ellipsis-${i}`} className="pag-btn" style={{ cursor: 'default', opacity: .35, border: 'none' }}>…</span>
                  : <PagButton
                      key={p}
                      active={p === safePage}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                    >{p}</PagButton>
              )}

              <PagButton
                disabled={safePage === totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
              >
                <ChevronRight size={14} />
              </PagButton>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}