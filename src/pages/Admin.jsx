import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, DollarSign, Ban, Trash2, Activity,
  AlertCircle, CheckCircle2, Loader2, Box, Plus, X,
  Trophy, RefreshCw, Users, Crown, Zap, ChevronRight, Pencil,
  Package, Gamepad2, Sword, Gem
} from 'lucide-react';

/* ─── CSS ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');

.ad-root { font-family: 'Nunito', sans-serif; }

@keyframes ad-scan {
  0%  { top:-1px; opacity:0; }
  5%  { opacity:.5; }
  95% { opacity:.5; }
  100%{ top:100%; opacity:0; }
}
.ad-scan {
  position:absolute; left:0; right:0; height:1px; z-index:2;
  background:linear-gradient(90deg,transparent,rgba(239,68,68,.3),transparent);
  animation:ad-scan 7s linear infinite; pointer-events:none;
}

@keyframes ad-grid-pulse { 0%,100% { opacity:.022; } 50% { opacity:.05; } }
.ad-hex {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(239,68,68,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(239,68,68,.07) 1px, transparent 1px);
  background-size:32px 32px;
  animation:ad-grid-pulse 5s ease-in-out infinite;
}

@keyframes ad-shimmer {
  0%  { transform:translateX(-120%) skewX(-15deg); }
  100%{ transform:translateX(350%)  skewX(-15deg); }
}
.ad-shim { position:relative; overflow:hidden; }
.ad-shim::after {
  content:''; position:absolute; top:0; left:0; width:25%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,60,60,.035),transparent);
  animation:ad-shimmer 7s ease-in-out infinite; pointer-events:none; border-radius:inherit;
}

@keyframes shield-pulse {
  0%,100% { filter:drop-shadow(0 0 7px rgba(239,68,68,.55)); }
  50%     { filter:drop-shadow(0 0 20px rgba(239,68,68,.95)); }
}
.ad-shield { animation:shield-pulse 2.5s ease-in-out infinite; }

@keyframes orb-float {
  0%,100% { transform:translate(0,0) scale(1); }
  50%     { transform:translate(12px,-18px) scale(1.06); }
}
.ad-orb { animation:orb-float 10s ease-in-out infinite; }

.ad-tab-btn {
  display:flex; align-items:center; gap:7px;
  padding:9px 20px; border-radius:10px; border:none; cursor:pointer;
  font-family:'Nunito',sans-serif; font-size:12px; font-weight:800;
  transition:all .18s; white-space:nowrap; letter-spacing:.02em;
}

.ad-input {
  width:100%; padding:10px 14px; border-radius:10px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04); color:#fff;
  font-size:13px; font-weight:700; font-family:'Nunito',sans-serif;
  transition:border-color .2s, box-shadow .2s, background .2s;
  box-sizing:border-box;
}
.ad-input::placeholder { color:rgba(255,255,255,.22); }
.ad-input:focus {
  outline:none;
  border-color:rgba(239,68,68,.5);
  box-shadow:0 0 0 3px rgba(239,68,68,.09);
  background:rgba(255,255,255,.06);
}
.ad-input-cyan:focus {
  border-color:rgba(34,211,238,.5) !important;
  box-shadow:0 0 0 3px rgba(34,211,238,.09) !important;
}
.ad-input-gold:focus {
  border-color:rgba(251,191,36,.5) !important;
  box-shadow:0 0 0 3px rgba(251,191,36,.09) !important;
}

.ad-select {
  appearance:none; cursor:pointer;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  color:rgba(255,255,255,.75);
  font-family:'Nunito',sans-serif; font-weight:700; font-size:13px;
  padding:10px 14px; border-radius:10px; outline:none; width:100%;
  transition:border-color .2s, background .2s;
}
.ad-select:focus {
  border-color:rgba(34,211,238,.45);
  background:rgba(255,255,255,.06);
}
.ad-select option { background:#090014; }

.ad-user-row { transition:border-color .2s, background .2s, transform .15s; }
.ad-user-row:hover { border-color:rgba(239,68,68,.28) !important; background:rgba(239,68,68,.05) !important; transform:translateX(2px); }

.ad-case-card { transition:border-color .2s, background .2s, transform .2s, box-shadow .2s; }
.ad-case-card:hover { border-color:rgba(34,211,238,.28) !important; transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.6) !important; }

.ad-action-btn { transition:all .18s; }
.ad-action-btn:hover { transform:translateY(-1px); }

::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#200010; border-radius:4px; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .9s linear infinite; display:inline-block; }

@keyframes fadeInUp {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.fade-up { animation: fadeInUp .3s ease forwards; }

.stat-card {
  transition: border-color .2s, transform .2s, box-shadow .2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,.7);
}
`;

/* ─── Category config ───────────────────────────────────────────── */
const CASE_CATEGORIES = [
  { value:'real_life', label:'Real Life',  emoji:'💎', color:'#38bdf8', bg:'rgba(56,189,248,.15)',  border:'rgba(56,189,248,.35)' },
  { value:'roblox',    label:'Roblox',     emoji:'🟥', color:'#ef4444', bg:'rgba(239,68,68,.15)',   border:'rgba(239,68,68,.35)'  },
  { value:'csgo',      label:'CS:GO',      emoji:'🔫', color:'#fb923c', bg:'rgba(251,146,60,.15)',  border:'rgba(251,146,60,.35)' },
];

const RARITY_COLORS = {
  common:'#94a3b8', uncommon:'#4ade80', rare:'#60a5fa', epic:'#a855f7', legendary:'#fbbf24',
};

