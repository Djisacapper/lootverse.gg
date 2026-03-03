import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, DollarSign, Ban, Trash2, Activity,
  AlertCircle, CheckCircle2, Loader2, Box, Plus, X,
  Trophy, RefreshCw, Users, Crown, Zap, ChevronRight
} from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
.ad-root { font-family: 'Nunito', sans-serif; }

@keyframes ad-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.45; }
  95% { opacity:.45; }
  100%{ top:100%; opacity:0; }
}
.ad-scan {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(239,68,68,.25),transparent);
  animation:ad-scan 7s linear infinite; pointer-events:none;
}
.ad-scan-gold {
  position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(251,191,36,.2),transparent);
  animation:ad-scan 6s linear infinite; pointer-events:none;
}

@keyframes ad-hex-pulse {
  0%,100% { opacity:.018; }
  50%     { opacity:.045; }
}
.ad-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(239,68,68,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(239,68,68,.06) 1px, transparent 1px);
  background-size:28px 28px;
  animation:ad-hex-pulse 5s ease-in-out infinite;
}

@keyframes ad-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.ad-shim { position:relative; overflow:hidden; }
.ad-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,60,60,.04),transparent);
  animation:ad-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes ad-shield-pulse {
  0%,100% { filter:drop-shadow(0 0 6px rgba(239,68,68,.5)); }
  50%     { filter:drop-shadow(0 0 18px rgba(239,68,68,.9)); }
}
.ad-shield { animation:ad-shield-pulse 2.5s ease-in-out infinite; }

.ad-tab-btn {
  display:flex; align-items:center; gap:7px;
  padding:9px 18px; border-radius:10px; border:none; cursor:pointer;
  font-family:'Nunito',sans-serif; font-size:12px; font-weight:800;
  transition:all .18s; white-space:nowrap;
}

.ad-input {
  width:100%; padding:10px 13px; border-radius:10px;
  border:1px solid rgba(255,255,255,.09);
  background:rgba(255,255,255,.04); color:#fff;
  font-size:13px; font-weight:700; font-family:'Nunito',sans-serif;
  transition:border-color .2s, box-shadow .2s;
  box-sizing:border-box;
}
.ad-input::placeholder { color:rgba(255,255,255,.28); }
.ad-input:focus {
  outline:none;
  border-color:rgba(239,68,68,.45);
  box-shadow:0 0 0 3px rgba(239,68,68,.08);
}
.ad-input-gold:focus {
  border-color:rgba(251,191,36,.45) !important;
  box-shadow:0 0 0 3px rgba(251,191,36,.08) !important;
}
.ad-select {
  appearance:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.09);
  color:rgba(255,255,255,.7);
  font-family:'Nunito',sans-serif; font-weight:700; font-size:13px;
  padding:10px 13px; border-radius:10px; outline:none; width:100%;
  transition:border-color .2s;
}
.ad-select:focus { border-color:rgba(239,68,68,.4); }
.ad-select option { background:#0d0008; }

.ad-user-row { transition:border-color .22s, background .22s; }
.ad-user-row:hover { border-color:rgba(239,68,68,.3) !important; background:rgba(239,68,68,.05) !important; }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#2a0010; border-radius:4px; }
`;

const RARITY_COLORS = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#a855f7', legendary: '#fbbf24',
};

/* ─── Inline label ───────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.16em', marginBottom:7 }}>
      {children}
    </p>
  );
}

/* ─── Toast message ─────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  const isErr = msg.toLowerCase().includes('error') || msg.startsWith('❌');
  return (
    <motion.div
      initial={{ opacity:0, y:-10, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-10 }}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'11px 16px', borderRadius:12, marginBottom:16,
        background: isErr ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.07)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,.25)' : 'rgba(34,197,94,.22)'}`,
      }}>
      {isErr
        ? <AlertCircle style={{ width:16, height:16, color:'#f87171', flexShrink:0 }} />
        : <CheckCircle2 style={{ width:16, height:16, color:'#4ade80', flexShrink:0 }} />}
      <span style={{ fontSize:13, fontWeight:700, color: isErr ? '#f87171' : '#4ade80' }}>{msg}</span>
    </motion.div>
  );
}

