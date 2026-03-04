import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Search, DollarSign, Ban, Trash2, Activity,
  AlertCircle, CheckCircle2, Loader2, Box, Plus, X,
  Trophy, RefreshCw, Users, Crown, Zap, ChevronRight, Pencil
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
@keyframes ad-hex-pulse { 0%,100% { opacity:.018; } 50% { opacity:.045; } }
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
.ad-input-cyan:focus {
  border-color:rgba(34,211,238,.45) !important;
  box-shadow:0 0 0 3px rgba(34,211,238,.08) !important;
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
.ad-case-card { transition:border-color .22s, background .22s; }
.ad-case-card:hover { border-color:rgba(34,211,238,.3) !important; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-thumb { background:#2a0010; border-radius:4px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; display:inline-block; }
`;

const RARITY_COLORS = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#a855f7', legendary: '#fbbf24',
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.16em', marginBottom:7 }}>
      {children}
    </p>
  );
}

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

function Card({ children, accent = 'red', style = {} }) {
  const borders = { red:'rgba(239,68,68,.14)', gold:'rgba(251,191,36,.14)', cyan:'rgba(6,182,212,.14)', purple:'rgba(168,85,247,.14)' };
  return (
    <div className="ad-shim" style={{
      position:'relative', overflow:'hidden', borderRadius:16,
      background:'linear-gradient(145deg,#0a0010,#120018,#050008)',
      border:`1px solid ${borders[accent]}`,
      padding:'20px',
      ...style,
    }}>
      <div className="ad-scan" />
      {children}
    </div>
  );
}

/* ─── Image Picker (URL or file upload) ─────────────────────────── */
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
      // fallback: use object URL for preview only
      onChange(URL.createObjectURL(file));
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <Label>{label}</Label>
        <div style={{ display:'flex', gap:4 }}>
          {['url','file'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding:'2px 8px', borderRadius:6, border:'none', cursor:'pointer',
              fontSize:10, fontWeight:800, fontFamily:'Nunito,sans-serif',
              background: mode===m ? 'rgba(34,211,238,.2)' : 'rgba(255,255,255,.05)',
              color: mode===m ? '#22d3ee' : 'rgba(255,255,255,.3)',
            }}>{m.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {mode === 'url' ? (
        <input
          className="ad-input ad-input-cyan"
          placeholder="https://..."
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input
            className="ad-input ad-input-cyan"
            type="file" accept="image/*"
            onChange={handleFile}
            style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}
          />
          {uploading && <Loader2 style={{ width:16, height:16, color:'#22d3ee', flexShrink:0 }} className="spin" />}
        </div>
      )}
      {value && (
        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
          <img
            src={value} alt=""
            style={{ width:52, height:52, borderRadius:8, objectFit:'cover', border:'1px solid rgba(255,255,255,.15)' }}
            onError={e => e.target.style.display='none'}
          />
          <button onClick={() => onChange('')} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:8, padding:'4px 10px', cursor:'pointer', color:'#f87171', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>Remove</button>
        </div>
      )}
    </div>
  );
}

/* ─── Item editor row ───────────────────────────────────────────── */
function ItemEditor({ item, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius:12, background:'rgba(255,255,255,.03)', border:`1px solid ${RARITY_COLORS[item.rarity]}33`, overflow:'hidden' }}>
      {/* Collapsed row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:RARITY_COLORS[item.rarity], boxShadow:`0 0 8px ${RARITY_COLORS[item.rarity]}`, flexShrink:0 }} />
        {item.image_url && (
          <img src={item.image_url} alt="" style={{ width:36, height:36, borderRadius:7, objectFit:'cover', border:'1px solid rgba(255,255,255,.12)', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{item.name || 'Unnamed item'}</p>
          <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.35)' }}>
            <span style={{ color:RARITY_COLORS[item.rarity] }}>{item.rarity}</span>
            {' · '}{(item.value||0).toLocaleString()} coins{' · '}{item.drop_rate||0}% drop
          </p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700 }}>{open ? '▲' : '▼'}</span>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:7, padding:'4px 8px', cursor:'pointer', color:'#f87171', fontSize:11, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>✕</button>
        </div>
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ overflow:'hidden', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:12 }}>
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
  const blank = { name:'', description:'', price:500, category:'standard', image_url:'', is_active:true, items:[] };
  const [draft, setDraft] = useState(caseData ? JSON.parse(JSON.stringify(caseData)) : blank);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // new item form
  const [ni, setNi] = useState({ name:'', rarity:'common', value:100, drop_rate:20, image_url:'' });
  const [addingItem, setAddingItem] = useState(false);

  const totalDrop = draft.items.reduce((s, i) => s + (parseFloat(i.drop_rate) || 0), 0);

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
    } catch (e) {
      setMsg('❌ Error saving case');
      setSaving(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.78)', backdropFilter:'blur(5px)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'24px 16px' }}>
      <motion.div
        initial={{ opacity:0, scale:.97, y:14 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ width:'100%', maxWidth:740, background:'linear-gradient(145deg,#0a0010,#150020,#050008)', border:'1px solid rgba(34,211,238,.22)', borderRadius:20, padding:26, display:'flex', flexDirection:'column', gap:18, boxShadow:'0 40px 120px rgba(0,0,0,.9)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:3, height:22, borderRadius:2, background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
            <Box style={{ width:16, height:16, color:'#22d3ee' }} />
            <span style={{ fontSize:17, fontWeight:900, color:'#fff' }}>{isNew ? 'Create New Case' : 'Edit Case'}</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'7px 14px', cursor:'pointer', color:'rgba(255,255,255,.45)', fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:800 }}>✕ Close</button>
        </div>

        <AnimatePresence>{msg && <Toast msg={msg} />}</AnimatePresence>

        {/* Case fields */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><Label>Case Name</Label>
            <input className="ad-input ad-input-cyan" placeholder="e.g. Celestial Case" value={draft.name} onChange={e => setDraft(d=>({...d,name:e.target.value}))} /></div>
          <div><Label>Description</Label>
            <input className="ad-input ad-input-cyan" placeholder="Short description" value={draft.description} onChange={e => setDraft(d=>({...d,description:e.target.value}))} /></div>
          <div><Label>Price (coins)</Label>
            <input className="ad-input ad-input-cyan" type="number" value={draft.price} onChange={e => setDraft(d=>({...d,price:e.target.value}))} /></div>
          <div><Label>Category</Label>
            <select className="ad-select" value={draft.category} onChange={e => setDraft(d=>({...d,category:e.target.value}))}>
              {['budget','standard','premium','legendary','event'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select></div>
          <div><Label>Status</Label>
            <div style={{ display:'flex', gap:8, paddingTop:2 }}>
              {[true,false].map(v => (
                <button key={String(v)} onClick={() => setDraft(d=>({...d,is_active:v}))} style={{
                  flex:1, padding:'9px', borderRadius:10,
                  border:`1px solid ${draft.is_active===v ? (v?'rgba(34,197,94,.4)':'rgba(239,68,68,.4)') : 'rgba(255,255,255,.08)'}`,
                  background: draft.is_active===v ? (v?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)') : 'rgba(255,255,255,.03)',
                  color: draft.is_active===v ? (v?'#4ade80':'#f87171') : 'rgba(255,255,255,.3)',
                  fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer',
                }}>{v ? 'Active' : 'Inactive'}</button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <ImagePicker label="Case Image" value={draft.image_url} onChange={v => setDraft(d=>({...d,image_url:v}))} />
          </div>
        </div>

        {/* Items */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14, fontWeight:900, color:'#fff' }}>Items</span>
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(34,211,238,.12)', color:'#22d3ee', border:'1px solid rgba(34,211,238,.25)' }}>{draft.items.length}</span>
              <span style={{ fontSize:11, fontWeight:700, color: Math.abs(totalDrop-100)<0.5 ? '#4ade80' : '#f87171' }}>
                {totalDrop.toFixed(1)}% total drop rate
              </span>
            </div>
            <button onClick={() => setAddingItem(a => !a)} style={{
              padding:'8px 14px', borderRadius:10, border:'1px solid rgba(34,211,238,.3)',
              background:'rgba(34,211,238,.1)', color:'#22d3ee',
              fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}><Plus style={{ width:12, height:12 }} /> Add Item</button>
          </div>

          {/* New item form */}
          <AnimatePresence>
            {addingItem && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:14, borderRadius:12, background:'rgba(34,211,238,.05)', border:'1px solid rgba(34,211,238,.2)', display:'flex', flexDirection:'column', gap:10 }}>
                  <p style={{ fontSize:12, fontWeight:800, color:'#22d3ee' }}>New Item</p>
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
                      style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:ni.name?'pointer':'not-allowed', background:ni.name?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,.06)', color:ni.name?'#000':'rgba(255,255,255,.2)', fontSize:13, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>
                      ✓ Add Item
                    </motion.button>
                    <button onClick={() => setAddingItem(false)} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:800, fontFamily:'Nunito,sans-serif', cursor:'pointer' }}>Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing items */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:420, overflowY:'auto' }}>
            {draft.items.length === 0 && !addingItem && (
              <div style={{ padding:'40px', textAlign:'center', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
                <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.25)' }}>No items yet — click Add Item above</p>
              </div>
            )}
            {draft.items.map((item, idx) => (
              <ItemEditor key={idx} item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
            ))}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -2 }}
          whileTap={{ scale: saving ? 1 : .97 }}
          onClick={handleSave} disabled={saving}
          style={{
            width:'100%', height:50, borderRadius:12, border:'none', cursor:saving?'not-allowed':'pointer',
            background: saving ? 'rgba(255,255,255,.06)' : 'linear-gradient(135deg,#22d3ee,#3b82f6)',
            color: saving ? 'rgba(255,255,255,.2)' : '#000',
            fontSize:15, fontWeight:900, fontFamily:'Nunito,sans-serif',
            display:'flex', alignItems:'center', justifyContent:'center', gap:9,
            boxShadow: saving ? 'none' : '0 0 40px rgba(34,211,238,.3)',
            transition:'all .2s',
          }}>
          {saving
            ? <><Loader2 style={{ width:18, height:18 }} className="spin" /> Saving…</>
            : <>{isNew ? '🚀 Create Case' : '💾 Save Changes'}</>}
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ─── Cases Tab ─────────────────────────────────────────────────── */
function CasesTab({ onLog }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null = closed, {} = new, obj = existing
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');

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

  const openNew = () => { setIsNew(true); setEditing({}); };
  const openEdit = c => { setIsNew(false); setEditing(c); };

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

  return (
    <motion.div key="cases" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <AnimatePresence>{message && <Toast msg={message} />}</AnimatePresence>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
          <Box style={{ width:15, height:15, color:'#22d3ee' }} />
          <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>Cases</span>
          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(34,211,238,.12)', color:'#22d3ee', border:'1px solid rgba(34,211,238,.25)' }}>{cases.length}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={loadCases}
            style={{ padding:'9px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:800, fontFamily:'Nunito,sans-serif' }}>
            <RefreshCw style={{ width:13, height:13 }} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={openNew}
            style={{ padding:'9px 18px', borderRadius:10, border:'1px solid rgba(34,211,238,.35)', background:'rgba(34,211,238,.1)', color:'#22d3ee', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', boxShadow:'0 0 18px rgba(34,211,238,.15)' }}>
            <Plus style={{ width:13, height:13 }} /> New Case
          </motion.button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}>
          <Loader2 style={{ width:32, height:32, color:'rgba(34,211,238,.4)' }} className="spin" />
        </div>
      )}

      {/* Case grid */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
          {cases.length === 0 && (
            <div style={{ gridColumn:'1/-1', padding:'60px', textAlign:'center', borderRadius:16, border:'1px dashed rgba(255,255,255,.07)' }}>
              <Box style={{ width:40, height:40, color:'rgba(255,255,255,.1)', margin:'0 auto 12px' }} />
              <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.25)' }}>No cases yet</p>
            </div>
          )}
          {cases.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
              className="ad-case-card ad-shim"
              style={{ borderRadius:16, background:'linear-gradient(145deg,#0a0010,#120018)', border:'1px solid rgba(34,211,238,.1)', padding:16, display:'flex', flexDirection:'column', gap:12 }}>

              {/* Case header */}
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {c.image_url
                  ? <img src={c.image_url} alt="" style={{ width:56, height:56, borderRadius:10, objectFit:'cover', border:'1px solid rgba(255,255,255,.12)', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
                  : <div style={{ width:56, height:56, borderRadius:10, background:'rgba(34,211,238,.08)', border:'1px solid rgba(34,211,238,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Box style={{ width:22, height:22, color:'rgba(34,211,238,.4)' }} />
                    </div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:900, color:'#fff', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:600, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</p>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:'rgba(251,191,36,.12)', color:'#fbbf24', border:'1px solid rgba(251,191,36,.25)' }}>{(c.price||0).toLocaleString()} coins</span>
                    <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:'rgba(168,85,247,.1)', color:'#c084fc', border:'1px solid rgba(168,85,247,.2)', textTransform:'capitalize' }}>{c.category}</span>
                    <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:c.is_active?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color:c.is_active?'#4ade80':'#f87171', border:`1px solid ${c.is_active?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}` }}>{c.is_active?'Active':'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* Items preview */}
              {c.items?.length > 0 && (
                <div>
                  <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.25)', marginBottom:6 }}>{c.items.length} item{c.items.length!==1?'s':''}</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {c.items.slice(0,6).map((item, j) => (
                      <div key={j} title={`${item.name} (${item.rarity}) — ${item.drop_rate}% drop`}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} style={{ width:34, height:34, borderRadius:7, objectFit:'cover', border:`1.5px solid ${RARITY_COLORS[item.rarity]||'rgba(255,255,255,.12)'}` }} onError={e=>e.target.style.display='none'} />
                          : <div style={{ width:34, height:34, borderRadius:7, background:`${RARITY_COLORS[item.rarity]}22`, border:`1.5px solid ${RARITY_COLORS[item.rarity]}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>◆</div>
                        }
                      </div>
                    ))}
                    {c.items.length > 6 && (
                      <div style={{ width:34, height:34, borderRadius:7, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'rgba(255,255,255,.4)' }}>+{c.items.length-6}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }} onClick={() => openEdit(c)}
                  style={{ flex:1, padding:'9px', borderRadius:10, border:'1px solid rgba(34,211,238,.3)', background:'rgba(34,211,238,.08)', color:'#22d3ee', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Pencil style={{ width:12, height:12 }} /> Edit
                </motion.button>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
                  onClick={() => handleDelete(c)} disabled={deleting===c.id}
                  style={{ padding:'9px 14px', borderRadius:10, border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.08)', color:'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  {deleting===c.id ? <Loader2 style={{ width:13, height:13 }} className="spin" /> : <Trash2 style={{ width:13, height:13 }} />}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor modal */}
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
  const [user, setUser]                   = useState(null);
  const [allUsers, setAllUsers]           = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedUser, setSelectedUser]   = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [activityLog, setActivityLog]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState('');
  const [tab, setTab]                     = useState('users');

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
  const addLog = (action) => setActivityLog(prev => [{ timestamp: new Date().toLocaleTimeString(), action }, ...prev.slice(0, 19)]);

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

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user && user.role !== 'admin') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, fontFamily:'Nunito,sans-serif' }}>
      <Shield style={{ width:48, height:48, color:'rgba(239,68,68,.4)' }} />
      <p style={{ fontSize:17, fontWeight:800, color:'rgba(255,255,255,.5)' }}>Access Denied</p>
    </div>
  );

  const TABS = [
    { id:'users',       label:'Users',       icon:Users,   color:'#f87171' },
    { id:'cases',       label:'Cases',       icon:Box,     color:'#22d3ee' },
    { id:'activity',    label:'Activity',    icon:Activity,color:'#a855f7' },
  ];

  return (
    <div className="ad-root" style={{ background:'#04000a', minHeight:'100vh', padding:'20px 0 80px' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:960, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Hero header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ position:'relative', overflow:'hidden', borderRadius:18, background:'linear-gradient(120deg,#0a0008 0%,#1a000c 40%,#280010 70%,#0a0008 100%)', border:'1px solid rgba(239,68,68,.18)', boxShadow:'0 28px 70px rgba(0,0,0,.85)', padding:'26px 28px' }}>
          <div className="ad-scan" />
          <div className="ad-hex" />
          <div style={{ position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', opacity:.06 }}>
            <Shield style={{ width:90, height:90, color:'#ef4444' }} />
          </div>
          <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:14 }}>
            <div className="ad-shield"><Shield style={{ width:28, height:28, color:'#f87171' }} /></div>
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
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(239,68,68,.5),rgba(168,85,247,.4),transparent)' }} />
        </motion.div>

        <AnimatePresence>{message && <Toast msg={message} />}</AnimatePresence>

        {/* Tabs */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.1 }}
          style={{ display:'flex', gap:4, padding:4, borderRadius:14, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', alignSelf:'flex-start', flexWrap:'wrap' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="ad-tab-btn" onClick={() => setTab(t.id)} style={{
                background: active ? `${t.color}18` : 'transparent',
                border: `1px solid ${active ? `${t.color}45` : 'transparent'}`,
                color: active ? t.color : 'rgba(255,255,255,.35)',
                boxShadow: active ? `0 0 18px ${t.color}20` : 'none',
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
              style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ position:'relative' }}>
                  <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'rgba(255,255,255,.3)' }} />
                  <input className="ad-input" placeholder="Search users…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft:36 }} />
                </div>
                <div style={{ maxHeight:560, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                  {filteredUsers.length === 0
                    ? <p style={{ fontSize:12, color:'rgba(255,255,255,.25)', textAlign:'center', padding:24, fontWeight:700 }}>No users found</p>
                    : filteredUsers.map((u, i) => (
                      <motion.button key={u.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                        onClick={() => setSelectedUser(u)} className="ad-user-row"
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, cursor:'pointer', background: selectedUser?.id===u.id?'rgba(239,68,68,.08)':'rgba(255,255,255,.03)', border:`1px solid ${selectedUser?.id===u.id?'rgba(239,68,68,.35)':'rgba(255,255,255,.06)'}`, textAlign:'left' }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, overflow:'hidden', background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', border:`2px solid ${u.is_banned?'rgba(239,68,68,.5)':'rgba(255,255,255,.1)'}` }}>
                          {u.avatar_url && u.avatar_url !== 'null' ? <img src={u.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : u.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:800, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.full_name}</p>
                          <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{u.email}</p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
                          {u.is_banned && <span style={{ fontSize:8, fontWeight:900, color:'#f87171', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', padding:'1px 5px', borderRadius:4 }}>BAN</span>}
                          <span style={{ fontSize:8, fontWeight:800, color:u.role==='admin'?'#f87171':u.role==='mod'?'#a855f7':'rgba(255,255,255,.3)', textTransform:'uppercase' }}>{u.role||'user'}</span>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </div>

              {selectedUser ? (
                <motion.div key={selectedUser.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}>
                  <Card accent="red">
                    <div style={{ display:'flex', alignItems:'center', gap:16, paddingBottom:18, marginBottom:18, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'linear-gradient(135deg,#7c3aed,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', border:`3px solid ${selectedUser.is_banned?'rgba(239,68,68,.5)':'rgba(251,191,36,.25)'}`, boxShadow:`0 0 20px ${selectedUser.is_banned?'rgba(239,68,68,.2)':'rgba(168,85,247,.2)'}` }}>
                        {selectedUser.avatar_url && selectedUser.avatar_url !== 'null' ? <img src={selectedUser.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : selectedUser.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:3 }}>{selectedUser.full_name}</p>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8, fontWeight:600 }}>{selectedUser.email}</p>
                        <div style={{ display:'flex', gap:6 }}>
                          <span style={{ fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:6, textTransform:'uppercase', background:selectedUser.is_banned?'rgba(239,68,68,.15)':'rgba(34,197,94,.1)', color:selectedUser.is_banned?'#f87171':'#4ade80', border:`1px solid ${selectedUser.is_banned?'rgba(239,68,68,.3)':'rgba(34,197,94,.25)'}` }}>{selectedUser.is_banned?'Banned':'Active'}</span>
                          <span style={{ fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:6, textTransform:'uppercase', background:selectedUser.role==='admin'?'rgba(239,68,68,.15)':selectedUser.role==='mod'?'rgba(168,85,247,.12)':'rgba(96,165,250,.1)', color:selectedUser.role==='admin'?'#f87171':selectedUser.role==='mod'?'#c084fc':'#60a5fa', border:`1px solid ${selectedUser.role==='admin'?'rgba(239,68,68,.3)':selectedUser.role==='mod'?'rgba(168,85,247,.25)':'rgba(96,165,250,.2)'}` }}>{selectedUser.role||'user'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
                      {[{ label:'Balance', val:`${(selectedUser.balance||0).toLocaleString()} coins`, color:'#fbbf24' }, { label:'Level', val:`Lv ${selectedUser.level||1}`, color:'#a855f7' }].map(({ label, val, color }) => (
                        <div key={label} style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)' }}>
                          <p style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:4, fontWeight:800 }}>{label}</p>
                          <p style={{ fontSize:16, fontWeight:900, color }}>{val}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom:16 }}>
                      <Label>Adjust Balance</Label>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="number" className="ad-input ad-input-gold" placeholder="New balance amount" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} style={{ flex:1 }} />
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }} onClick={handleAdjustBalance} disabled={loading||!balanceAmount}
                          style={{ padding:'10px 16px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000', fontWeight:900, fontFamily:'Nunito,sans-serif', fontSize:13, boxShadow:'0 0 20px rgba(251,191,36,.3)', flexShrink:0, opacity:loading||!balanceAmount?.5:1 }}>
                          {loading ? <Loader2 style={{ width:14, height:14 }} className="spin" /> : <DollarSign style={{ width:14, height:14 }} />}
                        </motion.button>
                      </div>
                    </div>

                    <div style={{ marginBottom:18 }}>
                      <Label>Role</Label>
                      <div style={{ display:'flex', gap:8 }}>
                        {['user','mod','admin'].map(role => {
                          const rColor = role==='admin'?'#f87171':role==='mod'?'#c084fc':'#60a5fa';
                          const active = selectedUser.role===role;
                          return (
                            <motion.button key={role} whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }} onClick={() => handleChangeRole(role)} disabled={loading}
                              style={{ flex:1, padding:'8px 0', borderRadius:10, border:`1px solid ${active?`${rColor}55`:'rgba(255,255,255,.08)'}`, background:active?`${rColor}18`:'rgba(255,255,255,.04)', color:active?rColor:'rgba(255,255,255,.35)', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', boxShadow:active?`0 0 16px ${rColor}25`:'none', transition:'all .18s', textTransform:'capitalize' }}>{role}</motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8 }}>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={handleBanUser} disabled={loading}
                        style={{ flex:1, padding:'10px 0', borderRadius:10, border:`1px solid ${selectedUser.is_banned?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`, background:selectedUser.is_banned?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)', color:selectedUser.is_banned?'#4ade80':'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .18s' }}>
                        <Ban style={{ width:13, height:13 }} />{selectedUser.is_banned?'Unban':'Ban User'}
                      </motion.button>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={handleDeleteUser} disabled={loading}
                        style={{ flex:1, padding:'10px 0', borderRadius:10, cursor:'pointer', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#f87171', fontSize:12, fontWeight:900, fontFamily:'Nunito,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .18s' }}>
                        <Trash2 style={{ width:13, height:13 }} />Delete
                      </motion.button>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ borderRadius:16, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12 }}>
                  <Shield style={{ width:40, height:40, color:'rgba(255,255,255,.12)' }} />
                  <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.3)' }}>Select a user to manage</p>
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
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:3, height:20, borderRadius:2, background:'linear-gradient(to bottom,#a855f7,#6366f1)' }} />
                  <Activity style={{ width:15, height:15, color:'#a855f7' }} />
                  <span style={{ fontSize:15, fontWeight:900, color:'#fff' }}>Activity Log</span>
                  {activityLog.length > 0 && <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'rgba(168,85,247,.15)', color:'#c084fc', border:'1px solid rgba(168,85,247,.3)' }}>{activityLog.length}</span>}
                </div>
                {activityLog.length === 0
                  ? <div style={{ textAlign:'center', padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <Activity style={{ width:36, height:36, color:'rgba(255,255,255,.1)' }} />
                      <p style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.25)' }}>No activity yet</p>
                    </div>
                  : <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {activityLog.map((log, i) => (
                        <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.03 }}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:11, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:'#a855f7', boxShadow:'0 0 8px #a855f7', flexShrink:0 }} />
                            <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.75)' }}>{log.action}</p>
                          </div>
                          <p style={{ fontSize:10, color:'rgba(255,255,255,.28)', fontWeight:700, flexShrink:0 }}>{log.timestamp}</p>
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