/* ─── Tiny helpers ──────────────────────────────────────────────── */
function Label({ children, color }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, color: color || 'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.16em', marginBottom:6 }}>
      {children}
    </p>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="ad-shim stat-card" style={{
      borderRadius:14, padding:'16px 18px',
      background:'linear-gradient(145deg,#0a0010,#110018)',
      border:`1px solid ${color}22`,
      display:'flex', alignItems:'center', gap:14,
    }}>
      <div style={{
        width:42, height:42, borderRadius:11, flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}35`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 0 16px ${color}20`,
      }}>
        <Icon style={{ width:18, height:18, color }} />
      </div>
      <div>
        <p style={{ fontSize:20, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:3, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.02em' }}>{value}</p>
        <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.35)', letterSpacing:'.08em', textTransform:'uppercase' }}>{label}</p>
        {sub && <p style={{ fontSize:9, fontWeight:600, color:`${color}99`, marginTop:2 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  const isErr = msg.toLowerCase().includes('error') || msg.startsWith('❌');
  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8 }}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'11px 16px', borderRadius:12, marginBottom:14,
        background: isErr ? 'rgba(239,68,68,.09)' : 'rgba(34,197,94,.08)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,.28)' : 'rgba(34,197,94,.25)'}`,
        boxShadow: `0 4px 20px ${isErr ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.1)'}`,
      }}>
      {isErr
        ? <AlertCircle style={{ width:15, height:15, color:'#f87171', flexShrink:0 }} />
        : <CheckCircle2 style={{ width:15, height:15, color:'#4ade80', flexShrink:0 }} />}
      <span style={{ fontSize:13, fontWeight:700, color: isErr ? '#f87171' : '#4ade80' }}>{msg}</span>
    </motion.div>
  );
}

function Card({ children, accent = 'red', style = {} }) {
  const borders = { red:'rgba(239,68,68,.13)', gold:'rgba(251,191,36,.13)', cyan:'rgba(6,182,212,.13)', purple:'rgba(168,85,247,.13)' };
  const glows =   { red:'rgba(239,68,68,.04)', gold:'rgba(251,191,36,.04)', cyan:'rgba(6,182,212,.04)', purple:'rgba(168,85,247,.04)' };
  return (
    <div className="ad-shim" style={{
      position:'relative', overflow:'hidden', borderRadius:16,
      background:`linear-gradient(145deg,#080010,#0f0018,#050008)`,
      border:`1px solid ${borders[accent]}`,
      boxShadow:`0 0 60px ${glows[accent]}`,
      padding:'20px',
      ...style,
    }}>
      <div className="ad-scan" />
      {children}
    </div>
  );
}

/* ─── Image Picker ─────────────────────────────────────────────── */
function ImagePicker({ value, onChange, label = 'Image' }) {
  const [mode, setMode] = useState('url');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange(res.file_url);
    } catch {
      onChange(URL.createObjectURL(file));
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
        <Label>{label}</Label>
        <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,.04)', borderRadius:7, padding:3 }}>
          {['url','file'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding:'3px 10px', borderRadius:5, border:'none', cursor:'pointer',
              fontSize:10, fontWeight:800, fontFamily:'Nunito,sans-serif',
              background: mode===m ? 'rgba(34,211,238,.22)' : 'transparent',
              color: mode===m ? '#22d3ee' : 'rgba(255,255,255,.28)',
              transition:'all .15s',
            }}>{m.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {mode === 'url' ? (
        <input className="ad-input ad-input-cyan" placeholder="https://…" value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input className="ad-input ad-input-cyan" type="file" accept="image/*" onChange={handleFile} style={{ color:'rgba(255,255,255,.4)', fontSize:12 }} />
          {uploading && <Loader2 style={{ width:16, height:16, color:'#22d3ee', flexShrink:0 }} className="spin" />}
        </div>
      )}

      {value && (
        <div style={{ marginTop:9, display:'flex', alignItems:'center', gap:10 }}>
          <img src={value} alt="" onError={e => e.target.style.display='none'}
            style={{ width:54, height:54, borderRadius:9, objectFit:'cover', border:'1px solid rgba(255,255,255,.14)' }} />
          <button onClick={() => onChange('')} style={{
            background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)',
            borderRadius:8, padding:'5px 12px', cursor:'pointer',
            color:'#f87171', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif',
          }}>Remove</button>
        </div>
      )}
    </div>
  );
}

