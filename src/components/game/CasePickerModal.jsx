import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Check, ShoppingBag } from 'lucide-react';
import { getRarityColor } from './useWallet';

export default function CasePickerModal({ open, onOpenChange, cases, onAddCase }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('price_desc');
  // Track selected cases locally as {id -> count}
  const [selected, setSelected] = useState({});

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

  const totalSelected = Object.values(selected).reduce((s, n) => s + n, 0);

  const addCase = (c) => {
    setSelected(prev => ({ ...prev, [c.id]: (prev[c.id] || 0) + 1 }));
  };

  const removeOne = (caseId) => {
    setSelected(prev => {
      const n = { ...prev };
      if ((n[caseId] || 0) <= 1) delete n[caseId];
      else n[caseId]--;
      return n;
    });
  };

  const handleConfirm = () => {
    // Add all selected cases (each count times) to the battle
    Object.entries(selected).forEach(([caseId, count]) => {
      const c = cases.find(x => x.id === caseId);
      if (!c) return;
      for (let i = 0; i < count; i++) onAddCase(c);
    });
    setSelected({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelected({});
    onOpenChange(false);
  };

  const rarityBorder = {
    legendary: 'rgba(251,191,36,.5)',
    epic: 'rgba(192,132,252,.45)',
    rare: 'rgba(96,165,250,.4)',
    uncommon: 'rgba(52,211,153,.35)',
    common: 'rgba(255,255,255,.1)',
  };
  const rarityGlow = {
    legendary: 'rgba(251,191,36,.15)',
    epic: 'rgba(192,132,252,.12)',
    rare: 'rgba(96,165,250,.1)',
    uncommon: 'rgba(52,211,153,.1)',
    common: 'transparent',
  };
  const rarityLabel = {
    legendary: '#fbbf24',
    epic: '#c084fc',
    rare: '#60a5fa',
    uncommon: '#34d399',
    common: 'rgba(255,255,255,.4)',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        style={{
          background: 'linear-gradient(145deg, #08001a 0%, #0d0022 60%, #050010 100%)',
          border: '1px solid rgba(168,85,247,.22)',
          color: '#fff',
          maxWidth: 720,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          gap: 0,
          borderRadius: 20,
          boxShadow: '0 0 80px rgba(168,85,247,.15), 0 24px 60px rgba(0,0,0,.85)',
        }}
      >
        {/* top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #a855f7, #fbbf24, transparent)', borderRadius: '20px 20px 0 0', flexShrink: 0 }} />

        {/* Header */}
        <DialogHeader style={{ padding: '18px 22px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag style={{ width: 15, height: 15, color: '#a855f7' }} />
              </div>
              <div>
                <DialogTitle style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '.04em' }}>Select Cases</DialogTitle>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1, letterSpacing: '.06em' }}>
                  Click to add · click again to add more
                </p>
              </div>
            </div>
            {totalSelected > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>{totalSelected}</span>
                <span style={{ fontSize: 10, color: 'rgba(251,191,36,.6)', fontWeight: 600 }}>case{totalSelected !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Search + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 22px 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }} />
            <input
              placeholder="Search for cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 11, color: '#fff', fontSize: 13, outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              color: '#fff', fontSize: 12, borderRadius: 11, padding: '9px 12px',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            <option value="price_desc" style={{ background: '#0d0022' }}>Price: High to Low</option>
            <option value="price_asc" style={{ background: '#0d0022' }}>Price: Low to High</option>
            <option value="popular" style={{ background: '#0d0022' }}>Most Popular</option>
          </select>
        </div>

        {/* Selected strip */}
        {totalSelected > 0 && (
          <div style={{
            margin: '0 22px 10px', padding: '10px 14px', borderRadius: 12,
            background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.18)',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(251,191,36,.5)', letterSpacing: '.14em', textTransform: 'uppercase', flexShrink: 0 }}>Selected</span>
            {Object.entries(selected).map(([caseId, count]) => {
              const c = cases.find(x => x.id === caseId);
              if (!c) return null;
              return (
                <div key={caseId} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px 4px 5px',
                  borderRadius: 8, background: 'rgba(168,85,247,.12)', border: '1px solid rgba(168,85,247,.28)',
                }}>
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name} style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
                    : <span style={{ fontSize: 12 }}>📦</span>
                  }
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  {count > 1 && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', padding: '1px 5px', borderRadius: 5, background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.25)' }}>×{count}</span>
                  )}
                  <button onClick={() => removeOne(caseId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,.3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.3)'}>
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Grid */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 22px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 }}>
            {filtered.map(c => {
              const rarity = rarityForCase(c);
              const count = selected[c.id] || 0;
              const isSelected = count > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => addCase(c)}
                  style={{
                    borderRadius: 14, padding: '12px 10px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8, cursor: 'pointer', position: 'relative',
                    background: isSelected ? `rgba(168,85,247,.1)` : 'rgba(255,255,255,.03)',
                    border: `1.5px solid ${isSelected ? rarityBorder[rarity] : 'rgba(255,255,255,.07)'}`,
                    boxShadow: isSelected ? `0 0 20px ${rarityGlow[rarity]}` : 'none',
                    transition: 'all .18s',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(168,85,247,.4)'; e.currentTarget.style.background = 'rgba(168,85,247,.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = 'none'; } }}
                >
                  {/* count badge */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 7, right: 7, minWidth: 20, height: 20, borderRadius: 6,
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                      boxShadow: '0 0 10px rgba(168,85,247,.5)',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{count > 1 ? `×${count}` : '✓'}</span>
                    </div>
                  )}

                  {/* image */}
                  <div style={{
                    width: 68, height: 68, borderRadius: 12, overflow: 'hidden',
                    border: `1.5px solid ${rarityBorder[rarity]}`,
                    background: `rgba(0,0,0,.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isSelected ? `0 0 18px ${rarityGlow[rarity]}` : 'none',
                  }}>
                    {c.image_url
                      ? <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28 }}>📦</span>
                    }
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 700, color: rarityLabel[rarity], textAlign: 'center', lineHeight: 1.25, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 7, fontWeight: 900, color: '#000' }}>$</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{c.price?.toLocaleString()}</span>
                  </div>

                  <div style={{
                    width: '100%', padding: '6px 0', borderRadius: 8, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                    background: isSelected ? 'rgba(168,85,247,.2)' : 'rgba(255,255,255,.07)',
                    border: `1px solid ${isSelected ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.1)'}`,
                    transition: 'all .15s',
                  }}>
                    <Plus style={{ width: 11, height: 11, color: isSelected ? '#c084fc' : 'rgba(255,255,255,.5)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? '#c084fc' : 'rgba(255,255,255,.5)' }}>Add Case</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer confirm */}
        {totalSelected > 0 && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            background: 'rgba(0,0,0,.2)',
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', fontWeight: 500 }}>
              <span style={{ color: '#fbbf24', fontWeight: 800 }}>{totalSelected}</span> case{totalSelected !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleConfirm}
              style={{
                padding: '10px 26px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000',
                fontSize: 13, fontWeight: 800, letterSpacing: '.03em',
                boxShadow: '0 0 24px rgba(251,191,36,.35)',
                transition: 'all .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(251,191,36,.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 24px rgba(251,191,36,.35)'; }}
            >
              Add to Battle
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}