/* ─── Section card ──────────────────────────────────────────────── */
function Card({ children, accent = 'red', style = {} }) {
  const colors = { red:'rgba(239,68,68,.14)', gold:'rgba(251,191,36,.14)', cyan:'rgba(6,182,212,.14)', purple:'rgba(168,85,247,.14)' };
  const borders = { red:'rgba(239,68,68,.14)', gold:'rgba(251,191,36,.14)', cyan:'rgba(6,182,212,.14)', purple:'rgba(168,85,247,.14)' };
  return (
    <div className="ad-shim" style={{
      position:'relative', overflow:'hidden', borderRadius:16,
      background:'linear-gradient(145deg,#0a0010,#120018,#050008)',
      border:`1px solid ${borders[accent]}`,
      padding:'20px 20px',
      ...style,
    }}>
      <div className="ad-scan" />
      {children}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Admin() {
  const [user, setUser]                   = useState(null);
  const [allUsers, setAllUsers]           = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedUser, setSelectedUser]   = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [activityLog, setActivityLog]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState('');
  const [tab, setTab]                     = useState('users');

  // Case form
  const [caseName, setCaseName]           = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [casePrice, setCasePrice]         = useState('');
  const [caseCategory, setCaseCategory]   = useState('standard');
  const [caseImage, setCaseImage]         = useState(null);
  const [items, setItems]                 = useState([]);
  const [itemName, setItemName]           = useState('');
  const [itemRarity, setItemRarity]       = useState('common');
  const [itemValue, setItemValue]         = useState('');
  const [itemDropRate, setItemDropRate]   = useState('');
  const [itemImages, setItemImages]       = useState([]);

  // Leaderboard
  const [syncLoading, setSyncLoading]     = useState(false);
  const [syncMessage, setSyncMessage]     = useState('');

  useEffect(() => { checkAdminAccess(); }, []);

  const checkAdminAccess = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u?.role === 'admin') loadAllUsers();
  };

  const loadAllUsers = async () => {
    const users = await base44.entities.User.list('', 100);
    setAllUsers(users);
  };

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };

  const addLog = (action) => setActivityLog(prev => [
    { timestamp: new Date().toLocaleTimeString(), action }, ...prev.slice(0, 19)
  ]);

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    setLoading(true);
    try {
      const nb = Math.max(0, parseInt(balanceAmount));
      await base44.entities.User.update(selectedUser.id, { balance: nb });
      setSelectedUser({ ...selectedUser, balance: nb });
      addLog(`Balance → ${selectedUser.full_name}: ${nb.toLocaleString()}`);
      flash('Balance updated');
      setBalanceAmount('');
    } catch { flash('Error updating balance'); }
    setLoading(false);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const ns = !selectedUser.is_banned;
      await base44.entities.User.update(selectedUser.id, { is_banned: ns });
      setSelectedUser({ ...selectedUser, is_banned: ns });
      addLog(`${ns ? 'Banned' : 'Unbanned'} ${selectedUser.full_name}`);
      flash(ns ? 'User banned' : 'User unbanned');
    } catch { flash('Error updating ban status'); }
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !window.confirm(`Delete ${selectedUser.full_name}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await base44.entities.User.delete(selectedUser.id);
      addLog(`Deleted ${selectedUser.full_name}`);
      setAllUsers(allUsers.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      flash('User deleted');
    } catch { flash('Error deleting user'); }
    setLoading(false);
  };

  const handleChangeRole = async (role) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await base44.entities.User.update(selectedUser.id, { role });
      setSelectedUser({ ...selectedUser, role });
      addLog(`Role → ${selectedUser.full_name}: ${role}`);
      flash(`Role changed to ${role}`);
      loadAllUsers();
    } catch { flash('Error changing role'); }
    setLoading(false);
  };

  const handleAddItem = () => {
    if (!itemName || !itemValue || !itemDropRate) return;
    setItems([...items, { name:itemName, rarity:itemRarity, value:parseInt(itemValue), drop_rate:parseInt(itemDropRate), image_files:itemImages }]);
    setItemName(''); setItemValue(''); setItemDropRate(''); setItemImages([]);
  };

  const handleCreateCase = async () => {
    if (!caseName || !casePrice || items.length === 0) { flash('Fill all fields and add at least one item'); return; }
    setLoading(true);
    try {
      let imageUrl = null;
      if (caseImage) {
        const r = await base44.integrations.Core.UploadFile({ file: caseImage });
        imageUrl = r.file_url;
      }
      const itemsWithImages = await Promise.all(items.map(async item => {
        let image = null;
        if (item.image_files?.length > 0) {
          const r = await base44.integrations.Core.UploadFile({ file: item.image_files[0] });
          image = r.file_url;
        }
        return { name:item.name, rarity:item.rarity, value:item.value, drop_rate:item.drop_rate, image, image_url:image, image_urls:image ? [image] : [] };
      }));
      await base44.entities.CaseTemplate.create({ name:caseName, description:caseDescription, price:parseInt(casePrice), category:caseCategory, image_url:imageUrl, items:itemsWithImages, is_active:true });
      addLog(`Created case: ${caseName}`);
      flash('Case created!');
      setCaseName(''); setCaseDescription(''); setCasePrice(''); setItems([]); setCaseImage(null);
    } catch { flash('Error creating case'); }
    setLoading(false);
  };

  const handleSyncLeaderboard = async () => {
    setSyncLoading(true); setSyncMessage('');
    try {
      const result = await base44.functions.syncLeaderboard();
      addLog(`Leaderboard synced — ${result.synced} entries`);
      setSyncMessage(`✅ Synced! ${result.synced} players updated.`);
      setTimeout(() => setSyncMessage(''), 5000);
    } catch { setSyncMessage('❌ Sync failed.'); }
    setSyncLoading(false);
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Access denied ── */
  if (user && user.role !== 'admin') return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', gap:16, fontFamily:'Nunito,sans-serif',
    }}>
      <Shield style={{ width:48, height:48, color:'rgba(239,68,68,.4)' }} />
      <p style={{ fontSize:17, fontWeight:800, color:'rgba(255,255,255,.5)' }}>Access Denied</p>
      <p style={{ fontSize:13, color:'rgba(255,255,255,.25)', fontWeight:600 }}>Admin panel is restricted.</p>
    </div>
  );

  const TABS = [
    { id:'users',       label:'Users',       icon:Users,   color:'#f87171' },
    { id:'cases',       label:'Cases',       icon:Box,     color:'#22d3ee' },
    { id:'leaderboard', label:'Leaderboard', icon:Trophy,  color:'#fbbf24' },
    { id:'activity',    label:'Activity',    icon:Activity,color:'#a855f7' },
  ];

  return (
    <div className="ad-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>

      <div style={{ maxWidth:960, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{
            position:'relative', overflow:'hidden', borderRadius:18,
            background:'linear-gradient(120deg,#0a0008 0%,#1a000c 40%,#280010 70%,#0a0008 100%)',
            border:'1px solid rgba(239,68,68,.18)',
            boxShadow:'0 0 0 1px rgba(239,68,68,.06), 0 28px 70px rgba(0,0,0,.85), 0 0 100px rgba(239,68,68,.07)',
            padding:'26px 28px',
          }}>
          <div className="ad-scan" />
          <div className="ad-hex" />
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse 50% 80% at 92% 50%,rgba(239,68,68,.12) 0%,transparent 60%)',
          }} />

          {/* Faint shield watermark */}
          <div style={{
            position:'absolute', right:28, top:'50%', transform:'translateY(-50%)',
            opacity:.06, pointerEvents:'none',
          }}>
            <Shield style={{ width:90, height:90, color:'#ef4444' }} />
          </div>

          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:14 }}>
            <div className="ad-shield">
              <Shield style={{ width:28, height:28, color:'#f87171' }} />
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                <div style={{ width:3, height:22, borderRadius:2, background:'linear-gradient(to bottom,#ef4444,#a855f7)' }} />
                <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', margin:0 }}>Admin Panel</h1>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:600, marginLeft:13 }}>
                Manage users, cases, leaderboard · {allUsers.length} total users
              </p>
            </div>
          </div>

          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'linear-gradient(90deg,transparent,rgba(239,68,68,.5),rgba(168,85,247,.4),transparent)',
          }} />
        </motion.div>

        {/* ── Toast ── */}
        <AnimatePresence>{message && <Toast msg={message} />}</AnimatePresence>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.1 }}
          style={{
            display:'flex', gap:4, padding:4, borderRadius:14,
            background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
            alignSelf:'flex-start', flexWrap:'wrap',
          }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="ad-tab-btn" onClick={() => setTab(t.id)} style={{
                background: active ? `${t.color}18` : 'transparent',
                border: `1px solid ${active ? `${t.color}45` : 'transparent'}`,
                color: active ? t.color : 'rgba(255,255,255,.35)',
                boxShadow: active ? `0 0 18px ${t.color}20` : 'none',
              }}>
                <t.icon style={{ width:13, height:13 }} />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {/* ══════════════════════════════════════
            TAB: USERS
        ══════════════════════════════════════ */}
        <AnimatePresence mode="wait">
        {tab === 'users' && (
          <motion.div key="users" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>

            {/* User list */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* Search */}
              <div style={{ position:'relative' }}>
                <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'rgba(255,255,255,.3)' }} />
                <input
                  className="ad-input"
                  placeholder="Search users…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft:36 }}
                />
              </div>

              {/* List */}
              <div style={{
                maxHeight:560, overflowY:'auto',
                display:'flex', flexDirection:'column', gap:6,
              }}>
                {filteredUsers.length === 0 ? (
                  <p style={{ fontSize:12, color:'rgba(255,255,255,.25)', textAlign:'center', padding:24, fontWeight:700 }}>No users found</p>
                ) : filteredUsers.map((u, i) => (
                  <motion.button
                    key={u.id}
                    initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                    onClick={() => setSelectedUser(u)}
                    className="ad-user-row"
                    style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', borderRadius:12, cursor:'pointer',
                      background: selectedUser?.id === u.id ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.03)',
                      border:`1px solid ${selectedUser?.id === u.id ? 'rgba(239,68,68,.35)' : 'rgba(255,255,255,.06)'}`,
                      textAlign:'left',
                    }}>
                    <div style={{
                      width:34, height:34, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                      background:'linear-gradient(135deg,#7c3aed,#4338ca)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:800, color:'#fff',
                      border:`2px solid ${u.is_banned ? 'rgba(239,68,68,.5)' : 'rgba(255,255,255,.1)'}`,
                    }}>
                      {u.avatar_url && u.avatar_url !== 'null'
                        ? <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : u.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.full_name}</p>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{u.email}</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                      {u.is_banned && <span style={{ fontSize:8, fontWeight:900, color:'#f87171', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', padding:'1px 5px', borderRadius:4, letterSpacing:'.1em' }}>BAN</span>}
                      <span style={{ fontSize:8, fontWeight:800, color: u.role === 'admin' ? '#f87171' : u.role === 'mod' ? '#a855f7' : 'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.1em' }}>{u.role || 'user'}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* User detail */}
            {selectedUser ? (
              <motion.div key={selectedUser.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}>
                <Card accent="red">
                  {/* Profile header */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:16, paddingBottom:18, marginBottom:18,
                    borderBottom:'1px solid rgba(255,255,255,.07)',
                  }}>
                    <div style={{
                      width:60, height:60, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                      background:'linear-gradient(135deg,#7c3aed,#4338ca)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:24, fontWeight:900, color:'#fff',
                      border:`3px solid ${selectedUser.is_banned ? 'rgba(239,68,68,.5)' : 'rgba(251,191,36,.25)'}`,
                      boxShadow:`0 0 20px ${selectedUser.is_banned ? 'rgba(239,68,68,.2)' : 'rgba(168,85,247,.2)'}`,
                    }}>
                      {selectedUser.avatar_url && selectedUser.avatar_url !== 'null'
                        ? <img src={selectedUser.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : selectedUser.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:3 }}>{selectedUser.full_name}</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8, fontWeight:600 }}>{selectedUser.email}</p>
                      <div style={{ display:'flex', gap:6 }}>
                        <span style={{
                          fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:6, letterSpacing:'.12em', textTransform:'uppercase',
                          background: selectedUser.is_banned ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.1)',
                          color: selectedUser.is_banned ? '#f87171' : '#4ade80',
                          border: `1px solid ${selectedUser.is_banned ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.25)'}`,
                        }}>{selectedUser.is_banned ? 'Banned' : 'Active'}</span>
                        <span style={{
                          fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:6, letterSpacing:'.12em', textTransform:'uppercase',
                          background: selectedUser.role === 'admin' ? 'rgba(239,68,68,.15)' : selectedUser.role === 'mod' ? 'rgba(168,85,247,.12)' : 'rgba(96,165,250,.1)',
                          color: selectedUser.role === 'admin' ? '#f87171' : selectedUser.role === 'mod' ? '#c084fc' : '#60a5fa',
                          border: `1px solid ${selectedUser.role === 'admin' ? 'rgba(239,68,68,.3)' : selectedUser.role === 'mod' ? 'rgba(168,85,247,.25)' : 'rgba(96,165,250,.2)'}`,
                        }}>{selectedUser.role || 'user'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
                    {[
                      { label:'Balance', val:`${(selectedUser.balance || 0).toLocaleString()} coins`, color:'#fbbf24' },
                      { label:'Level',   val:`Lv ${selectedUser.level || 1}`,                          color:'#a855f7' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{
                        padding:'12px 14px', borderRadius:12,
                        background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)',
                      }}>
                        <p style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:4, fontWeight:800 }}>{label}</p>
                        <p style={{ fontSize:16, fontWeight:900, color }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Balance adjust */}
                  <div style={{ marginBottom:16 }}>
                    <Label>Adjust Balance</Label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input
                        type="number" className="ad-input ad-input-gold"
                        placeholder="New balance amount"
                        value={balanceAmount}
                        onChange={e => setBalanceAmount(e.target.value)}
                        style={{ flex:1 }}
                      />
                      <motion.button
                        whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}
                        onClick={handleAdjustBalance}
                        disabled={loading || !balanceAmount}
                        style={{
                          padding:'10px 16px', borderRadius:10, border:'none', cursor:'pointer',
                          background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                          color:'#000', fontWeight:900, fontFamily:'Nunito,sans-serif', fontSize:13,
                          boxShadow:'0 0 20px rgba(251,191,36,.3)', flexShrink:0,
                          opacity: loading || !balanceAmount ? .5 : 1,
                        }}>
                        {loading ? <Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> : <DollarSign style={{ width:14, height:14 }} />}
                      </motion.button>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ marginBottom:18 }}>
                    <Label>Role</Label>
                    <div style={{ display:'flex', gap:8 }}>
                      {['user','mod','admin'].map(role => {
                        const rColor = role === 'admin' ? '#f87171' : role === 'mod' ? '#c084fc' : '#60a5fa';
                        const active = selectedUser.role === role;
                        return (
                          <motion.button
                            key={role} whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }}
                            onClick={() => handleChangeRole(role)}
                            disabled={loading}
                            style={{
                              flex:1, padding:'8px 0', borderRadius:10, border:`1px solid ${active ? `${rColor}55` : 'rgba(255,255,255,.08)'}`,
                              background: active ? `${rColor}18` : 'rgba(255,255,255,.04)',
                              color: active ? rColor : 'rgba(255,255,255,.35)',
                              fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer',
                              boxShadow: active ? `0 0 16px ${rColor}25` : 'none',
                              transition:'all .18s',
                              textTransform:'capitalize',
                            }}>{role}</motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:8 }}>
                    <motion.button
                      whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                      onClick={handleBanUser} disabled={loading}
                      style={{
                        flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer',
                        background: selectedUser.is_banned ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                        border: `1px solid ${selectedUser.is_banned ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
                        color: selectedUser.is_banned ? '#4ade80' : '#f87171',
                        fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        transition:'all .18s',
                      }}>
                      <Ban style={{ width:13, height:13 }} />
                      {selectedUser.is_banned ? 'Unban' : 'Ban User'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                      onClick={handleDeleteUser} disabled={loading}
                      style={{
                        flex:1, padding:'10px 0', borderRadius:10, cursor:'pointer',
                        background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)',
                        color:'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        transition:'all .18s',
                      }}>
                      <Trash2 style={{ width:13, height:13 }} />
                      Delete
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                style={{
                  borderRadius:16, border:'1px solid rgba(255,255,255,.06)',
                  background:'rgba(255,255,255,.02)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  minHeight:400, gap:12,
                }}>
                <Shield style={{ width:40, height:40, color:'rgba(255,255,255,.12)' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.3)' }}>Select a user to manage</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            TAB: CASES
        ══════════════════════════════════════ */}
        {tab === 'cases' && (
          <motion.div key="cases" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <Card accent="cyan">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
                <Box style={{ width:16, height:16, color:'#22d3ee' }} />
                <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Create New Case</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <Label>Case Name</Label>
                  <input className="ad-input" placeholder="e.g. Celestial Case" value={caseName} onChange={e => setCaseName(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <input className="ad-input" placeholder="Short description" value={caseDescription} onChange={e => setCaseDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Price (coins)</Label>
                  <input className="ad-input" type="number" placeholder="1000" value={casePrice} onChange={e => setCasePrice(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <select className="ad-select" value={caseCategory} onChange={e => setCaseCategory(e.target.value)}>
                    {['budget','standard','premium','legendary','event'].map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <Label>Case Image</Label>
                  <input className="ad-input" type="file" accept="image/*" onChange={e => setCaseImage(e.target.files?.[0] || null)} style={{ color:'rgba(255,255,255,.4)', fontSize:12 }} />
                </div>
              </div>

              {/* Add item */}
              <div style={{
                padding:'16px', borderRadius:12, marginBottom:14,
                background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <Plus style={{ width:14, height:14, color:'#22d3ee' }} />
                  <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>Add Item</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <Label>Name</Label>
                    <input className="ad-input" placeholder="Item name" value={itemName} onChange={e => setItemName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Rarity</Label>
                    <select className="ad-select" value={itemRarity} onChange={e => setItemRarity(e.target.value)}>
                      {['common','uncommon','rare','epic','legendary'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Value</Label>
                    <input className="ad-input" type="number" placeholder="500" value={itemValue} onChange={e => setItemValue(e.target.value)} />
                  </div>
                  <div>
                    <Label>Drop %</Label>
                    <input className="ad-input" type="number" placeholder="25" value={itemDropRate} onChange={e => setItemDropRate(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <Label>Item Image</Label>
                  <input className="ad-input" type="file" accept="image/*" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(f => setItemImages(p => [...p, f])); }} style={{ color:'rgba(255,255,255,.4)', fontSize:12 }} />
                </div>
                {itemImages.length > 0 && (
                  <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                    {itemImages.map((img, i) => (
                      <div key={i} style={{ position:'relative' }}>
                        <img src={URL.createObjectURL(img)} alt="" style={{ width:48, height:48, borderRadius:8, objectFit:'cover', border:'1px solid rgba(255,255,255,.12)' }} />
                        <button onClick={() => setItemImages(p => p.filter((_,j)=>j!==i))} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <X style={{ width:10, height:10, color:'#fff' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <motion.button
                  whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }}
                  onClick={handleAddItem}
                  disabled={!itemName || !itemValue || !itemDropRate}
                  style={{
                    width:'100%', padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer',
                    background:'rgba(34,211,238,.12)', border:'1px solid rgba(34,211,238,.3)',
                    color:'#22d3ee', fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                    opacity: (!itemName || !itemValue || !itemDropRate) ? .4 : 1, transition:'opacity .18s',
                  }}>
                  <Plus style={{ width:14, height:14 }} /> Add Item
                </motion.button>
              </div>

              {/* Items list */}
              {items.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                  {items.map((item, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                      style={{
                        display:'flex', alignItems:'center', gap:12,
                        padding:'11px 14px', borderRadius:12,
                        background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
                      }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:RARITY_COLORS[item.rarity] || '#94a3b8', flexShrink:0, boxShadow:`0 0 8px ${RARITY_COLORS[item.rarity]}` }} />
                      {item.image_files?.[0] && <img src={URL.createObjectURL(item.image_files[0])} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0 }} />}
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:2 }}>{item.name}</p>
                        <p style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700 }}>
                          <span style={{ color:RARITY_COLORS[item.rarity] }}>{item.rarity}</span> · {item.value.toLocaleString()} coins · {item.drop_rate}% drop
                        </p>
                      </div>
                      <button onClick={() => setItems(items.filter((_,j)=>j!==i))} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)', borderRadius:8, padding:'6px', cursor:'pointer', display:'flex' }}>
                        <X style={{ width:12, height:12, color:'#f87171' }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <motion.button
                whileHover={{ scale: (!caseName||!casePrice||!items.length) ? 1 : 1.02 }}
                whileTap={{ scale: (!caseName||!casePrice||!items.length) ? 1 : .97 }}
                onClick={handleCreateCase}
                disabled={loading || !caseName || !casePrice || items.length === 0}
                style={{
                  width:'100%', height:46, borderRadius:12, border:'none',
                  cursor: (!caseName||!casePrice||!items.length) ? 'not-allowed' : 'pointer',
                  background: (!caseName||!casePrice||!items.length) ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#22d3ee,#3b82f6)',
                  color: (!caseName||!casePrice||!items.length) ? 'rgba(255,255,255,.2)' : '#000',
                  fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: (!caseName||!casePrice||!items.length) ? 'none' : '0 0 30px rgba(34,211,238,.3)',
                  transition:'all .2s',
                }}>
                {loading ? <Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }} /> : <Box style={{ width:16, height:16 }} />}
                Create Case · {items.length} item{items.length !== 1 ? 's' : ''}
              </motion.button>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            TAB: LEADERBOARD
        ══════════════════════════════════════ */}
        {tab === 'leaderboard' && (
          <motion.div key="lb" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <Card accent="gold">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#fbbf24,#f97316)' }} />
                <Trophy style={{ width:16, height:16, color:'#fbbf24' }} />
                <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Sync Leaderboard</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginBottom:20, fontWeight:600, lineHeight:1.6 }}>
                Reads all user & transaction data and writes the top 10 into the public
                <code style={{ background:'rgba(251,191,36,.1)', color:'#fbbf24', padding:'1px 6px', borderRadius:4, fontSize:11, margin:'0 4px' }}>LeaderboardEntry</code>
                entity so regular users can see it.
              </p>

              <AnimatePresence>
                {syncMessage && <Toast msg={syncMessage} />}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: syncLoading ? 1 : 1.02, y: syncLoading ? 0 : -2 }}
                whileTap={{ scale: syncLoading ? 1 : .97 }}
                onClick={handleSyncLeaderboard}
                disabled={syncLoading}
                style={{
                  width:'100%', height:48, borderRadius:12, border:'none',
                  cursor: syncLoading ? 'not-allowed' : 'pointer',
                  background: syncLoading ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#fbbf24,#f59e0b,#fde68a)',
                  color: syncLoading ? 'rgba(255,255,255,.2)' : '#000',
                  fontSize:14, fontWeight:900, fontFamily:'Nunito,sans-serif',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  boxShadow: syncLoading ? 'none' : '0 0 40px rgba(251,191,36,.35)',
                  transition:'all .2s', position:'relative', overflow:'hidden',
                }}>
                {!syncLoading && (
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)', animation:'ad-shimmer 3s ease-in-out infinite' }} />
                )}
                {syncLoading
                  ? <><Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }} /> Syncing…</>
                  : <><RefreshCw style={{ width:16, height:16 }} /> Sync Leaderboard Now</>}
              </motion.button>

              <div style={{ marginTop:16, padding:'12px 16px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)' }}>
                <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', lineHeight:1.7, fontWeight:600 }}>
                  💡 Run periodically (daily or weekly) to keep the leaderboard fresh. Consider automating with a scheduled function.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            TAB: ACTIVITY
        ══════════════════════════════════════ */}
        {tab === 'activity' && (
          <motion.div key="activity" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <Card accent="purple">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#a855f7,#6366f1)' }} />
                <Activity style={{ width:15, height:15, color:'#a855f7' }} />
                <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>Activity Log</span>
                {activityLog.length > 0 && (
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(168,85,247,.15)', color:'#c084fc', border:'1px solid rgba(168,85,247,.3)' }}>
                    {activityLog.length}
                  </span>
                )}
              </div>

              {activityLog.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <Activity style={{ width:36, height:36, color:'rgba(255,255,255,.1)' }} />
                  <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.25)' }}>No activity yet</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,.15)', fontWeight:600 }}>Actions will appear here as you use the panel</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {activityLog.map((log, i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'10px 14px', borderRadius:11,
                        background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7', flexShrink:0 }} />
                        <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.75)' }}>{log.action}</p>
                      </div>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,.28)', fontWeight:700, flexShrink:0 }}>{log.timestamp}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  );
}