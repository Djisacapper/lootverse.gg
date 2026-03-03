import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #04000a; }
.ad-root { font-family: 'Nunito', sans-serif; }
@keyframes ad-scan {
  0%  { top:-1px; opacity:0; } 5%  { opacity:.45; } 95% { opacity:.45; } 100%{ top:100%; opacity:0; }
}
.ad-scan { position:absolute; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(239,68,68,.25),transparent); animation:ad-scan 7s linear infinite; pointer-events:none; }
@keyframes ad-shimmer { 0%{transform:translateX(-120%) skewX(-15deg);} 100%{transform:translateX(350%) skewX(-15deg);} }
.ad-shim { position:relative; overflow:hidden; }
.ad-shim::after { content:''; position:absolute; top:0; left:0; width:25%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,60,60,.04),transparent); animation:ad-shimmer 6s ease-in-out infinite; pointer-events:none; border-radius:inherit; }
.ad-input { width:100%; padding:9px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.09); background:rgba(255,255,255,.04); color:#fff; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; transition:border-color .2s,box-shadow .2s; }
.ad-input::placeholder { color:rgba(255,255,255,.28); }
.ad-input:focus { outline:none; border-color:rgba(34,211,238,.45); box-shadow:0 0 0 3px rgba(34,211,238,.08); }
.ad-select { appearance:none; cursor:pointer; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); color:rgba(255,255,255,.7); font-family:'Nunito',sans-serif; font-weight:700; font-size:13px; padding:9px 12px; border-radius:10px; outline:none; width:100%; }
.ad-select option { background:#0d0008; }
.ad-tab-btn { display:flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; border:none; cursor:pointer; font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; transition:all .18s; white-space:nowrap; }
.ad-case-row { transition:border-color .2s,background .2s; cursor:pointer; }
.ad-case-row:hover { border-color:rgba(34,211,238,.3) !important; background:rgba(34,211,238,.05) !important; }
::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#2a0010; border-radius:4px; }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { animation:spin 1s linear infinite; }
`;

const RARITY_COLORS = { common:'#94a3b8', uncommon:'#4ade80', rare:'#60a5fa', epic:'#a855f7', legendary:'#fbbf24' };

// ── Simulated "DB" in memory ──
let MOCK_CASES = [
  {
    id:'c1', name:'Celestial Case', description:'Stars align for great loot', price:1000, category:'premium', image_url:'https://placehold.co/80x80/1a0030/a855f7?text=✦', is_active:true,
    items:[
      { id:'i1', name:'Nova Blade', rarity:'epic', value:800, drop_rate:15, image_url:'https://placehold.co/48x48/1a0030/a855f7?text=⚔' },
      { id:'i2', name:'Star Dust', rarity:'common', value:50, drop_rate:60, image_url:'https://placehold.co/48x48/1a0030/94a3b8?text=✦' },
      { id:'i3', name:'Moon Gem', rarity:'rare', value:300, drop_rate:25, image_url:'https://placehold.co/48x48/1a0030/60a5fa?text=◈' },
    ]
  },
  {
    id:'c2', name:'Budget Bonanza', description:'Affordable thrills', price:250, category:'budget', image_url:'https://placehold.co/80x80/001a10/4ade80?text=$', is_active:true,
    items:[
      { id:'i4', name:'Copper Coin', rarity:'common', value:20, drop_rate:70, image_url:'https://placehold.co/48x48/001a10/4ade80?text=¢' },
      { id:'i5', name:'Silver Ring', rarity:'uncommon', value:120, drop_rate:30, image_url:'https://placehold.co/48x48/001a10/4ade80?text=○' },
    ]
  },
];
let nextId = 100;
const genId = () => `id${nextId++}`;

function Label({ children }) {
  return <p style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.16em',marginBottom:6 }}>{children}</p>;
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return ()=>clearTimeout(t); }, []);
  const isErr = msg.startsWith('❌');
  return (
    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
      style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderRadius:12,marginBottom:14,
        background:isErr?'rgba(239,68,68,.08)':'rgba(34,197,94,.07)',
        border:`1px solid ${isErr?'rgba(239,68,68,.25)':'rgba(34,197,94,.22)'}` }}>
      <span style={{ fontSize:13,fontWeight:700,color:isErr?'#f87171':'#4ade80' }}>{msg}</span>
    </motion.div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Image picker (URL or file) ───────────────────────────────────
function ImagePicker({ value, onChange, label = "Image" }) {
  const [mode, setMode] = useState('url');
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
        <Label>{label}</Label>
        <div style={{ display:'flex',gap:4 }}>
          {['url','file'].map(m => (
            <button key={m} onClick={()=>setMode(m)} style={{
              padding:'2px 8px',borderRadius:6,border:'none',cursor:'pointer',fontSize:10,fontWeight:800,fontFamily:'Nunito,sans-serif',
              background:mode===m?'rgba(34,211,238,.2)':'rgba(255,255,255,.05)',
              color:mode===m?'#22d3ee':'rgba(255,255,255,.35)',
            }}>{m.toUpperCase()}</button>
          ))}
        </div>
      </div>
      {mode === 'url' ? (
        <input className="ad-input" placeholder="https://..." value={typeof value === 'string' ? value : ''} onChange={e=>onChange(e.target.value)} />
      ) : (
        <input className="ad-input" type="file" accept="image/*" onChange={e=>{
          const f = e.target.files?.[0];
          if (f) { const url = URL.createObjectURL(f); onChange(url); }
        }} style={{ color:'rgba(255,255,255,.4)',fontSize:12 }} />
      )}
      {value && typeof value === 'string' && (
        <img src={value} alt="" style={{ marginTop:8,width:48,height:48,borderRadius:8,objectFit:'cover',border:'1px solid rgba(255,255,255,.15)' }} onError={e=>e.target.style.display='none'} />
      )}
    </div>
  );
}

// ─── Item editor ──────────────────────────────────────────────────
function ItemEditor({ item, onChange, onDelete }) {
  return (
    <div style={{ padding:'14px',borderRadius:12,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.09)',display:'flex',flexDirection:'column',gap:10 }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        {item.image_url && <img src={item.image_url} alt="" style={{ width:40,height:40,borderRadius:8,objectFit:'cover',border:'1px solid rgba(255,255,255,.12)',flexShrink:0 }} onError={e=>e.target.style.display='none'} />}
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ fontSize:13,fontWeight:800,color:'#fff' }}>{item.name||'Untitled Item'}</p>
          <p style={{ fontSize:10,color:RARITY_COLORS[item.rarity]||'#94a3b8',fontWeight:700,textTransform:'capitalize' }}>{item.rarity} · {item.value?.toLocaleString()||0} coins · {item.drop_rate||0}% drop</p>
        </div>
        <button onClick={onDelete} style={{ background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'6px 10px',cursor:'pointer',color:'#f87171',fontFamily:'Nunito,sans-serif',fontSize:11,fontWeight:800 }}>✕ Remove</button>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:8 }}>
        <FieldRow label="Name">
          <input className="ad-input" value={item.name} onChange={e=>onChange({...item,name:e.target.value})} />
        </FieldRow>
        <FieldRow label="Rarity">
          <select className="ad-select" value={item.rarity} onChange={e=>onChange({...item,rarity:e.target.value})}>
            {['common','uncommon','rare','epic','legendary'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Value">
          <input className="ad-input" type="number" value={item.value} onChange={e=>onChange({...item,value:parseInt(e.target.value)||0})} />
        </FieldRow>
        <FieldRow label="Drop %">
          <input className="ad-input" type="number" value={item.drop_rate} onChange={e=>onChange({...item,drop_rate:parseInt(e.target.value)||0})} />
        </FieldRow>
      </div>
      <ImagePicker label="Item Image" value={item.image_url} onChange={v=>onChange({...item,image_url:v})} />
    </div>
  );
}

// ─── Case Editor Modal ────────────────────────────────────────────
function CaseEditorModal({ caseData, onSave, onClose, isNew }) {
  const [draft, setDraft] = useState(caseData ? JSON.parse(JSON.stringify(caseData)) : {
    id:genId(), name:'', description:'', price:500, category:'standard', image_url:'', is_active:true, items:[]
  });
  const [newItem, setNewItem] = useState({ name:'', rarity:'common', value:100, drop_rate:20, image_url:'' });
  const [adding, setAdding] = useState(false);

  const updateItem = (idx, updated) => {
    const items = [...draft.items]; items[idx]=updated; setDraft({...draft,items});
  };
  const deleteItem = (idx) => setDraft({...draft, items:draft.items.filter((_,i)=>i!==idx)});
  const addItem = () => {
    if (!newItem.name) return;
    setDraft({...draft, items:[...draft.items,{...newItem,id:genId()}]});
    setNewItem({name:'',rarity:'common',value:100,drop_rate:20,image_url:''});
    setAdding(false);
  };

  const totalDrop = draft.items.reduce((s,i)=>s+(parseFloat(i.drop_rate)||0),0);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'20px',background:'rgba(0,0,0,.75)',backdropFilter:'blur(4px)' }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <motion.div initial={{opacity:0,scale:.97,y:12}} animate={{opacity:1,scale:1,y:0}}
        style={{ width:'100%',maxWidth:720,background:'linear-gradient(145deg,#0a0010,#120018,#050008)',border:'1px solid rgba(34,211,238,.2)',borderRadius:20,padding:24,display:'flex',flexDirection:'column',gap:16,boxShadow:'0 40px 120px rgba(0,0,0,.9)' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:3,height:22,borderRadius:2,background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
            <span style={{ fontSize:18,fontWeight:900,color:'#fff' }}>{isNew ? '➕ Create Case' : '✏️ Edit Case'}</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'7px 14px',cursor:'pointer',color:'rgba(255,255,255,.5)',fontFamily:'Nunito,sans-serif',fontSize:13,fontWeight:800 }}>✕ Close</button>
        </div>

        {/* Case fields */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <FieldRow label="Case Name">
            <input className="ad-input" placeholder="e.g. Celestial Case" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} />
          </FieldRow>
          <FieldRow label="Description">
            <input className="ad-input" placeholder="Short description" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} />
          </FieldRow>
          <FieldRow label="Price (coins)">
            <input className="ad-input" type="number" value={draft.price} onChange={e=>setDraft({...draft,price:parseInt(e.target.value)||0})} />
          </FieldRow>
          <FieldRow label="Category">
            <select className="ad-select" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>
              {['budget','standard','premium','legendary','event'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Status">
            <div style={{ display:'flex',gap:8,paddingTop:2 }}>
              {[true,false].map(v=>(
                <button key={String(v)} onClick={()=>setDraft({...draft,is_active:v})} style={{
                  flex:1,padding:'8px',borderRadius:10,border:`1px solid ${draft.is_active===v?(v?'rgba(34,197,94,.4)':'rgba(239,68,68,.4)'):'rgba(255,255,255,.08)'}`,
                  background:draft.is_active===v?(v?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)'):'rgba(255,255,255,.03)',
                  color:draft.is_active===v?(v?'#4ade80':'#f87171'):'rgba(255,255,255,.3)',
                  fontSize:12,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:'pointer',
                }}>{v?'Active':'Inactive'}</button>
              ))}
            </div>
          </FieldRow>
          <div style={{ gridColumn:'1/-1' }}>
            <ImagePicker label="Case Image" value={draft.image_url} onChange={v=>setDraft({...draft,image_url:v})} />
          </div>
        </div>

        {/* Items section */}
        <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:14,fontWeight:900,color:'#fff' }}>Items</span>
              <span style={{ fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:20,background:'rgba(34,211,238,.12)',color:'#22d3ee',border:'1px solid rgba(34,211,238,.25)' }}>{draft.items.length}</span>
              <span style={{ fontSize:10,fontWeight:700,color:Math.abs(totalDrop-100)<1?'#4ade80':'#f87171' }}>Total drop: {totalDrop.toFixed(1)}%</span>
            </div>
            <button onClick={()=>setAdding(!adding)} style={{
              padding:'7px 14px',borderRadius:10,border:'1px solid rgba(34,211,238,.3)',background:'rgba(34,211,238,.1)',
              color:'#22d3ee',fontSize:12,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:'pointer',
            }}>+ Add Item</button>
          </div>

          {/* New item form */}
          <AnimatePresence>
          {adding && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              style={{ overflow:'hidden',marginBottom:12 }}>
              <div style={{ padding:14,borderRadius:12,background:'rgba(34,211,238,.05)',border:'1px solid rgba(34,211,238,.2)',display:'flex',flexDirection:'column',gap:10 }}>
                <p style={{ fontSize:12,fontWeight:800,color:'#22d3ee' }}>New Item</p>
                <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:8 }}>
                  <FieldRow label="Name"><input className="ad-input" placeholder="Item name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})} /></FieldRow>
                  <FieldRow label="Rarity">
                    <select className="ad-select" value={newItem.rarity} onChange={e=>setNewItem({...newItem,rarity:e.target.value})}>
                      {['common','uncommon','rare','epic','legendary'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </FieldRow>
                  <FieldRow label="Value"><input className="ad-input" type="number" value={newItem.value} onChange={e=>setNewItem({...newItem,value:parseInt(e.target.value)||0})} /></FieldRow>
                  <FieldRow label="Drop %"><input className="ad-input" type="number" value={newItem.drop_rate} onChange={e=>setNewItem({...newItem,drop_rate:parseFloat(e.target.value)||0})} /></FieldRow>
                </div>
                <ImagePicker label="Item Image" value={newItem.image_url} onChange={v=>setNewItem({...newItem,image_url:v})} />
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={addItem} disabled={!newItem.name} style={{ flex:1,padding:'9px',borderRadius:10,border:'none',background:newItem.name?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,.06)',color:newItem.name?'#000':'rgba(255,255,255,.2)',fontSize:13,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:newItem.name?'pointer':'not-allowed' }}>✓ Add Item</button>
                  <button onClick={()=>setAdding(false)} style={{ padding:'9px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,.1)',background:'transparent',color:'rgba(255,255,255,.4)',fontSize:13,fontWeight:800,fontFamily:'Nunito,sans-serif',cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Existing items */}
          <div style={{ display:'flex',flexDirection:'column',gap:10,maxHeight:400,overflowY:'auto' }}>
            {draft.items.length === 0 && !adding && (
              <div style={{ padding:'32px',textAlign:'center',borderRadius:12,border:'1px dashed rgba(255,255,255,.08)' }}>
                <p style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,.25)' }}>No items yet — click Add Item</p>
              </div>
            )}
            {draft.items.map((item,idx)=>(
              <ItemEditor key={item.id||idx} item={item} onChange={u=>updateItem(idx,u)} onDelete={()=>deleteItem(idx)} />
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={()=>onSave(draft)} style={{
          width:'100%',height:48,borderRadius:12,border:'none',cursor:'pointer',
          background:'linear-gradient(135deg,#22d3ee,#3b82f6)',color:'#000',
          fontSize:14,fontWeight:900,fontFamily:'Nunito,sans-serif',
          boxShadow:'0 0 30px rgba(34,211,238,.35)',
        }}>{isNew ? '🚀 Create Case' : '💾 Save Changes'}</button>
      </motion.div>
    </div>
  );
}

// ─── Cases Tab ────────────────────────────────────────────────────
function CasesTab() {
  const [cases, setCases] = useState(MOCK_CASES);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState('');

  const flash = msg => setToast(msg);

  const handleSave = (draft) => {
    if (isNew) {
      const updated = [...cases, draft];
      MOCK_CASES = updated; setCases(updated);
      flash('✅ Case created!');
    } else {
      const updated = cases.map(c=>c.id===draft.id?draft:c);
      MOCK_CASES = updated; setCases(updated);
      flash('✅ Case saved!');
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this case?')) return;
    const updated = cases.filter(c=>c.id!==id);
    MOCK_CASES = updated; setCases(updated);
    flash('✅ Case deleted');
  };

  return (
    <motion.div key="cases" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
      <AnimatePresence>{toast && <Toast msg={toast} onDone={()=>setToast('')} />}</AnimatePresence>

      {/* Toolbar */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:3,height:20,borderRadius:2,background:'linear-gradient(to bottom,#22d3ee,#3b82f6)' }} />
          <span style={{ fontSize:16,fontWeight:900,color:'#fff' }}>Cases</span>
          <span style={{ fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:20,background:'rgba(34,211,238,.12)',color:'#22d3ee',border:'1px solid rgba(34,211,238,.25)' }}>{cases.length}</span>
        </div>
        <button onClick={()=>{ setIsNew(true); setEditing({}); }} style={{
          padding:'9px 16px',borderRadius:10,border:'1px solid rgba(34,211,238,.35)',background:'rgba(34,211,238,.1)',
          color:'#22d3ee',fontSize:12,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:'pointer',
          boxShadow:'0 0 18px rgba(34,211,238,.15)',
        }}>+ New Case</button>
      </div>

      {/* Case grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12 }}>
        {cases.map((c,i)=>(
          <motion.div key={c.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}
            className="ad-shim ad-case-row"
            style={{ borderRadius:16,background:'linear-gradient(145deg,#0a0010,#120018)',border:'1px solid rgba(34,211,238,.1)',padding:16,display:'flex',flexDirection:'column',gap:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              {c.image_url && <img src={c.image_url} alt="" style={{ width:52,height:52,borderRadius:10,objectFit:'cover',border:'1px solid rgba(255,255,255,.12)',flexShrink:0 }} onError={e=>e.target.style.display='none'} />}
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ fontSize:14,fontWeight:900,color:'#fff',marginBottom:3 }}>{c.name}</p>
                <p style={{ fontSize:11,color:'rgba(255,255,255,.35)',fontWeight:600,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.description}</p>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:5,background:'rgba(251,191,36,.12)',color:'#fbbf24',border:'1px solid rgba(251,191,36,.25)' }}>{c.price.toLocaleString()} coins</span>
                  <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:5,background:'rgba(168,85,247,.12)',color:'#c084fc',border:'1px solid rgba(168,85,247,.25)',textTransform:'capitalize' }}>{c.category}</span>
                  <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:5,background:c.is_active?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:c.is_active?'#4ade80':'#f87171',border:`1px solid ${c.is_active?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}` }}>{c.is_active?'Active':'Inactive'}</span>
                </div>
              </div>
            </div>

            {/* Items preview */}
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
              {c.items.slice(0,5).map((item,j)=>(
                <div key={item.id||j} title={`${item.name} (${item.rarity})`} style={{ position:'relative' }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} style={{ width:32,height:32,borderRadius:6,objectFit:'cover',border:`1px solid ${RARITY_COLORS[item.rarity]||'rgba(255,255,255,.12)'}` }} onError={e=>e.target.style.display='none'} />
                    : <div style={{ width:32,height:32,borderRadius:6,background:`${RARITY_COLORS[item.rarity]}22`,border:`1px solid ${RARITY_COLORS[item.rarity]||'rgba(255,255,255,.12)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>◆</div>
                  }
                </div>
              ))}
              {c.items.length > 5 && <div style={{ width:32,height:32,borderRadius:6,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'rgba(255,255,255,.4)' }}>+{c.items.length-5}</div>}
            </div>
            <p style={{ fontSize:10,color:'rgba(255,255,255,.3)',fontWeight:700 }}>{c.items.length} item{c.items.length!==1?'s':''}</p>

            {/* Actions */}
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>{ setIsNew(false); setEditing(c); }} style={{ flex:1,padding:'9px',borderRadius:10,border:'1px solid rgba(34,211,238,.3)',background:'rgba(34,211,238,.08)',color:'#22d3ee',fontSize:12,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:'pointer' }}>✏️ Edit</button>
              <button onClick={()=>handleDelete(c.id)} style={{ padding:'9px 14px',borderRadius:10,border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.08)',color:'#f87171',fontSize:12,fontWeight:900,fontFamily:'Nunito,sans-serif',cursor:'pointer' }}>🗑</button>
            </div>
          </motion.div>
        ))}
        {cases.length === 0 && (
          <div style={{ gridColumn:'1/-1',padding:'60px',textAlign:'center',borderRadius:16,border:'1px dashed rgba(255,255,255,.07)' }}>
            <p style={{ fontSize:15,fontWeight:700,color:'rgba(255,255,255,.25)' }}>No cases yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {editing!==null && (
          <CaseEditorModal caseData={isNew?null:editing} onSave={handleSave} onClose={()=>setEditing(null)} isNew={isNew} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState('cases');

  const TABS = [
    { id:'cases', label:'Cases', color:'#22d3ee' },
    { id:'users', label:'Users', color:'#f87171' },
  ];

  return (
    <div className="ad-root" style={{ background:'#04000a',minHeight:'100vh',padding:'20px 0 80px' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:960,margin:'0 auto',display:'flex',flexDirection:'column',gap:20,padding:'0 16px' }}>

        {/* Header */}
        <div style={{ position:'relative',overflow:'hidden',borderRadius:18,background:'linear-gradient(120deg,#0a0008,#1a000c,#280010,#0a0008)',border:'1px solid rgba(239,68,68,.18)',padding:'22px 24px' }}>
          <div className="ad-scan" />
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <span style={{ fontSize:24 }}>🛡️</span>
            <div>
              <h1 style={{ fontSize:22,fontWeight:900,color:'#fff' }}>Admin Panel</h1>
              <p style={{ fontSize:12,color:'rgba(255,255,255,.3)',fontWeight:600 }}>Manage cases, users, and more</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:4,padding:4,borderRadius:14,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',alignSelf:'flex-start' }}>
          {TABS.map(t=>{
            const active = tab===t.id;
            return (
              <button key={t.id} className="ad-tab-btn" onClick={()=>setTab(t.id)} style={{
                background:active?`${t.color}18`:'transparent',
                border:`1px solid ${active?`${t.color}45`:'transparent'}`,
                color:active?t.color:'rgba(255,255,255,.35)',
                boxShadow:active?`0 0 18px ${t.color}20`:'none',
              }}>{t.label}</button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'cases' && <CasesTab key="cases" />}
          {tab === 'users' && (
            <motion.div key="users" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <div style={{ padding:'60px',textAlign:'center',borderRadius:16,border:'1px dashed rgba(255,255,255,.07)' }}>
                <p style={{ fontSize:15,fontWeight:700,color:'rgba(255,255,255,.3)' }}>User management tab — wire up your base44 entities here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}