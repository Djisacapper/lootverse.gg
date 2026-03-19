import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, DollarSign, Ban, Trash2, Activity,
  AlertCircle, CheckCircle2, Loader2, Box, Plus, X,
  RefreshCw, Users, Crown, ChevronRight, Pencil,
  Package, Lock, Unlock, Eye, EyeOff, Clock,
  TrendingUp, TrendingDown, Globe, Zap, Hash,
  AlertTriangle, UserX, UserCheck, ArrowUpRight,
  ArrowDownLeft, Gamepad2, History, Filter,
  ChevronDown, MoreVertical, Terminal, Send,
  Download, ArrowRight, Circle, Radio
} from 'lucide-react';

/* ─── FONTS & GLOBAL CSS ──────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ap-root {
  font-family: 'DM Sans', sans-serif;
  background: #030508;
  color: #e2e8f0;
}

/* Scanline overlay */
.ap-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,.03) 2px,
    rgba(0,0,0,.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #0a0d14; }
::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2a3548; }

/* Mono font utility */
.mono { font-family: 'Space Mono', monospace; }

/* Animations */
@keyframes ap-pulse-ring {
  0% { transform: scale(1); opacity: .6; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes ap-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes ap-slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes ap-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ap-spin { to { transform: rotate(360deg); } }
@keyframes ap-data-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 100% 100%; }
}

.ap-spin { animation: ap-spin .85s linear infinite; }
.ap-blink { animation: ap-blink 1.1s step-end infinite; }
.fade-up { animation: ap-fade-up .3s ease forwards; }

/* Status dot with ring */
.ap-live-dot {
  position: relative;
  width: 8px; height: 8px;
  border-radius: 50%;
}
.ap-live-dot::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid currentColor;
  animation: ap-pulse-ring 1.8s ease-out infinite;
}

/* Input base */
.ap-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #1e2535;
  background: #0a0d14;
  color: #e2e8f0;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  transition: border-color .18s, box-shadow .18s;
  outline: none;
}
.ap-input::placeholder { color: #2d3a52; }
.ap-input:focus {
  border-color: #3b5bdb;
  box-shadow: 0 0 0 3px rgba(59,91,219,.12);
}
.ap-input.danger:focus {
  border-color: #e03131;
  box-shadow: 0 0 0 3px rgba(224,49,49,.1);
}
.ap-input.gold:focus {
  border-color: #e67700;
  box-shadow: 0 0 0 3px rgba(230,119,0,.1);
}

.ap-select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #1e2535;
  background: #0a0d14;
  color: #e2e8f0;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color .18s;
}
.ap-select:focus { border-color: #3b5bdb; }
.ap-select option { background: #0a0d14; }

/* Tab button */
.ap-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 18px; border-radius: 7px;
  border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
  transition: all .18s; white-space: nowrap; letter-spacing: .02em;
}

/* Row hover */
.ap-row { transition: background .15s, border-color .15s; }
.ap-row:hover { background: rgba(59,91,219,.04) !important; border-color: rgba(59,91,219,.2) !important; }

/* Action button */
.ap-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px 16px; border-radius: 8px;
  border: 1px solid transparent;
  font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all .18s; outline: none;
}
.ap-btn:disabled { opacity: .4; cursor: not-allowed; }

.ap-btn.primary {
  background: #3b5bdb; border-color: #4c6ef5; color: #fff;
  box-shadow: 0 0 20px rgba(59,91,219,.2);
}
.ap-btn.primary:hover:not(:disabled) {
  background: #4c6ef5; box-shadow: 0 0 28px rgba(59,91,219,.35);
}
.ap-btn.danger {
  background: rgba(224,49,49,.1); border-color: rgba(224,49,49,.3); color: #ff6b6b;
}
.ap-btn.danger:hover:not(:disabled) {
  background: rgba(224,49,49,.18); border-color: rgba(224,49,49,.5);
}
.ap-btn.warning {
  background: rgba(230,119,0,.1); border-color: rgba(230,119,0,.3); color: #ffa94d;
}
.ap-btn.warning:hover:not(:disabled) {
  background: rgba(230,119,0,.18);
}
.ap-btn.success {
  background: rgba(37,162,99,.1); border-color: rgba(37,162,99,.3); color: #51cf66;
}
.ap-btn.success:hover:not(:disabled) {
  background: rgba(37,162,99,.18);
}
.ap-btn.ghost {
  background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); color: rgba(255,255,255,.4);
}
.ap-btn.ghost:hover:not(:disabled) {
  background: rgba(255,255,255,.07); color: rgba(255,255,255,.65);
}

/* Card */
.ap-card {
  border-radius: 12px;
  background: #080b12;
  border: 1px solid #111827;
  overflow: hidden;
}
.ap-card.glow-blue { border-color: rgba(59,91,219,.2); box-shadow: 0 0 40px rgba(59,91,219,.04); }
.ap-card.glow-red  { border-color: rgba(224,49,49,.18); box-shadow: 0 0 40px rgba(224,49,49,.04); }
.ap-card.glow-gold { border-color: rgba(230,119,0,.18); box-shadow: 0 0 40px rgba(230,119,0,.04); }

