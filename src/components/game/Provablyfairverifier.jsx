/**
 * ProvablyFairVerifier.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A modal/panel that shows players the EOS block hash used for a battle,
 * lets them independently verify outcomes, and links to the EOS explorer.
 *
 * Usage:
 *   <ProvablyFairVerifier
 *     battle={battle}
 *     selectedCases={selectedCases}
 *     players={players}
 *     battleModes={battleModes}
 *     onClose={() => setShowVerifier(false)}
 *   />
 *
 * Add a "Provably Fair" shield button in BattleArena's top bar that sets
 * showVerifier=true to open this.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ExternalLink, Copy, CheckCheck, RefreshCw, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { deriveRolls, getEosBlock } from './useProvablyFair';

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800;900&display=swap');

.pfv { font-family: 'Outfit', sans-serif; }
.pfv-mono { font-family: 'JetBrains Mono', monospace; }

@keyframes pfv-scan {
  0%   { top: -1px; opacity: 0; }
  5%   { opacity: .6; }
  95%  { opacity: .3; }
  100% { top: 100%; opacity: 0; }
}
.pfv-scan {
  position: absolute; left: 0; right: 0; height: 1px; pointer-events: none; z-index: 10;
  background: linear-gradient(90deg, transparent, rgba(0,229,160,.6), rgba(245,200,66,.6), transparent);
  animation: pfv-scan 6s linear infinite;
}

@keyframes pfv-pulse-green {
  0%,100% { box-shadow: 0 0 0 0 rgba(0,229,160,.4); }
  50%     { box-shadow: 0 0 0 6px rgba(0,229,160,.0); }
}
.pfv-badge-live { animation: pfv-pulse-green 2s ease-in-out infinite; }

.pfv-hash-box {
  background: rgba(0,0,0,.45);
  border: 1px solid rgba(0,229,160,.18);
  border-radius: 10px;
  padding: 10px 14px;
  word-break: break-all;
  font-size: 11px;
  line-height: 1.7;
  color: #00e5a0;
  position: relative;
  overflow: hidden;
}
.pfv-hash-box::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(0,229,160,.03) 0%, transparent 60%);
  pointer-events: none;
}

.pfv-step {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 12px 14px; border-radius: 12px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.06);
  transition: border-color .2s;
}
.pfv-step:hover { border-color: rgba(245,200,66,.15); }

.pfv-step-num {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800;
  background: rgba(245,200,66,.12); color: #f5c842;
  border: 1px solid rgba(245,200,66,.25);
}

.pfv-tab {
  padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid rgba(255,255,255,.07); cursor: pointer;
  font-family: 'Outfit', sans-serif; transition: all .18s;
  background: transparent; color: rgba(255,255,255,.35);
}
.pfv-tab:hover  { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.15); }
.pfv-tab.active { background: rgba(245,200,66,.1); color: #f5c842; border-color: rgba(245,200,66,.28); }

.pfv-round-row {
  border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.02);
}
.pfv-round-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 14px; cursor: pointer;
  transition: background .18s;
}
.pfv-round-header:hover { background: rgba(255,255,255,.04); }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-thumb { background: rgba(0,229,160,.2); border-radius: 3px; }
`;

const RARITY_COLORS = {
  legendary: '#f5c842',
  epic:      '#c084fc',
  rare:      '#60a5fa',
  uncommon:  '#34d399',
  common:    'rgba(255,255,255,.3)',
};

/* ─── Copy button ─────────────────────────────────────────────────────────── */
function CopyBtn({ text, style }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,.1)',
      background: copied ? 'rgba(0,229,160,.1)' : 'rgba(255,255,255,.05)',
      color: copied ? '#00e5a0' : 'rgba(255,255,255,.45)',
      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
      transition: 'all .18s', flexShrink: 0, ...style,
    }}>
      {copied ? <CheckCheck style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ─── Block info row ──────────────────────────────────────────────────────── */
function BlockInfo({ label, value, accent = '#f5c842', mono = false, copyable = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={mono ? 'pfv-mono' : ''} style={{
          fontSize: mono ? 11 : 13, fontWeight: 700, color: accent,
          wordBreak: 'break-all', flex: 1,
        }}>{value || '—'}</span>
        {copyable && value && <CopyBtn text={String(value)} />}
      </div>
    </div>
  );
}

/* ─── Round accordion ─────────────────────────────────────────────────────── */
function RoundAccordion({ round, roundIdx, players, derivedRolls, committedRolls }) {
  const [open, setOpen] = useState(roundIdx === 0);
  const derived  = derivedRolls?.[roundIdx];
  const committed = committedRolls?.[roundIdx];

  return (
    <div className="pfv-round-row">
      <div className="pfv-round-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(157,111,255,.12)', color: '#9d6fff',
            border: '1px solid rgba(157,111,255,.22)',
          }}>Round {roundIdx + 1}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>{round?.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {derived && committed && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
              background: 'rgba(0,229,160,.08)', color: '#00e5a0',
              border: '1px solid rgba(0,229,160,.2)',
            }}>✓ Verified</span>
          )}
          {open ? <ChevronUp style={{ width: 13, height: 13, color: 'rgba(255,255,255,.3)' }} /> : <ChevronDown style={{ width: 13, height: 13, color: 'rgba(255,255,255,.3)' }} />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {players.map((player, pi) => {
                const d = derived?.[pi];
                const c = committed?.[pi];
                const item = d?.item || c?.item;
                const match = d && c && d.item?.name === c.item?.name && d.item?.value === c.item?.value;
                const rc = RARITY_COLORS[item?.rarity] || RARITY_COLORS.common;
                return (
                  <div key={pi} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 9,
                    background: 'rgba(0,0,0,.25)',
                    border: `1px solid ${match ? 'rgba(0,229,160,.15)' : 'rgba(255,100,100,.2)'}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: `${rc}18`, border: `1px solid ${rc}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item?.image || item?.image_url
                        ? <img src={item.image || item.image_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 13 }}>📦</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player?.name || `Player ${pi + 1}`}
                      </p>
                      <p style={{ fontSize: 10, color: rc, fontWeight: 700 }}>
                        {item?.name || '—'} · {item?.value?.toLocaleString() || 0} coins
                        {d?.isMagic && <span style={{ marginLeft: 5, color: '#c084fc' }}>✨ Magic</span>}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                      background: match ? 'rgba(0,229,160,.08)' : 'rgba(255,100,100,.08)',
                      color: match ? '#00e5a0' : '#ff6464',
                      border: `1px solid ${match ? 'rgba(0,229,160,.2)' : 'rgba(255,100,100,.2)'}`,
                    }}>{match ? '✓ Match' : '✗ Mismatch'}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function ProvablyFairVerifier({ battle, selectedCases, players, battleModes = {}, onClose }) {
  const [tab, setTab]           = useState('overview');
  const [blockInfo, setBI]      = useState(null);
  const [loading, setLoading]   = useState(false);
  const [derivedRolls, setDR]   = useState(null);
  const [error, setError]       = useState(null);

  const blockHash = battle?.eos_block_hash;
  const blockNum  = battle?.eos_block_num;
  const committedRolls = (() => {
    try { return battle?.committed_rolls ? JSON.parse(battle.committed_rolls) : null; }
    catch { return null; }
  })();

  // Fetch block details from EOS explorer
  useEffect(() => {
    if (!blockNum) return;
    setLoading(true);
    getEosBlock(blockNum)
      .then(b => { setBI(b); setError(null); })
      .catch(() => setError('Could not reach EOS network — block data unavailable offline.'))
      .finally(() => setLoading(false));
  }, [blockNum]);

  // Re-derive rolls client-side for verification
  useEffect(() => {
    if (!blockHash || !selectedCases?.length || !players?.length) return;
    try {
      const r = deriveRolls(blockHash, battle.id, selectedCases, players, battleModes);
      setDR(r);
    } catch (e) {
      console.error('[verifier] deriveRolls failed', e);
    }
  }, [blockHash, battle?.id]);

  const allMatch = derivedRolls && committedRolls && (() => {
    for (let r = 0; r < derivedRolls.length; r++) {
      for (let p = 0; p < derivedRolls[r].length; p++) {
        if (derivedRolls[r][p]?.item?.name !== committedRolls[r]?.[p]?.item?.name) return false;
      }
    }
    return true;
  })();

  const explorerUrl = blockNum
    ? `https://bloks.io/block/${blockNum}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(3,0,13,.88)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      <motion.div
        initial={{ y: 24, scale: .96 }} animate={{ y: 0, scale: 1 }}
        exit={{ y: 12, scale: .97 }} transition={{ duration: .3, ease: [.22, 1, .36, 1] }}
        className="pfv"
        style={{
          position: 'relative', width: '100%', maxWidth: 560, maxHeight: '88vh',
          borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(145deg,#07041a,#0d0820,#04010f)',
          border: '1px solid rgba(0,229,160,.18)',
          boxShadow: '0 0 0 1px rgba(0,229,160,.06), 0 40px 120px rgba(0,0,0,.9), 0 0 80px rgba(0,229,160,.06)',
          display: 'flex', flexDirection: 'column',
        }}>

        <div className="pfv-scan" />

        {/* Top accent */}
        <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg,transparent,#00e5a0,#f5c842,transparent)' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield style={{ width: 15, height: 15, color: '#00e5a0' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#f0eaff' }}>Provably Fair</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>
              EOS blockchain · Battle {battle?.id?.slice(0, 8)}…
            </p>
          </div>
          {allMatch !== null && (
            <div className={allMatch ? 'pfv-badge-live' : ''} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800,
              background: allMatch ? 'rgba(0,229,160,.1)' : 'rgba(255,100,100,.1)',
              color: allMatch ? '#00e5a0' : '#ff6464',
              border: `1px solid ${allMatch ? 'rgba(0,229,160,.25)' : 'rgba(255,100,100,.25)'}`,
            }}>
              {allMatch ? '✓ All outcomes verified' : '✗ Mismatch detected'}
            </div>
          )}
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.08)',
            background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}><X style={{ width: 13, height: 13 }} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 20px 0', flexShrink: 0 }}>
          {['overview', 'verify', 'how'].map(t => (
            <button key={t} className={`pfv-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {{ overview: 'Overview', verify: 'Verify Rolls', how: 'How It Works' }[t]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

          {/* ── Overview tab ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Status */}
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: blockHash ? 'rgba(0,229,160,.06)' : 'rgba(245,200,66,.06)',
                border: `1px solid ${blockHash ? 'rgba(0,229,160,.2)' : 'rgba(245,200,66,.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: blockHash ? '#00e5a0' : '#f5c842',
                    boxShadow: `0 0 8px ${blockHash ? '#00e5a0' : '#f5c842'}`,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: blockHash ? '#00e5a0' : '#f5c842' }}>
                    {blockHash ? 'Block hash resolved — outcomes locked' : 'Awaiting block to be mined…'}
                  </span>
                </div>
                {!blockHash && blockNum && (
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 5, marginLeft: 15 }}>
                    Waiting for EOS block #{blockNum?.toLocaleString()} · ~{Math.max(0, (blockNum - (blockInfo?.blockNum || blockNum))) * 0.5}s
                  </p>
                )}
              </div>

              {/* Block details */}
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <BlockInfo label="EOS Block Number" value={blockNum?.toLocaleString()} accent="#f5c842" />
                <BlockInfo label="Block Hash (seed)" value={blockHash} accent="#00e5a0" mono copyable />
                <BlockInfo label="Battle ID" value={battle?.id} accent="rgba(255,255,255,.4)" mono copyable />
                {loading && <p style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw style={{ width: 10, height: 10 }} className="animate-spin" /> Fetching block from EOS…
                </p>}
                {blockInfo && <>
                  <BlockInfo label="Block Timestamp" value={blockInfo.timestamp} accent="rgba(255,255,255,.4)" />
                  <BlockInfo label="Block Producer" value={blockInfo.producer} accent="#9d6fff" />
                </>}
                {error && <p style={{ fontSize: 10, color: 'rgba(255,150,100,.6)' }}>{error}</p>}
              </div>

              {/* Explorer link */}
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  borderRadius: 10, border: '1px solid rgba(0,229,160,.18)',
                  background: 'rgba(0,229,160,.05)', textDecoration: 'none',
                  color: '#00e5a0', fontSize: 12, fontWeight: 700, transition: 'background .18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,160,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,160,.05)'}>
                  <ExternalLink style={{ width: 13, height: 13 }} />
                  View block #{blockNum?.toLocaleString()} on bloks.io
                </a>
              )}
            </div>
          )}

          {/* ── Verify tab ── */}
          {tab === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!blockHash ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
                  Block not yet mined — check back once the battle starts.
                </div>
              ) : !derivedRolls ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
                  <RefreshCw style={{ width: 16, height: 16, marginBottom: 8 }} className="animate-spin" /><br />
                  Deriving rolls…
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 4 }}>
                    Rolls re-derived client-side from the EOS block hash. Compare against stored outcomes.
                  </p>
                  {selectedCases.map((c, ri) => (
                    <RoundAccordion
                      key={ri} round={c} roundIdx={ri}
                      players={players} derivedRolls={derivedRolls} committedRolls={committedRolls}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── How It Works tab ── */}
          {tab === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 6, lineHeight: 1.6 }}>
                Every battle's outcome is determined by a future EOS blockchain block that neither us nor you can predict or manipulate.
              </p>
              {[
                { n: '1', title: 'Block committed at creation', body: 'When a battle is created, we pick a future EOS block number (current head + 3, ~1.5s away). This is recorded on the battle before anyone can know its hash.' },
                { n: '2', title: 'Block is mined by EOS', body: 'EOS block producers mine the block independently. Its hash is determined by global network consensus — completely outside our control.' },
                { n: '3', title: 'Hash seeds all rolls', body: 'We combine the block hash with the battle ID and run a seeded RNG (Mulberry32) to determine every item drop for every player across all rounds.' },
                { n: '4', title: 'Identical for everyone', body: 'Since the hash is stored on the battle record, every player and spectator derives the exact same rolls. No client-side randomness is used during a battle.' },
                { n: '5', title: 'You can verify independently', body: `Look up block #${blockNum?.toLocaleString() || '...'} on bloks.io, copy its block ID, and re-run the same derivation formula. You'll get identical results every time.` },
              ].map(s => (
                <div key={s.n} className="pfv-step">
                  <div className="pfv-step-num">{s.n}</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#f0eaff', marginBottom: 3 }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', lineHeight: 1.55 }}>{s.body}</p>
                  </div>
                </div>
              ))}

              {/* Formula box */}
              <div style={{ marginTop: 6, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(157,111,255,.2)' }}>
                <div style={{ padding: '8px 14px', background: 'rgba(157,111,255,.1)', borderBottom: '1px solid rgba(157,111,255,.15)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#9d6fff', textTransform: 'uppercase', letterSpacing: '.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Hash style={{ width: 10, height: 10 }} /> Derivation Formula
                  </span>
                </div>
                <div className="pfv-hash-box" style={{ borderRadius: 0, border: 'none', fontSize: 10, color: 'rgba(0,229,160,.8)' }}>
                  seed = hash(blockHash + "::" + battleId)<br />
                  rng  = Mulberry32(seed)<br />
                  roll = weightedRandom(rng, caseItems)<br />
                  <span style={{ color: 'rgba(255,255,255,.25)' }}>// Repeated for every player × every round</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom accent */}
        <div style={{ height: 1, flexShrink: 0, background: 'linear-gradient(90deg,transparent,rgba(0,229,160,.3),rgba(245,200,66,.2),transparent)' }} />
      </motion.div>
    </motion.div>
  );
}