/* ─── Item Editor ───────────────────────────────────────────────── */
function ItemEditor({ item, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const rc = RARITY_COLORS[item.rarity] || '#94a3b8';
  return (
    <div style={{ borderRadius:12, background:'rgba(255,255,255,.025)', border:`1px solid ${rc}28`, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:rc, boxShadow:`0 0 8px ${rc}`, flexShrink:0 }} />
        {item.image_url && (
          <img src={item.image_url} alt="" onError={e=>e.target.style.display='none'}
            style={{ width:34, height:34, borderRadius:7, objectFit:'cover', border:`1px solid ${rc}44`, flexShrink:0 }} />
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:1 }}>{item.name || 'Unnamed item'}</p>
          <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)' }}>
            <span style={{ color:rc }}>{item.rarity}</span>{' · '}{(item.value||0).toLocaleString()} coins{' · '}{item.drop_rate||0}% drop
          </p>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700 }}>{open ? '▲' : '▼'}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.22)', borderRadius:7, padding:'4px 9px', cursor:'pointer', color:'#f87171', fontSize:11, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>✕</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ overflow:'hidden', borderTop:`1px solid rgba(255,255,255,.05)` }}>
            <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10 }}>
                <div><Label>Name</Label>
                  <input className="ad-input ad-input-cyan" value={item.name} onChange={e => onChange({ ...item, name:e.target.value })} /></div>
                <div><Label>Rarity</Label>
                  <select className="ad-select" value={item.rarity} onChange={e => onChange({ ...item, rarity:e.target.value })}>
                    {['common','uncommon','rare','epic','legendary'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select></div>
                <div><Label>Value (coins)</Label>
                  <input className="ad-input ad-input-cyan" type="number" value={item.value} onChange={e => onChange({ ...item, value:parseInt(e.target.value)||0 })} /></div>
                <div><Label>Drop Rate %</Label>
                  <input className="ad-input ad-input-cyan" type="number" value={item.drop_rate} onChange={e => onChange({ ...item, drop_rate:parseFloat(e.target.value)||0 })} /></div>
              </div>
              <ImagePicker label="Item Image" value={item.image_url} onChange={v => onChange({ ...item, image_url:v, image_urls:[v].filter(Boolean) })} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Case Editor Modal ─────────────────────────────────────────── */
function CaseEditorModal({ caseData, isNew, onSave, onClose }) {
  const blank = { name:'', description:'', price:500, category:'real_life', image_url:'', is_active:true, items:[] };
  const [draft, setDraft] = useState(caseData ? JSON.parse(JSON.stringify(caseData)) : blank);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ni, setNi] = useState({ name:'', rarity:'common', value:100, drop_rate:20, image_url:'' });
  const [addingItem, setAddingItem] = useState(false);

  const totalDrop = draft.items.reduce((s, i) => s + (parseFloat(i.drop_rate) || 0), 0);
  const dropOk = Math.abs(totalDrop - 100) < 0.5;

  const activeCat = CASE_CATEGORIES.find(c => c.value === draft.category) || CASE_CATEGORIES[0];

  const addItem = () => {
    if (!ni.name) return;
    setDraft(d => ({ ...d, items: [...d.items, { ...ni, image_urls: ni.image_url ? [ni.image_url] : [] }] }));
    setNi({ name:'', rarity:'common', value:100, drop_rate:20, image_url:'' });
    setAddingItem(false);
  };

  const updateItem = (idx, updated) => setDraft(d => {
    const items = [...d.items]; items[idx] = updated; return { ...d, items };
  });

  const deleteItem = idx => setDraft(d => ({ ...d, items: d.items.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!draft.name || !draft.price) { setMsg('❌ Name and price are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        price: parseInt(draft.price),
        category: draft.category,
        image_url: draft.image_url || null,
        is_active: draft.is_active,
        items: draft.items.map(item => ({
          name: item.name,
          rarity: item.rarity,
          value: item.value,
          drop_rate: item.drop_rate,
          image_url: item.image_url || null,
          image_urls: item.image_url ? [item.image_url] : [],
        })),
      };
      if (isNew) {
        await base44.entities.CaseTemplate.create(payload);
      } else {
        await base44.entities.CaseTemplate.update(caseData.id, payload);
      }
      onSave();
    } catch {
      setMsg('❌ Error saving case');
      setSaving(false);
    }
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.82)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'24px 16px' }}>
      <motion.div
        initial={{ opacity:0, scale:.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ width:'100%', maxWidth:760, background:'linear-gradient(145deg,#07000e,#120020,#050008)', border:'1px solid rgba(34,211,238,.2)', borderRadius:22, overflow:'hidden', boxShadow:'0 50px 140px rgba(0,0,0,.95)' }}>

        {/* Modal header */}
        <div style={{
          padding:'20px 26px', display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom:'1px solid rgba(255,255,255,.06)',
          background:'linear-gradient(90deg,rgba(34,211,238,.07),transparent)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(34,211,238,.12)', border:'1px solid rgba(34,211,238,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Box style={{ width:16, height:16, color:'#22d3ee' }} />
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.04em' }}>{isNew ? 'CREATE NEW CASE' : 'EDIT CASE'}</h2>
              <p style={{ margin:0, fontSize:10, color:'rgba(34,211,238,.5)', fontWeight:700, letterSpacing:'.08em' }}>
                {isNew ? 'Fill in the details below' : `Editing: ${draft.name}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, padding:'8px 14px', cursor:'pointer', color:'rgba(255,255,255,.4)', fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:800, transition:'all .15s' }}>✕ Close</button>
        </div>

        <div style={{ padding:26, display:'flex', flexDirection:'column', gap:22 }}>
          <AnimatePresence>{msg && <Toast msg={msg} />}</AnimatePresence>

          {/* Case core fields */}
          <div>
            <p style={{ fontSize:11, fontWeight:900, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-block', width:18, height:1, background:'rgba(255,255,255,.15)' }} />
              Case Details
              <span style={{ display:'inline-block', flex:1, height:1, background:'rgba(255,255,255,.06)' }} />
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><Label>Case Name</Label>
                <input className="ad-input ad-input-cyan" placeholder="e.g. Celestial Case" value={draft.name} onChange={e => setDraft(d=>({...d,name:e.target.value}))} /></div>
              <div><Label>Description</Label>
                <input className="ad-input ad-input-cyan" placeholder="Short description" value={draft.description} onChange={e => setDraft(d=>({...d,description:e.target.value}))} /></div>
              <div><Label>Price (coins)</Label>
                <input className="ad-input ad-input-cyan" type="number" value={draft.price} onChange={e => setDraft(d=>({...d,price:e.target.value}))} /></div>

              {/* STATUS */}
              <div>
                <Label>Status</Label>
                <div style={{ display:'flex', gap:8 }}>
                  {[true,false].map(v => (
                    <button key={String(v)} onClick={() => setDraft(d=>({...d,is_active:v}))} style={{
                      flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                      border:`1px solid ${draft.is_active===v ? (v?'rgba(34,197,94,.45)':'rgba(239,68,68,.45)') : 'rgba(255,255,255,.07)'}`,
                      background: draft.is_active===v ? (v?'rgba(34,197,94,.14)':'rgba(239,68,68,.14)') : 'rgba(255,255,255,.03)',
                      color: draft.is_active===v ? (v?'#4ade80':'#f87171') : 'rgba(255,255,255,.25)',
                      fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', transition:'all .18s',
                      boxShadow: draft.is_active===v ? (v?'0 0 14px rgba(34,197,94,.15)':'0 0 14px rgba(239,68,68,.15)') : 'none',
                    }}>{v ? '● Active' : '○ Inactive'}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORY SELECTOR */}
          <div>
            <p style={{ fontSize:11, fontWeight:900, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-block', width:18, height:1, background:'rgba(255,255,255,.15)' }} />
              Case Category
              <span style={{ display:'inline-block', flex:1, height:1, background:'rgba(255,255,255,.06)' }} />
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {CASE_CATEGORIES.map(cat => {
                const isActive = draft.category === cat.value;
                return (
                  <button key={cat.value} onClick={() => setDraft(d=>({...d,category:cat.value}))}
                    style={{
                      padding:'14px 10px', borderRadius:12, cursor:'pointer',
                      border:`1px solid ${isActive ? cat.border : 'rgba(255,255,255,.07)'}`,
                      background: isActive ? cat.bg : 'rgba(255,255,255,.03)',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:7,
                      transition:'all .18s',
                      boxShadow: isActive ? `0 0 20px ${cat.bg}, inset 0 0 12px ${cat.bg}` : 'none',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                    }}>
                    <span style={{ fontSize:24 }}>{cat.emoji}</span>
                    <span style={{ fontSize:12, fontWeight:900, color: isActive ? cat.color : 'rgba(255,255,255,.3)', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.05em' }}>{cat.label.toUpperCase()}</span>
                    {isActive && (
                      <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:4, background:`${cat.color}22`, color:cat.color, border:`1px solid ${cat.color}44` }}>SELECTED</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* IMAGE */}
          <div>
            <p style={{ fontSize:11, fontWeight:900, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-block', width:18, height:1, background:'rgba(255,255,255,.15)' }} />
              Case Image
              <span style={{ display:'inline-block', flex:1, height:1, background:'rgba(255,255,255,.06)' }} />
            </p>
            <ImagePicker label="" value={draft.image_url} onChange={v => setDraft(d=>({...d,image_url:v}))} />
          </div>

          {/* ITEMS */}
          <div>
            <p style={{ fontSize:11, fontWeight:900, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-block', width:18, height:1, background:'rgba(255,255,255,.15)' }} />
              Items
              <span style={{ display:'inline-block', flex:1, height:1, background:'rgba(255,255,255,.06)' }} />
            </p>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, fontWeight:800, padding:'3px 9px', borderRadius:20, background:'rgba(34,211,238,.1)', color:'#22d3ee', border:'1px solid rgba(34,211,238,.22)' }}>{draft.items.length} items</span>
                <span style={{ fontSize:11, fontWeight:700, color: dropOk ? '#4ade80' : '#f87171', display:'flex', alignItems:'center', gap:4 }}>
                  {dropOk ? <CheckCircle2 style={{ width:12, height:12 }} /> : <AlertCircle style={{ width:12, height:12 }} />}
                  {totalDrop.toFixed(1)}% total
                </span>
              </div>
              <button onClick={() => setAddingItem(a => !a)} style={{
                padding:'8px 16px', borderRadius:10,
                border:`1px solid ${addingItem ? 'rgba(239,68,68,.35)' : 'rgba(34,211,238,.3)'}`,
                background: addingItem ? 'rgba(239,68,68,.1)' : 'rgba(34,211,238,.09)',
                color: addingItem ? '#f87171' : '#22d3ee',
                fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, transition:'all .18s',
              }}>
                {addingItem ? <><X style={{ width:12, height:12 }} /> Cancel</> : <><Plus style={{ width:12, height:12 }} /> Add Item</>}
              </button>
            </div>

            <AnimatePresence>
              {addingItem && (
                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden', marginBottom:12 }}>
                  <div style={{ padding:16, borderRadius:12, background:'rgba(34,211,238,.04)', border:'1px solid rgba(34,211,238,.18)', display:'flex', flexDirection:'column', gap:12 }}>
                    <p style={{ fontSize:12, fontWeight:800, color:'#22d3ee', margin:0 }}>→ New Item</p>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10 }}>
                      <div><Label>Name</Label>
                        <input className="ad-input ad-input-cyan" placeholder="Item name" value={ni.name} onChange={e => setNi(n=>({...n,name:e.target.value}))} /></div>
                      <div><Label>Rarity</Label>
                        <select className="ad-select" value={ni.rarity} onChange={e => setNi(n=>({...n,rarity:e.target.value}))}>
                          {['common','uncommon','rare','epic','legendary'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                        </select></div>
                      <div><Label>Value</Label>
                        <input className="ad-input ad-input-cyan" type="number" value={ni.value} onChange={e => setNi(n=>({...n,value:parseInt(e.target.value)||0}))} /></div>
                      <div><Label>Drop %</Label>
                        <input className="ad-input ad-input-cyan" type="number" value={ni.drop_rate} onChange={e => setNi(n=>({...n,drop_rate:parseFloat(e.target.value)||0}))} /></div>
                    </div>
                    <ImagePicker label="Item Image" value={ni.image_url} onChange={v => setNi(n=>({...n,image_url:v}))} />
                    <div style={{ display:'flex', gap:8 }}>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={addItem} disabled={!ni.name}
                        style={{ flex:1, padding:'11px', borderRadius:10, border:'none', cursor:ni.name?'pointer':'not-allowed', background:ni.name?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,.05)', color:ni.name?'#000':'rgba(255,255,255,.2)', fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif', transition:'all .18s' }}>
                        ✓ Add Item
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto', paddingRight:2 }}>
              {draft.items.length === 0 && !addingItem && (
                <div style={{ padding:'36px', textAlign:'center', borderRadius:12, border:'1px dashed rgba(255,255,255,.06)' }}>
                  <Package style={{ width:28, height:28, color:'rgba(255,255,255,.1)', margin:'0 auto 10px' }} />
                  <p style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.2)' }}>No items yet — click Add Item above</p>
                </div>
              )}
              {draft.items.map((item, idx) => (
                <ItemEditor key={idx} item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
              ))}
            </div>
          </div>

          {/* SAVE */}
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.015, y: saving ? 0 : -2 }}
            whileTap={{ scale: saving ? 1 : .98 }}
            onClick={handleSave} disabled={saving}
            style={{
              width:'100%', height:52, borderRadius:13, border:'none', cursor:saving?'not-allowed':'pointer',
              background: saving ? 'rgba(255,255,255,.05)' : 'linear-gradient(135deg,#22d3ee 0%,#3b82f6 100%)',
              color: saving ? 'rgba(255,255,255,.2)' : '#000',
              fontSize:15, fontWeight:900, fontFamily:'Nunito,sans-serif',
              display:'flex', alignItems:'center', justifyContent:'center', gap:9,
              boxShadow: saving ? 'none' : '0 0 40px rgba(34,211,238,.3), 0 8px 24px rgba(0,0,0,.5)',
              transition:'all .2s',
            }}>
            {saving
              ? <><Loader2 style={{ width:18, height:18 }} className="spin" /> Saving…</>
              : <>{isNew ? '🚀 Create Case' : '💾 Save Changes'}</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Cases Tab ─────────────────────────────────────────────────── */
function CasesTab({ onLog }) {
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);
  const [isNew, setIsNew]       = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage]   = useState('');
  const [filter, setFilter]     = useState('all');

  const flash = msg => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CaseTemplate.list('', 100);
      setCases(data);
    } catch { flash('❌ Failed to load cases'); }
    setLoading(false);
  };

  useEffect(() => { loadCases(); }, []);

  const openNew  = () => { setIsNew(true);  setEditing({});  };
  const openEdit = c  => { setIsNew(false); setEditing(c);   };

  const handleSaved = () => {
    setEditing(null);
    onLog(isNew ? 'Created new case' : `Edited case: ${editing?.name}`);
    flash(isNew ? '✅ Case created!' : '✅ Case saved!');
    loadCases();
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setDeleting(c.id);
    try {
      await base44.entities.CaseTemplate.delete(c.id);
      onLog(`Deleted case: ${c.name}`);
      flash('✅ Case deleted');
      setCases(prev => prev.filter(x => x.id !== c.id));
    } catch { flash('❌ Error deleting case'); }
    setDeleting(null);
  };

  const displayed = filter === 'all' ? cases : cases.filter(c => (c.category || 'real_life') === filter);

  const catCountsMap = {
    all: cases.length,
    real_life: cases.filter(c => (c.category||'real_life') === 'real_life').length,
    roblox:    cases.filter(c => c.category === 'roblox').length,
    csgo:      cases.filter(c => c.category === 'csgo').length,
  };

  return (
    <motion.div key="cases" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <AnimatePresence>{message && <Toast msg={message} />}</AnimatePresence>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:22, borderRadius:2, background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
          <Box style={{ width:15, height:15, color:'#22d3ee' }} />
          <span style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.04em' }}>CASES</span>
          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(34,211,238,.1)', color:'#22d3ee', border:'1px solid rgba(34,211,238,.22)' }}>{cases.length}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={loadCases}
            style={{ padding:'9px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.45)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>
            <RefreshCw style={{ width:13, height:13 }} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={openNew}
            style={{ padding:'9px 18px', borderRadius:10, border:'1px solid rgba(34,211,238,.35)', background:'rgba(34,211,238,.1)', color:'#22d3ee', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', boxShadow:'0 0 18px rgba(34,211,238,.14)' }}>
            <Plus style={{ width:13, height:13 }} /> New Case
          </motion.button>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
        {[{ value:'all', label:'All Cases', emoji:'🗂️', color:'rgba(255,255,255,.6)', bg:'rgba(255,255,255,.08)', border:'rgba(255,255,255,.2)' }, ...CASE_CATEGORIES].map(cat => {
          const isActive = filter === cat.value;
          return (
            <button key={cat.value} onClick={() => setFilter(cat.value)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
              borderRadius:9, border:`1px solid ${isActive ? cat.border : 'rgba(255,255,255,.07)'}`,
              background: isActive ? cat.bg : 'rgba(255,255,255,.025)',
              color: isActive ? cat.color : 'rgba(255,255,255,.3)',
              fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer',
              boxShadow: isActive ? `0 0 14px ${cat.bg}` : 'none',
              transition:'all .18s',
            }}>
              <span style={{ fontSize:13 }}>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span style={{ padding:'1px 5px', borderRadius:4, fontSize:9, fontWeight:900, background:'rgba(0,0,0,.3)', color:'inherit', opacity:.8 }}>{catCountsMap[cat.value]}</span>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}>
          <Loader2 style={{ width:30, height:30, color:'rgba(34,211,238,.4)' }} className="spin" />
        </div>
      )}

      {/* Case grid */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {displayed.length === 0 && (
            <div style={{ gridColumn:'1/-1', padding:'60px', textAlign:'center', borderRadius:16, border:'1px dashed rgba(255,255,255,.06)', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <Box style={{ width:36, height:36, color:'rgba(255,255,255,.1)' }} />
              <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.22)' }}>No cases found</p>
            </div>
          )}
          {displayed.map((c, i) => {
            const catCfg = CASE_CATEGORIES.find(x => x.value === (c.category || 'real_life')) || CASE_CATEGORIES[0];
            return (
              <motion.div key={c.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
                className="ad-case-card ad-shim"
                style={{ borderRadius:16, background:'linear-gradient(145deg,#080010,#100018)', border:'1px solid rgba(34,211,238,.09)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>

                {/* Case header */}
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {c.image_url
                    ? <img src={c.image_url} alt="" onError={e=>e.target.style.display='none'}
                        style={{ width:58, height:58, borderRadius:11, objectFit:'cover', border:'1px solid rgba(255,255,255,.12)', flexShrink:0 }} />
                    : <div style={{ width:58, height:58, borderRadius:11, background:'rgba(34,211,238,.07)', border:'1px solid rgba(34,211,238,.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Box style={{ width:22, height:22, color:'rgba(34,211,238,.35)' }} />
                      </div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:900, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                    {c.description && <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:600, marginBottom:7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</p>}
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:'rgba(251,191,36,.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,.22)' }}>{(c.price||0).toLocaleString()} coins</span>
                      <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:catCfg.bg, color:catCfg.color, border:`1px solid ${catCfg.border}` }}>
                        {catCfg.emoji} {catCfg.label}
                      </span>
                      <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:c.is_active?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:c.is_active?'#4ade80':'#f87171', border:`1px solid ${c.is_active?'rgba(34,197,94,.22)':'rgba(239,68,68,.22)'}` }}>{c.is_active?'Active':'Inactive'}</span>
                    </div>
                  </div>
                </div>

                {/* Items preview */}
                {c.items?.length > 0 && (
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.2)', marginBottom:7 }}>{c.items.length} item{c.items.length!==1?'s':''}</p>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {c.items.slice(0,7).map((item, j) => (
                        <div key={j} title={`${item.name} (${item.rarity}) — ${item.drop_rate}% drop`}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} onError={e=>e.target.style.display='none'}
                                style={{ width:32, height:32, borderRadius:7, objectFit:'cover', border:`1.5px solid ${RARITY_COLORS[item.rarity]||'rgba(255,255,255,.12)'}` }} />
                            : <div style={{ width:32, height:32, borderRadius:7, background:`${RARITY_COLORS[item.rarity]||'#94a3b8'}22`, border:`1.5px solid ${RARITY_COLORS[item.rarity]||'#94a3b8'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>◆</div>
                          }
                        </div>
                      ))}
                      {c.items.length > 7 && (
                        <div style={{ width:32, height:32, borderRadius:7, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'rgba(255,255,255,.35)' }}>+{c.items.length-7}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }} onClick={() => openEdit(c)}
                    style={{ flex:1, padding:'9px', borderRadius:10, border:'1px solid rgba(34,211,238,.28)', background:'rgba(34,211,238,.07)', color:'#22d3ee', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Pencil style={{ width:12, height:12 }} /> Edit
                  </motion.button>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }} onClick={() => handleDelete(c)} disabled={deleting===c.id}
                    style={{ padding:'9px 14px', borderRadius:10, border:'1px solid rgba(239,68,68,.22)', background:'rgba(239,68,68,.07)', color:'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    {deleting===c.id ? <Loader2 style={{ width:13, height:13 }} className="spin" /> : <Trash2 style={{ width:13, height:13 }} />}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <CaseEditorModal caseData={isNew ? null : editing} isNew={isNew} onSave={handleSaved} onClose={() => setEditing(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Admin ─────────────────────────────────────────────────── */
export default function Admin() {
  useRequireAuth();
  const [user, setUser]                   = useState(null);
  const [allUsers, setAllUsers]           = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedUser, setSelectedUser]   = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [activityLog, setActivityLog]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState('');
  const [tab, setTab]                     = useState('users');

  useEffect(() => { checkAdminAccess(); }, []);

  const checkAdminAccess = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u?.role === 'admin') loadAllUsers();
  };

  const loadAllUsers = async () => {
    try {
      const result = await base44.functions.invoke('syncAdminUsers', {});
      setAllUsers(result?.data?.users || result?.users || []);
    } catch { flash('Failed to load users'); }
  };

  const flash   = msg    => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };
  const addLog  = action => setActivityLog(prev => [{ timestamp: new Date().toLocaleTimeString(), action }, ...prev.slice(0, 19)]);

  const handleAdjustBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    setLoading(true);
    try {
      const nb = Math.max(0, parseInt(balanceAmount));
      await base44.entities.User.update(selectedUser.id, { balance: nb });
      setSelectedUser({ ...selectedUser, balance: nb });
      addLog(`Balance → ${selectedUser.full_name}: ${nb.toLocaleString()}`);
      flash('✅ Balance updated');
      setBalanceAmount('');
    } catch { flash('❌ Error updating balance'); }
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
      flash(ns ? '✅ User banned' : '✅ User unbanned');
    } catch { flash('❌ Error updating ban status'); }
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
      flash('✅ User deleted');
    } catch { flash('❌ Error deleting user'); }
    setLoading(false);
  };

  const handleChangeRole = async (role) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await base44.entities.User.update(selectedUser.id, { role });
      setSelectedUser({ ...selectedUser, role });
      addLog(`Role → ${selectedUser.full_name}: ${role}`);
      flash(`✅ Role changed to ${role}`);
      loadAllUsers();
    } catch { flash('❌ Error changing role'); }
    setLoading(false);
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user && user.role !== 'admin') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, fontFamily:'Nunito,sans-serif' }}>
      <Shield style={{ width:52, height:52, color:'rgba(239,68,68,.35)' }} />
      <p style={{ fontSize:17, fontWeight:800, color:'rgba(255,255,255,.4)' }}>Access Denied</p>
      <p style={{ fontSize:12, color:'rgba(255,255,255,.2)', fontWeight:600 }}>Admin credentials required</p>
    </div>
  );

  const TABS = [
    { id:'users',    label:'Users',    icon:Users,    color:'#f87171' },
    { id:'cases',    label:'Cases',    icon:Box,      color:'#22d3ee' },
    { id:'activity', label:'Activity', icon:Activity, color:'#a855f7' },
  ];

  const adminStats = [
    { icon:Users,    label:'Total Users',   value: allUsers.length,                                            color:'#f87171', sub:`${allUsers.filter(u=>u.is_banned).length} banned` },
    { icon:Shield,   label:'Admins',        value: allUsers.filter(u=>u.role==='admin').length,                color:'#ef4444', sub:'Full access' },
    { icon:Crown,    label:'Mods',          value: allUsers.filter(u=>u.role==='mod').length,                  color:'#a855f7', sub:'Moderation' },
    { icon:Activity, label:'Actions Today', value: activityLog.length,                                         color:'#22d3ee', sub:'In this session' },
  ];

  return (
    <div className="ad-root" style={{ background:'#040009', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', flexDirection:'column', gap:18, padding:'0 4px' }}>

        {/* ── Hero Header ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ position:'relative', overflow:'hidden', borderRadius:20,
            background:'linear-gradient(120deg,#080006 0%,#18000c 40%,#260010 70%,#080006 100%)',
            border:'1px solid rgba(239,68,68,.16)', boxShadow:'0 32px 80px rgba(0,0,0,.9)', padding:'28px 30px' }}>
          <div className="ad-scan" />
          <div className="ad-hex" />

          {/* Floating orb */}
          <div className="ad-orb" style={{ position:'absolute', right:40, top:'50%', transform:'translateY(-50%)', opacity:.08 }}>
            <Shield style={{ width:100, height:100, color:'#ef4444' }} />
          </div>
          <div style={{ position:'absolute', right:160, top:10, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,.15),transparent 70%)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,rgba(239,68,68,.25),rgba(168,85,247,.2))', border:'1px solid rgba(239,68,68,.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(239,68,68,.2)' }}>
                <Shield className="ad-shield" style={{ width:24, height:24, color:'#f87171' }} />
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <h1 style={{ fontSize:28, fontWeight:700, color:'#fff', margin:0, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.06em' }}>ADMIN PANEL</h1>
                  <span style={{ fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:5, background:'rgba(239,68,68,.2)', color:'#f87171', border:'1px solid rgba(239,68,68,.35)', letterSpacing:'.1em' }}>RESTRICTED</span>
                </div>
                <p style={{ fontSize:12, color:'rgba(255,255,255,.28)', fontWeight:600, margin:0, letterSpacing:'.04em' }}>
                  Manage users · cases · leaderboard · {allUsers.length} users registered
                </p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e' }} />
                <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700, letterSpacing:'.1em' }}>LIVE</span>
              </div>
              {user?.full_name && <span style={{ fontSize:11, color:'rgba(239,68,68,.6)', fontWeight:800 }}>{user.full_name}</span>}
            </div>
          </div>

          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(239,68,68,.6),rgba(168,85,247,.5),transparent)' }} />
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}
          style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {adminStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 + i*.05 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>{message && <Toast msg={message} />}</AnimatePresence>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.14 }}
          style={{ display:'flex', gap:4, padding:5, borderRadius:14, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', alignSelf:'flex-start' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="ad-tab-btn" onClick={() => setTab(t.id)} style={{
                background: active ? `${t.color}18` : 'transparent',
                border: `1px solid ${active ? `${t.color}40` : 'transparent'}`,
                color: active ? t.color : 'rgba(255,255,255,.3)',
                boxShadow: active ? `0 0 20px ${t.color}18` : 'none',
              }}>
                <t.icon style={{ width:13, height:13 }} />{t.label}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14 }}>

              {/* User list */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ position:'relative' }}>
                  <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'rgba(255,255,255,.25)' }} />
                  <input className="ad-input" placeholder="Search users…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft:36 }} />
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.2)', paddingLeft:4, letterSpacing:'.08em', textTransform:'uppercase' }}>
                  {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
                </div>
                <div style={{ maxHeight:560, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
                  {filteredUsers.length === 0
                    ? <p style={{ fontSize:12, color:'rgba(255,255,255,.2)', textAlign:'center', padding:28, fontWeight:700 }}>No users found</p>
                    : filteredUsers.map((u, i) => (
                      <motion.button key={u.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.025 }}
                        onClick={() => setSelectedUser(u)} className="ad-user-row"
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, cursor:'pointer', background: selectedUser?.id===u.id?'rgba(239,68,68,.07)':'rgba(255,255,255,.025)', border:`1px solid ${selectedUser?.id===u.id?'rgba(239,68,68,.32)':'rgba(255,255,255,.05)'}`, textAlign:'left' }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, overflow:'hidden', background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff', border:`2px solid ${u.is_banned?'rgba(239,68,68,.5)':'rgba(255,255,255,.08)'}` }}>
                          {u.avatar_url && u.avatar_url !== 'null' ? <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : u.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{u.full_name}</p>
                          <p style={{ fontSize:10, color:'rgba(255,255,255,.25)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{u.email}</p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                          {u.is_banned && <span style={{ fontSize:8, fontWeight:900, color:'#f87171', background:'rgba(239,68,68,.14)', border:'1px solid rgba(239,68,68,.28)', padding:'1px 5px', borderRadius:4 }}>BAN</span>}
                          <span style={{ fontSize:8, fontWeight:800, color:u.role==='admin'?'#f87171':u.role==='mod'?'#a855f7':'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.06em' }}>{u.role||'user'}</span>
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
                    <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:18, marginBottom:18, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', border:`3px solid ${selectedUser.is_banned?'rgba(239,68,68,.5)':'rgba(251,191,36,.2)'}`, boxShadow:`0 0 24px ${selectedUser.is_banned?'rgba(239,68,68,.2)':'rgba(168,85,247,.18)'}` }}>
                        {selectedUser.avatar_url && selectedUser.avatar_url !== 'null' ? <img src={selectedUser.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : selectedUser.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:3, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.03em' }}>{selectedUser.full_name}</p>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:9, fontWeight:600 }}>{selectedUser.email}</p>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:9, fontWeight:900, padding:'3px 9px', borderRadius:6, textTransform:'uppercase', letterSpacing:'.06em', background:selectedUser.is_banned?'rgba(239,68,68,.14)':'rgba(34,197,94,.1)', color:selectedUser.is_banned?'#f87171':'#4ade80', border:`1px solid ${selectedUser.is_banned?'rgba(239,68,68,.3)':'rgba(34,197,94,.22)'}` }}>{selectedUser.is_banned?'● Banned':'● Active'}</span>
                          <span style={{ fontSize:9, fontWeight:900, padding:'3px 9px', borderRadius:6, textTransform:'uppercase', letterSpacing:'.06em', background:selectedUser.role==='admin'?'rgba(239,68,68,.14)':selectedUser.role==='mod'?'rgba(168,85,247,.1)':'rgba(96,165,250,.08)', color:selectedUser.role==='admin'?'#f87171':selectedUser.role==='mod'?'#c084fc':'#60a5fa', border:`1px solid ${selectedUser.role==='admin'?'rgba(239,68,68,.28)':selectedUser.role==='mod'?'rgba(168,85,247,.22)':'rgba(96,165,250,.18)'}` }}>{selectedUser.role||'user'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                      {[{ label:'Balance', val:`${(selectedUser.balance||0).toLocaleString()}`, suffix:' coins', color:'#fbbf24' }, { label:'Level', val:`${selectedUser.level||1}`, suffix:'', color:'#a855f7' }].map(({ label, val, suffix, color }) => (
                        <div key={label} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)' }}>
                          <p style={{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6, fontWeight:800 }}>{label}</p>
                          <p style={{ fontSize:18, fontWeight:900, color, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.02em' }}>{val}<span style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginLeft:3 }}>{suffix}</span></p>
                        </div>
                      ))}
                    </div>

                    {/* Balance adjust */}
                    <div style={{ marginBottom:18 }}>
                      <Label color="rgba(251,191,36,.5)">Adjust Balance</Label>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="number" className="ad-input ad-input-gold" placeholder="New balance amount" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} style={{ flex:1 }} />
                        <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:.95 }} onClick={handleAdjustBalance} disabled={loading||!balanceAmount}
                          style={{ padding:'10px 16px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000', fontWeight:900, fontFamily:'Nunito,sans-serif', fontSize:13, boxShadow:'0 0 22px rgba(251,191,36,.28)', flexShrink:0, opacity:loading||!balanceAmount?0.5:1 }}>
                          {loading ? <Loader2 style={{ width:14, height:14 }} className="spin" /> : <DollarSign style={{ width:14, height:14 }} />}
                        </motion.button>
                      </div>
                    </div>

                    {/* Role */}
                    <div style={{ marginBottom:20 }}>
                      <Label color="rgba(168,85,247,.5)">Role</Label>
                      <div style={{ display:'flex', gap:8 }}>
                        {['user','mod','admin'].map(role => {
                          const rColor = role==='admin'?'#f87171':role==='mod'?'#c084fc':'#60a5fa';
                          const active = selectedUser.role===role;
                          return (
                            <motion.button key={role} whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={() => handleChangeRole(role)} disabled={loading}
                              style={{ flex:1, padding:'9px 0', borderRadius:10, border:`1px solid ${active?`${rColor}50`:'rgba(255,255,255,.07)'}`, background:active?`${rColor}16`:'rgba(255,255,255,.03)', color:active?rColor:'rgba(255,255,255,.28)', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', boxShadow:active?`0 0 18px ${rColor}22`:'none', transition:'all .18s', textTransform:'capitalize', letterSpacing:'.04em' }}>{role}</motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8 }}>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={handleBanUser} disabled={loading}
                        style={{ flex:1, padding:'11px 0', borderRadius:11, border:`1px solid ${selectedUser.is_banned?'rgba(34,197,94,.3)':'rgba(239,68,68,.28)'}`, background:selectedUser.is_banned?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)', color:selectedUser.is_banned?'#4ade80':'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all .18s' }}>
                        <Ban style={{ width:13, height:13 }} />{selectedUser.is_banned?'Unban User':'Ban User'}
                      </motion.button>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={handleDeleteUser} disabled={loading}
                        style={{ padding:'11px 18px', borderRadius:11, cursor:'pointer', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.22)', color:'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', display:'flex', alignItems:'center', gap:6, transition:'all .18s' }}>
                        <Trash2 style={{ width:13, height:13 }} />Delete
                      </motion.button>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  style={{ borderRadius:16, border:'1px solid rgba(255,255,255,.05)', background:'rgba(255,255,255,.015)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12 }}>
                  <div style={{ width:56, height:56, borderRadius:14, background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Shield style={{ width:24, height:24, color:'rgba(239,68,68,.3)' }} />
                  </div>
                  <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.25)' }}>Select a user to manage</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,.12)', fontWeight:600 }}>{filteredUsers.length} users available</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── CASES TAB ── */}
          {tab === 'cases' && <CasesTab key="cases" onLog={addLog} />}

          {/* ── ACTIVITY TAB ── */}
          {tab === 'activity' && (
            <motion.div key="activity" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <Card accent="purple">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                  <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#a855f7,#6366f1)' }} />
                  <Activity style={{ width:15, height:15, color:'#a855f7' }} />
                  <span style={{ fontSize:15, fontWeight:900, color:'#fff', fontFamily:"'Rajdhani',sans-serif", letterSpacing:'.06em' }}>ACTIVITY LOG</span>
                  {activityLog.length > 0 && <span style={{ fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20, background:'rgba(168,85,247,.14)', color:'#c084fc', border:'1px solid rgba(168,85,247,.28)' }}>{activityLog.length}</span>}
                </div>
                {activityLog.length === 0
                  ? <div style={{ textAlign:'center', padding:'52px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <Activity style={{ width:36, height:36, color:'rgba(255,255,255,.08)' }} />
                      <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.2)' }}>No activity yet</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,.12)', fontWeight:600 }}>Actions will appear here</p>
                    </div>
                  : <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {activityLog.map((log, i) => (
                        <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.025 }}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:11, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.05)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7', flexShrink:0 }} />
                            <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{log.action}</p>
                          </div>
                          <p style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontWeight:700, flexShrink:0, letterSpacing:'.04em' }}>{log.timestamp}</p>
                        </motion.div>
                      ))}
                    </div>
                }
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}