/* Chip / badge */
.ap-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
}

/* Section divider */
.ap-divider {
  border: none; border-top: 1px solid #111827; margin: 0;
}

/* Table */
.ap-table { width: 100%; border-collapse: collapse; }
.ap-table th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 800; color: #3d4f6e;
  text-transform: uppercase; letter-spacing: .12em;
  border-bottom: 1px solid #111827;
  background: #06080f;
}
.ap-table td {
  padding: 12px 14px;
  font-size: 12px; font-weight: 500; color: #94a3b8;
  border-bottom: 1px solid #0d1120;
}
.ap-table tr:last-child td { border-bottom: none; }
.ap-table tbody tr { transition: background .12s; }
.ap-table tbody tr:hover td { background: rgba(255,255,255,.018); }

/* Tooltip wrapper */
.ap-tooltip-wrap { position: relative; }
.ap-tooltip-wrap:hover .ap-tooltip { opacity: 1; pointer-events: auto; transform: translateY(0); }
.ap-tooltip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px);
  padding: 5px 10px; border-radius: 6px; background: #1e2535; color: #e2e8f0;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: all .15s;
  z-index: 100; border: 1px solid #2a3548;
}
`;

/* ─── CONSTANTS ───────────────────────────────────────────────────── */
const CASE_CATEGORIES = [
  { value: 'real_life', label: 'Real Life',  emoji: '💎', color: '#74c0fc', bg: 'rgba(116,192,252,.1)',  border: 'rgba(116,192,252,.25)' },
  { value: 'roblox',    label: 'Roblox',     emoji: '🟥', color: '#ff6b6b', bg: 'rgba(255,107,107,.1)',  border: 'rgba(255,107,107,.25)' },
  { value: 'csgo',      label: 'CS:GO',      emoji: '🔫', color: '#ffa94d', bg: 'rgba(255,169,77,.1)',   border: 'rgba(255,169,77,.25)'  },
];

const RARITY_COLORS = {
  common: '#94a3b8', uncommon: '#51cf66', rare: '#74c0fc',
  epic: '#cc5de8', legendary: '#ffd43b',
};

const TZ_REGIONS = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

/* ─── UTILS ───────────────────────────────────────────────────────── */
function formatTime(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit',
      second: '2-digit', hour12: false,
    }).format(new Date(date));
  } catch { return '--:--:--'; }
}

function formatDate(ts, tz) {
  if (!ts) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(ts));
  } catch { return new Date(ts).toLocaleString(); }
}

function tzOffset(tz) {
  try {
    const now = new Date();
    const local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const diff = (local - utc) / 3600000;
    return (diff >= 0 ? '+' : '') + diff.toFixed(0);
  } catch { return '+0'; }
}

function relativetime(ts) {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── MICRO-COMPONENTS ────────────────────────────────────────────── */
function Spin() {
  return <Loader2 style={{ width: 14, height: 14 }} className="ap-spin" />;
}

function Badge({ children, color = '#3b5bdb', bg }) {
  return (
    <span className="ap-badge" style={{
      color,
      background: bg || `${color}18`,
      border: `1px solid ${color}35`,
    }}>{children}</span>
  );
}

function Toast({ msg, onDone }) {
  const isErr = msg?.toLowerCase().includes('error') || msg?.startsWith('❌');
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '10px 16px', borderRadius: 9, marginBottom: 12,
        background: isErr ? 'rgba(224,49,49,.08)' : 'rgba(37,162,99,.07)',
        border: `1px solid ${isErr ? 'rgba(224,49,49,.25)' : 'rgba(37,162,99,.2)'}`,
      }}>
      {isErr
        ? <AlertCircle style={{ width: 14, height: 14, color: '#ff6b6b', flexShrink: 0 }} />
        : <CheckCircle2 style={{ width: 14, height: 14, color: '#51cf66', flexShrink: 0 }} />}
      <span style={{ fontSize: 12, fontWeight: 600, color: isErr ? '#ff6b6b' : '#51cf66' }}>{msg}</span>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, sub, color = '#3b5bdb', right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', letterSpacing: '.02em' }}>{title}</p>
          {sub && <p style={{ fontSize: 10, color: '#3d4f6e', fontWeight: 600, marginTop: 1 }}>{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub, delta }) {
  return (
    <div className="ap-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .2s', borderColor: `${color}22` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 16, height: 16, color }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', lineHeight: 1, marginBottom: 3, fontFamily: 'Space Mono, monospace' }}>{value}</p>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#3d4f6e', letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</p>
        {sub && <p style={{ fontSize: 9, color: `${color}80`, marginTop: 2, fontWeight: 600 }}>{sub}</p>}
      </div>
      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: delta >= 0 ? '#51cf66' : '#ff6b6b' }}>
          {delta >= 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
          {Math.abs(delta)}%
        </div>
      )}
    </div>
  );
}

/* ─── SECURITY RESTRICTION TOGGLES ──────────────────────────────── */
function SecurityRestrictions({ user, onUpdate, loading }) {
  const restrictions = user?.restrictions || {};
  const flags = [
    { key: 'disable_deposit',  icon: ArrowDownLeft, label: 'Deposits',    color: '#ffa94d', desc: 'Block all incoming deposits' },
    { key: 'disable_withdraw', icon: ArrowUpRight,  label: 'Withdrawals', color: '#ff6b6b', desc: 'Block all withdrawal requests' },
    { key: 'disable_tips_send',icon: Send,          label: 'Send Tips',   color: '#cc5de8', desc: 'Block sending tips to users' },
    { key: 'disable_tips_recv',icon: Download,      label: 'Recv Tips',   color: '#74c0fc', desc: 'Block receiving tips from others' },
    { key: 'disable_betting',  icon: Gamepad2,      label: 'Betting',     color: '#51cf66', desc: 'Block placing bets & games' },
    { key: 'read_only',        icon: EyeOff,        label: 'Read Only',   color: '#ff6b6b', desc: 'Full account lockdown (view only)' },
  ];

  const toggle = async (key) => {
    const newVal = !restrictions[key];
    const newRestrictions = { ...restrictions, [key]: newVal };
    await onUpdate({ restrictions: newRestrictions });
  };

  return (
    <div className="ap-card glow-red" style={{ padding: 16 }}>
      <SectionHeader icon={Lock} title="Account Restrictions" sub="Toggle financial & activity permissions" color="#ff6b6b" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {flags.map(({ key, icon: Icon, label, color, desc }) => {
          const active = !!restrictions[key];
          return (
            <motion.button key={key} whileTap={{ scale: .97 }}
              onClick={() => toggle(key)} disabled={loading}
              className="ap-tooltip-wrap"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                background: active ? `${color}12` : 'rgba(255,255,255,.025)',
                border: `1px solid ${active ? color + '40' : '#1e2535'}`,
                transition: 'all .18s', outline: 'none', textAlign: 'left',
              }}>
              <span className="ap-tooltip">{desc}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? `${color}20` : 'rgba(255,255,255,.04)', border: `1px solid ${active ? color + '30' : '#1e2535'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 12, height: 12, color: active ? color : '#3d4f6e' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: active ? color : '#4a5568', marginBottom: 1 }}>{label}</p>
                <p style={{ fontSize: 9, color: active ? `${color}80` : '#2d3a52', fontWeight: 600 }}>
                  {active ? '⛔ BLOCKED' : '✓ Allowed'}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', width: 22, height: 12, borderRadius: 6, background: active ? color : '#1e2535', border: `1px solid ${active ? color : '#2a3548'}`, position: 'relative', flexShrink: 0, transition: 'all .18s' }}>
                <div style={{ position: 'absolute', top: 1, left: active ? 11 : 1, width: 8, height: 8, borderRadius: '50%', background: active ? '#fff' : '#3d4f6e', transition: 'left .18s' }} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TIMEZONE TRACKER ───────────────────────────────────────────── */
function TimezoneInfo({ user }) {
  const tz = user?.timezone || user?.detected_timezone || 'UTC';
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ap-card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Globe style={{ width: 13, height: 13, color: '#74c0fc' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#74c0fc', textTransform: 'uppercase', letterSpacing: '.1em' }}>Timezone & Location</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Timezone', value: tz, mono: true },
          { label: 'UTC Offset', value: `UTC${tzOffset(tz)}`, mono: true },
          { label: "User's Local Time", value: formatTime(currentTime, tz), mono: true },
          { label: 'Last Seen', value: relativetime(user?.last_seen || user?.updated_date), mono: false },
          { label: 'Registered IP', value: user?.last_ip || 'N/A', mono: true },
          { label: 'Country', value: user?.country || 'Unknown', mono: false },
        ].map(({ label, value, mono }) => (
          <div key={label} style={{ padding: '8px 10px', borderRadius: 7, background: '#06080f', border: '1px solid #111827' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#3d4f6e', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', ...(mono ? { fontFamily: 'Space Mono, monospace', fontSize: 11 } : {}) }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TRANSACTION HISTORY ─────────────────────────────────────────── */
function TransactionHistory({ userId }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.Transaction.filter({ user_id: userId }, 50);
        setTxns(Array.isArray(data) ? data : []);
      } catch {
        // Generate mock data for preview
        setTxns([]);
      }
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  const filtered = typeFilter === 'all' ? txns : txns.filter(t => t.type === typeFilter);

  const txnIcon = (type) => {
    if (type === 'deposit')  return { icon: ArrowDownLeft, color: '#51cf66' };
    if (type === 'withdraw') return { icon: ArrowUpRight,  color: '#ff6b6b' };
    if (type === 'tip_sent') return { icon: Send,          color: '#cc5de8' };
    if (type === 'tip_recv') return { icon: Download,      color: '#74c0fc' };
    if (type === 'bet')      return { icon: Gamepad2,      color: '#ffa94d' };
    return { icon: DollarSign, color: '#94a3b8' };
  };

  return (
    <div className="ap-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign style={{ width: 13, height: 13, color: '#51cf66' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#51cf66', textTransform: 'uppercase', letterSpacing: '.1em' }}>Transaction History</span>
          <Badge color="#51cf66">{filtered.length}</Badge>
        </div>
        <select className="ap-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 120, padding: '5px 10px', fontSize: 11 }}>
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
          <option value="tip_sent">Tips Sent</option>
          <option value="tip_recv">Tips Recv</option>
          <option value="bet">Bets</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spin /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <History style={{ width: 28, height: 28, color: '#1e2535', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 12, color: '#2d3a52', fontWeight: 600 }}>No transactions found</p>
        </div>
      ) : (
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const { icon: TIcon, color } = txnIcon(t.type);
                return (
                  <tr key={t.id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <TIcon style={{ width: 12, height: 12, color, flexShrink: 0 }} />
                        <span style={{ color, fontWeight: 700, textTransform: 'capitalize' }}>{t.type?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: t.type === 'deposit' || t.type === 'tip_recv' ? '#51cf66' : '#ff6b6b', fontSize: 12 }}>
                        {t.type === 'deposit' || t.type === 'tip_recv' ? '+' : '-'}{(t.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <Badge color={t.status === 'completed' ? '#51cf66' : t.status === 'pending' ? '#ffa94d' : '#ff6b6b'}>
                        {t.status || 'completed'}
                      </Badge>
                    </td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 10 }}>
                      {formatDate(t.created_date, 'UTC').split(',')[0]}
                    </td>
                    <td style={{ color: '#4a5568', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.note || t.description || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── GAME HISTORY ────────────────────────────────────────────────── */
function GameHistory({ userId }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.GameHistory.filter({ user_id: userId }, 50);
        setGames(Array.isArray(data) ? data : []);
      } catch { setGames([]); }
      setLoading(false);
    };
    if (userId) load();
  }, [userId]);

  return (
    <div className="ap-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Gamepad2 style={{ width: 13, height: 13, color: '#ffa94d' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#ffa94d', textTransform: 'uppercase', letterSpacing: '.1em' }}>Game History</span>
        <Badge color="#ffa94d">{games.length}</Badge>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spin /></div>
      ) : games.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Gamepad2 style={{ width: 28, height: 28, color: '#1e2535', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 12, color: '#2d3a52', fontWeight: 600 }}>No games played yet</p>
        </div>
      ) : (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table className="ap-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Bet</th>
                <th>Outcome</th>
                <th>Profit/Loss</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => {
                const won = g.outcome === 'win' || g.result === 'win';
                const pnl = won ? (g.payout || g.winnings || 0) - (g.bet_amount || g.amount || 0) : -(g.bet_amount || g.amount || 0);
                return (
                  <tr key={g.id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: '#0d1120', border: '1px solid #1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                          {g.game_emoji || '🎮'}
                        </div>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>{g.game_type || g.game_name || 'Case Open'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ color: '#74c0fc', fontSize: 11 }}>
                        {(g.bet_amount || g.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <Badge color={won ? '#51cf66' : '#ff6b6b'}>{won ? 'WIN' : 'LOSS'}</Badge>
                    </td>
                    <td>
                      <span className="mono" style={{ color: pnl >= 0 ? '#51cf66' : '#ff6b6b', fontWeight: 700, fontSize: 11 }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#3d4f6e' }}>
                      {relativetime(g.created_date || g.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── FULL ACTIVITY FEED ─────────────────────────────────────────── */
function ActivityFeed({ adminLog }) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [allBets, setAllBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin'); // admin | bets | all

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const bets = await base44.entities.GameHistory.list('', 100);
        setAllBets(Array.isArray(bets) ? bets : []);
      } catch { setAllBets([]); }
      setLoading(false);
    };
    load();
  }, []);

  // Combine and sort all events
  const combined = [
    ...adminLog.map(e => ({ ...e, _type: 'admin' })),
    ...allBets.map(b => ({
      _type: 'bet',
      action: `${b.user_name || b.user_id || 'User'} — ${b.game_type || 'Game'} — Bet ${(b.bet_amount||0).toLocaleString()} — ${b.outcome === 'win' ? '🏆 WON' : '❌ LOST'}`,
      timestamp: relativetime(b.created_date),
      raw_ts: b.created_date,
      outcome: b.outcome,
      user: b.user_name,
      amount: b.bet_amount,
      game: b.game_type,
    })),
  ].sort((a, b) => new Date(b.raw_ts || 0) - new Date(a.raw_ts || 0));

  const displayed = viewMode === 'admin' ? adminLog
    : viewMode === 'bets' ? combined.filter(e => e._type === 'bet')
    : combined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: '#0a0d14', borderRadius: 9, border: '1px solid #111827', alignSelf: 'flex-start' }}>
        {[
          { id: 'admin', label: 'Admin Actions', icon: Terminal },
          { id: 'bets',  label: 'User Bets',     icon: Gamepad2 },
          { id: 'all',   label: 'All Events',    icon: Radio },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} className="ap-tab" onClick={() => setViewMode(id)} style={{
            background: viewMode === id ? 'rgba(59,91,219,.15)' : 'transparent',
            border: `1px solid ${viewMode === id ? 'rgba(59,91,219,.35)' : 'transparent'}`,
            color: viewMode === id ? '#748ffc' : '#3d4f6e',
          }}>
            <Icon style={{ width: 11, height: 11 }} />{label}
          </button>
        ))}
      </div>

      <div className="ap-card glow-blue">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="ap-live-dot" style={{ background: '#51cf66', color: '#51cf66' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#51cf66', textTransform: 'uppercase', letterSpacing: '.12em' }}>Live Feed</span>
            <Badge color="#51cf66">{displayed.length}</Badge>
          </div>
          <span style={{ fontSize: 10, color: '#3d4f6e', fontFamily: 'Space Mono', fontWeight: 700 }}>
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {loading && viewMode !== 'admin' ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin /></div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Activity style={{ width: 30, height: 30, color: '#1e2535' }} />
            <p style={{ fontSize: 12, color: '#2d3a52', fontWeight: 600 }}>No events yet</p>
          </div>
        ) : (
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {displayed.map((log, i) => {
              const isAdmin = log._type === 'admin' || !log._type;
              const isBetWin = log._type === 'bet' && log.outcome === 'win';
              const isBetLoss = log._type === 'bet' && log.outcome === 'loss';
              const dotColor = isAdmin ? '#748ffc' : isBetWin ? '#51cf66' : '#ff6b6b';

              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * .015, .3) }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 16px', borderBottom: '1px solid #0d1120' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', lineHeight: 1.4 }}>{log.action}</p>
                    {log._type === 'bet' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                        <Badge color="#74c0fc">{log.game || 'Game'}</Badge>
                        <Badge color={isBetWin ? '#51cf66' : '#ff6b6b'}>{isBetWin ? 'WIN' : 'LOSS'}</Badge>
                        <span className="mono" style={{ fontSize: 9, color: '#3d4f6e', alignSelf: 'center' }}>
                          {(log.amount || 0).toLocaleString()} coins
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: '#3d4f6e', fontFamily: 'Space Mono', fontWeight: 700 }}>{log.timestamp}</p>
                    {isAdmin && (
                      <Badge color="#748ffc" style={{ marginTop: 3 }}>Admin</Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── USER DETAIL PANEL ──────────────────────────────────────────── */
function UserDetailPanel({ user: selectedUser, onUpdate, onBan, onDelete, onLog, loading }) {
  const [balanceAmount, setBalanceAmount] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [msg, setMsg] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleBalance = async () => {
    if (!balanceAmount) return;
    const nb = Math.max(0, parseInt(balanceAmount));
    try {
      await base44.entities.User.update(selectedUser.id, { balance: nb });
      onLog(`Balance → ${selectedUser.full_name}: ${nb.toLocaleString()}`);
      onUpdate({ ...selectedUser, balance: nb });
      flash('✅ Balance updated');
      setBalanceAmount('');
    } catch { flash('❌ Error updating balance'); }
  };

  const handleRole = async (role) => {
    try {
      await base44.entities.User.update(selectedUser.id, { role });
      onLog(`Role → ${selectedUser.full_name}: ${role}`);
      onUpdate({ ...selectedUser, role });
      flash(`✅ Role: ${role}`);
    } catch { flash('❌ Error changing role'); }
  };

  const handleRestrictions = async (updates) => {
    try {
      await base44.entities.User.update(selectedUser.id, updates);
      onLog(`Restrictions updated for ${selectedUser.full_name}`);
      onUpdate({ ...selectedUser, ...updates });
      flash('✅ Restrictions updated');
    } catch { flash('❌ Error updating restrictions'); }
  };

  const sections = [
    { id: 'overview',      label: 'Overview',     icon: Users },
    { id: 'security',      label: 'Security',     icon: Lock },
    { id: 'transactions',  label: 'Transactions', icon: DollarSign },
    { id: 'games',         label: 'Game History', icon: Gamepad2 },
    { id: 'timezone',      label: 'Timezone',     icon: Globe },
  ];

  const roleColors = { admin: '#ff6b6b', mod: '#cc5de8', user: '#74c0fc' };
  const rc = roleColors[selectedUser.role] || '#74c0fc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top profile bar */}
      <div className="ap-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#3b5bdb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', border: `2px solid ${selectedUser.is_banned ? '#ff6b6b40' : selectedUser.restrictions?.read_only ? '#ffa94d40' : '#1e253540'}` }}>
            {selectedUser.avatar_url && selectedUser.avatar_url !== 'null'
              ? <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : selectedUser.full_name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0' }}>{selectedUser.full_name}</p>
              {selectedUser.is_banned && <Badge color="#ff6b6b">BANNED</Badge>}
              {selectedUser.restrictions?.read_only && <Badge color="#ffa94d">READ-ONLY</Badge>}
              {selectedUser.restrictions?.disable_deposit && <Badge color="#ffa94d">NO DEPOSITS</Badge>}
            </div>
            <p style={{ fontSize: 11, color: '#3d4f6e', fontWeight: 500, marginBottom: 7 }}>{selectedUser.email}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge color={rc}>{selectedUser.role || 'user'}</Badge>
              <span className="mono" style={{ fontSize: 10, color: '#51cf66', fontWeight: 700 }}>
                {(selectedUser.balance || 0).toLocaleString()} coins
              </span>
              <span style={{ fontSize: 10, color: '#3d4f6e', fontWeight: 600 }}>
                {relativetime(selectedUser.last_seen || selectedUser.updated_date)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <motion.button whileTap={{ scale: .95 }} onClick={() => onBan(selectedUser)} disabled={loading}
              className={`ap-btn ${selectedUser.is_banned ? 'success' : 'danger'}`} style={{ padding: '8px 14px' }}>
              {selectedUser.is_banned ? <><UserCheck style={{ width: 12, height: 12 }} />Unban</> : <><Ban style={{ width: 12, height: 12 }} />Ban</>}
            </motion.button>
            <motion.button whileTap={{ scale: .95 }} onClick={() => onDelete(selectedUser)} disabled={loading}
              className="ap-btn danger" style={{ padding: '8px 10px' }}>
              <Trash2 style={{ width: 12, height: 12 }} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#0a0d14', borderRadius: 9, border: '1px solid #111827' }}>
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} className="ap-tab" onClick={() => setActiveSection(id)} style={{
            flex: 1, justifyContent: 'center',
            background: activeSection === id ? 'rgba(59,91,219,.12)' : 'transparent',
            border: `1px solid ${activeSection === id ? 'rgba(59,91,219,.3)' : 'transparent'}`,
            color: activeSection === id ? '#748ffc' : '#3d4f6e',
            fontSize: 11,
          }}>
            <Icon style={{ width: 11, height: 11 }} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence>{msg && <Toast msg={msg} onDone={() => setMsg('')} />}</AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: 'Balance', value: `${(selectedUser.balance || 0).toLocaleString()}`, color: '#ffd43b', suffix: 'coins' },
                  { label: 'Level',   value: selectedUser.level || 1,                           color: '#cc5de8', suffix: 'lvl' },
                  { label: 'Cases',   value: selectedUser.cases_opened || 0,                    color: '#74c0fc', suffix: 'opened' },
                ].map(({ label, value, color, suffix }) => (
                  <div key={label} className="ap-card" style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 9, color: '#3d4f6e', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 5 }}>{label}</p>
                    <p className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
                    <p style={{ fontSize: 9, color: '#2d3a52', fontWeight: 600, marginTop: 2 }}>{suffix}</p>
                  </div>
                ))}
              </div>

              {/* Balance edit */}
              <div className="ap-card glow-gold" style={{ padding: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#ffa94d', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Adjust Balance</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" className="ap-input gold" placeholder="New balance…" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} />
                  <button className="ap-btn warning" onClick={handleBalance} disabled={loading || !balanceAmount} style={{ flexShrink: 0, padding: '10px 16px' }}>
                    {loading ? <Spin /> : <DollarSign style={{ width: 13, height: 13 }} />}
                    Set
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="ap-card" style={{ padding: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#3d4f6e', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Role</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['user', 'mod', 'admin'].map(role => {
                    const rc2 = roleColors[role] || '#74c0fc';
                    const active = selectedUser.role === role;
                    return (
                      <motion.button key={role} whileTap={{ scale: .96 }} onClick={() => handleRole(role)} disabled={loading}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${active ? rc2 + '45' : '#1e2535'}`, background: active ? `${rc2}14` : 'rgba(255,255,255,.02)', color: active ? rc2 : '#3d4f6e', fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all .18s', textTransform: 'capitalize' }}>
                        {role}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <SecurityRestrictions user={selectedUser} onUpdate={handleRestrictions} loading={loading} />
          )}

          {activeSection === 'transactions' && (
            <TransactionHistory userId={selectedUser.id} />
          )}

          {activeSection === 'games' && (
            <GameHistory userId={selectedUser.id} />
          )}

          {activeSection === 'timezone' && (
            <TimezoneInfo user={selectedUser} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── CASES TAB (kept, cleaned up) ──────────────────────────────── */
function CasesTab({ onLog }) {
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [msg, setMsg]         = useState('');

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CaseTemplate.list('', 100);
      setCases(data);
    } catch { flash('❌ Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const displayed = filter === 'all' ? cases : cases.filter(c => (c.category || 'real_life') === filter);

  return (
    <div>
      <AnimatePresence>{msg && <Toast msg={msg} onDone={() => setMsg('')} />}</AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ value: 'all', label: 'All', color: '#748ffc' }, ...CASE_CATEGORIES.map(c => ({ ...c, value: c.value, label: c.label, color: c.color }))].map(cat => (
            <button key={cat.value} className="ap-tab" onClick={() => setFilter(cat.value)} style={{
              background: filter === cat.value ? `${cat.color}14` : 'rgba(255,255,255,.025)',
              border: `1px solid ${filter === cat.value ? cat.color + '35' : '#1e2535'}`,
              color: filter === cat.value ? cat.color : '#3d4f6e',
            }}>
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.label}
              <Badge color={cat.color}>{filter === cat.value ? displayed.length : (cat.value === 'all' ? cases.length : cases.filter(c => (c.category || 'real_life') === cat.value).length)}</Badge>
            </button>
          ))}
        </div>
        <button className="ap-btn ghost" onClick={load} style={{ padding: '8px 12px' }}>
          <RefreshCw style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {displayed.map((c, i) => {
            const catCfg = CASE_CATEGORIES.find(x => x.value === (c.category || 'real_life')) || CASE_CATEGORIES[0];
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
                className="ap-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {c.image_url
                    ? <img src={c.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 9, objectFit: 'cover', border: '1px solid #1e2535', flexShrink: 0 }} />
                    : <div style={{ width: 48, height: 48, borderRadius: 9, background: '#0d1120', border: '1px solid #1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Box style={{ width: 18, height: 18, color: '#3d4f6e' }} />
                      </div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{c.name}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <Badge color="#ffd43b">{(c.price || 0).toLocaleString()} coins</Badge>
                      <Badge color={catCfg.color}>{catCfg.emoji} {catCfg.label}</Badge>
                      <Badge color={c.is_active ? '#51cf66' : '#ff6b6b'}>{c.is_active ? 'Active' : 'Off'}</Badge>
                    </div>
                  </div>
                </div>
                {c.items?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {c.items.slice(0, 6).map((item, j) => (
                      <div key={j} title={item.name} style={{ width: 28, height: 28, borderRadius: 6, background: `${RARITY_COLORS[item.rarity] || '#94a3b8'}12`, border: `1.5px solid ${RARITY_COLORS[item.rarity] || '#94a3b8'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                        {item.image_url ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 5, objectFit: 'cover' }} /> : '◆'}
                      </div>
                    ))}
                    {c.items.length > 6 && <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0d1120', border: '1px solid #1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#3d4f6e', fontWeight: 700 }}>+{c.items.length - 6}</div>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN ADMIN ─────────────────────────────────────────────────── */
export default function Admin() {
  useRequireAuth();

  const [currentUser, setCurrentUser]   = useState(null);
  const [allUsers, setAllUsers]         = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activityLog, setActivityLog]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState('');
  const [tab, setTab]                   = useState('users');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing]     = useState(false);

  const flash = m => { setMessage(m); setTimeout(() => setMessage(''), 3500); };
  const addLog = action => setActivityLog(prev => [{
    action, timestamp: relativetime(new Date()),
    raw_ts: new Date().toISOString(), _type: 'admin',
  }, ...prev.slice(0, 49)]);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setCurrentUser(u);
        if (u?.role === 'admin') loadUsers();
      } catch {}
    };
    init();
  }, []);

  const loadUsers = async () => {
    setRefreshing(true);
    try {
      const result = await base44.functions.invoke('syncAdminUsers', {});
      setAllUsers(result?.data?.users || result?.users || []);
    } catch { flash('❌ Failed to load users'); }
    setRefreshing(false);
  };

  const handleUserUpdate = (updated) => {
    setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSelectedUser(updated);
  };

  const handleBan = async (u) => {
    setLoading(true);
    try {
      const ns = !u.is_banned;
      await base44.entities.User.update(u.id, { is_banned: ns });
      const updated = { ...u, is_banned: ns };
      handleUserUpdate(updated);
      addLog(`${ns ? 'Banned' : 'Unbanned'}: ${u.full_name}`);
      flash(ns ? '✅ User banned' : '✅ User unbanned');
    } catch { flash('❌ Error'); }
    setLoading(false);
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.full_name}?`)) return;
    setLoading(true);
    try {
      await base44.entities.User.delete(u.id);
      setAllUsers(prev => prev.filter(x => x.id !== u.id));
      setSelectedUser(null);
      addLog(`Deleted: ${u.full_name}`);
      flash('✅ User deleted');
    } catch { flash('❌ Error deleting'); }
    setLoading(false);
  };

  // Filter pipeline
  let filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (roleFilter !== 'all')   filteredUsers = filteredUsers.filter(u => (u.role || 'user') === roleFilter);
  if (statusFilter === 'banned')    filteredUsers = filteredUsers.filter(u => u.is_banned);
  if (statusFilter === 'active')    filteredUsers = filteredUsers.filter(u => !u.is_banned);
  if (statusFilter === 'restricted') filteredUsers = filteredUsers.filter(u => u.restrictions && Object.values(u.restrictions).some(Boolean));

  if (currentUser && currentUser.role !== 'admin') return (
    <div className="ap-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 14 }}>
      <style>{CSS}</style>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(224,49,49,.08)', border: '1px solid rgba(224,49,49,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock style={{ width: 24, height: 24, color: '#ff6b6b' }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>Access Denied</p>
      <p style={{ fontSize: 12, color: '#3d4f6e', fontWeight: 500 }}>Admin credentials required to access this panel.</p>
    </div>
  );

  const TABS = [
    { id: 'users',    label: 'User Management', icon: Users,    color: '#748ffc' },
    { id: 'cases',    label: 'Cases',           icon: Box,      color: '#74c0fc' },
    { id: 'activity', label: 'Activity & Bets', icon: Activity, color: '#51cf66' },
  ];

  const stats = [
    { icon: Users,    label: 'Total Users',    value: allUsers.length,                                             color: '#748ffc' },
    { icon: UserX,    label: 'Banned',         value: allUsers.filter(u => u.is_banned).length,                    color: '#ff6b6b' },
    { icon: Lock,     label: 'Restricted',     value: allUsers.filter(u => u.restrictions && Object.values(u.restrictions).some(Boolean)).length, color: '#ffa94d' },
    { icon: Crown,    label: 'Admins',         value: allUsers.filter(u => u.role === 'admin').length,             color: '#cc5de8' },
  ];

  return (
    <div className="ap-root" style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: 12, background: '#080b12', border: '1px solid #111827' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,91,219,.12)', border: '1px solid rgba(59,91,219,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: 18, height: 18, color: '#748ffc' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', fontFamily: 'Space Mono, monospace', letterSpacing: '.04em' }}>ADMIN PANEL</h1>
                <Badge color="#ff6b6b">RESTRICTED</Badge>
              </div>
              <p style={{ fontSize: 11, color: '#3d4f6e', fontWeight: 500 }}>
                Security Management · {allUsers.length} users · {activityLog.length} actions this session
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="ap-live-dot" style={{ background: '#51cf66', color: '#51cf66' }} />
              <span className="mono" style={{ fontSize: 10, color: '#3d4f6e', fontWeight: 700 }}>LIVE</span>
            </div>
            {currentUser?.full_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 8, background: '#0d1120', border: '1px solid #1e2535' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#3b5bdb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  {currentUser.full_name[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#748ffc' }}>{currentUser.full_name}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .07 + i * .04 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>{message && <Toast msg={message} onDone={() => setMessage('')} />}</AnimatePresence>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: '#080b12', borderRadius: 9, border: '1px solid #111827', alignSelf: 'flex-start' }}>
          {TABS.map(t => (
            <button key={t.id} className="ap-tab" onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? `${t.color}12` : 'transparent',
              border: `1px solid ${tab === t.id ? t.color + '30' : 'transparent'}`,
              color: tab === t.id ? t.color : '#3d4f6e',
              fontSize: 12,
            }}>
              <t.icon style={{ width: 12, height: 12 }} />{t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 20 }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#3d4f6e' }} />
                  <input className="ap-input" placeholder="Search users…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 34, fontSize: 12 }} />
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <select className="ap-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ fontSize: 11, padding: '7px 10px' }}>
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="mod">Mod</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 11, padding: '7px 10px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>

                {/* Count + refresh */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <span className="mono" style={{ fontSize: 10, color: '#3d4f6e', fontWeight: 700 }}>
                    {filteredUsers.length} / {allUsers.length} users
                  </span>
                  <button className="ap-btn ghost" onClick={loadUsers} disabled={refreshing} style={{ padding: '5px 10px', fontSize: 11 }}>
                    {refreshing ? <Spin /> : <RefreshCw style={{ width: 11, height: 11 }} />}
                  </button>
                </div>

                {/* User list */}
                <div style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: '#2d3a52', fontWeight: 600 }}>No users found</p>
                    </div>
                  ) : filteredUsers.map((u, i) => {
                    const rc = { admin: '#ff6b6b', mod: '#cc5de8', user: '#748ffc' }[u.role] || '#748ffc';
                    const hasRestrictions = u.restrictions && Object.values(u.restrictions).some(Boolean);
                    return (
                      <motion.button key={u.id}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * .02, .2) }}
                        onClick={() => setSelectedUser(u)} className="ap-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, cursor: 'pointer', background: selectedUser?.id === u.id ? 'rgba(59,91,219,.07)' : 'rgba(255,255,255,.02)', border: `1px solid ${selectedUser?.id === u.id ? 'rgba(59,91,219,.25)' : '#111827'}`, textAlign: 'left', outline: 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#3b5bdb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', border: `1.5px solid ${u.is_banned ? '#ff6b6b40' : '#1e253560'}` }}>
                          {u.avatar_url && u.avatar_url !== 'null' ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{u.full_name}</p>
                          <p style={{ fontSize: 10, color: '#3d4f6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{u.email}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                          {u.is_banned && <span style={{ fontSize: 8, fontWeight: 800, color: '#ff6b6b', background: 'rgba(224,49,49,.12)', border: '1px solid rgba(224,49,49,.25)', padding: '1px 5px', borderRadius: 3 }}>BAN</span>}
                          {hasRestrictions && !u.is_banned && <span style={{ fontSize: 8, fontWeight: 800, color: '#ffa94d', background: 'rgba(230,119,0,.12)', border: '1px solid rgba(230,119,0,.25)', padding: '1px 5px', borderRadius: 3 }}>RES</span>}
                          <span style={{ fontSize: 8, fontWeight: 800, color: rc, textTransform: 'uppercase', letterSpacing: '.06em' }}>{u.role || 'user'}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Detail panel */}
              {selectedUser ? (
                <motion.div key={selectedUser.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <UserDetailPanel
                    user={selectedUser}
                    onUpdate={handleUserUpdate}
                    onBan={handleBan}
                    onDelete={handleDelete}
                    onLog={addLog}
                    loading={loading}
                  />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="ap-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,91,219,.06)', border: '1px solid rgba(59,91,219,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 20, height: 20, color: '#3d4f6e' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#3d4f6e' }}>Select a user to manage</p>
                  <p style={{ fontSize: 11, color: '#2d3a52', fontWeight: 500 }}>{filteredUsers.length} users in current filter</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── CASES ── */}
          {tab === 'cases' && (
            <motion.div key="cases" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CasesTab onLog={addLog} />
            </motion.div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ActivityFeed adminLog={activityLog} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}