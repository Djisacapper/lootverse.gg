import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, User, ArrowLeft, Crown, CheckCircle2, Loader2, Swords, Shield, Trophy } from 'lucide-react';
import { rollItem } from './useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import JackpotWheel from './JackpotWheel';
import { usePlayerAvatars, safeAvatarUrl } from './usePlayerAvatars';
import { useProvablyFairArena } from './useprovablyfair';
import ProvablyFairVerifier from './Provablyfairverifier';

/* ─── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');

:root {
  --gold: #f5c842;
  --gold-dim: rgba(245,200,66,.15);
  --gold-glow: rgba(245,200,66,.4);
  --purple: #9d6fff;
  --purple-dim: rgba(157,111,255,.12);
  --bg-deep: #03000d;
  --bg-card: #0a0718;
  --border-subtle: rgba(255,255,255,.06);
  --border-gold: rgba(245,200,66,.22);
  --text-bright: #f0eaff;
  --text-mid: rgba(240,234,255,.5);
  --text-dim: rgba(240,234,255,.25);
  --green: #00e5a0;
  --cyan: #00e5ff;
}

.ba { font-family: 'Outfit', sans-serif; color: var(--text-bright); }
.ba-title { font-family: 'Rajdhani', sans-serif; letter-spacing: .06em; }

.ba-noise {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  background-repeat: repeat; background-size: 150px; mix-blend-mode: overlay;
}

@keyframes ba-scan {
  0% { top: -2px; opacity: 0; } 4% { opacity: 1; } 96% { opacity: .5; } 100% { top: 100%; opacity: 0; }
}
.ba-scan {
  position: absolute; left: 0; right: 0; height: 1px; z-index: 10; pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold) 70%, transparent 100%);
  opacity: 0; animation: ba-scan 8s linear infinite;
}

@keyframes ba-rise {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10% { opacity: 1; } 85% { opacity: .4; }
  100% { transform: translateY(-100px) translateX(var(--dx)) scale(0); opacity: 0; }
}
.ba-pt { position: absolute; border-radius: 50%; pointer-events: none; animation: ba-rise var(--d) ease-out infinite var(--delay); }

@keyframes ba-ring { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.5); opacity: 0; } }
.ba-ring { animation: ba-ring 1.8s ease-out infinite; }

@keyframes ba-winner-pulse {
  0%,100% { box-shadow: 0 0 0 1.5px rgba(245,200,66,.3), 0 0 35px rgba(245,200,66,.1), inset 0 0 30px rgba(245,200,66,.04); }
  50%      { box-shadow: 0 0 0 2px rgba(245,200,66,.55), 0 0 65px rgba(245,200,66,.2), inset 0 0 45px rgba(245,200,66,.09); }
}
.ba-winner { animation: ba-winner-pulse 2.2s ease-in-out infinite; }

@keyframes ba-vs { 0%,100% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.22); opacity: .95; } }
.ba-vs-badge { animation: ba-vs 2s ease-in-out infinite; }

@keyframes ba-item-in {
  0% { transform: translateX(-14px) scale(.94); opacity: 0; }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}
.ba-item-in { animation: ba-item-in .3s cubic-bezier(.22,1,.36,1) forwards; }

.ba-spin-slot {
  flex-shrink: 0; height: 252px; position: relative;
  border-radius: 12px; overflow: hidden; background: #04010e;
  border: 1px solid rgba(157,111,255,.18);
}

@keyframes ba-magic {
  0%,100% { opacity: .6; letter-spacing: .22em; color: var(--cyan); }
  50%      { opacity: 1;  letter-spacing: .3em;  color: #fff; }
}
.ba-magic-lbl { animation: ba-magic 1.2s ease-in-out infinite; font-size: 9px; font-weight: 800; text-transform: uppercase; display: block; text-align: center; }

@keyframes ba-pip { 0%,100% { box-shadow: 0 0 0 0 rgba(245,200,66,.6); } 50% { box-shadow: 0 0 0 5px rgba(245,200,66,.15); } }
.ba-pip-live { animation: ba-pip 1.1s ease-in-out infinite; }

@keyframes ba-cdpop {
  0% { transform: scale(0.04) rotate(-10deg); opacity: 0; }
  65% { transform: scale(1.1) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.ba-cdnum { animation: ba-cdpop .48s cubic-bezier(.34,1.56,.64,1) forwards; }

@keyframes ba-win-in {
  0% { transform: translateY(-22px) scale(.95); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
.ba-win-banner { animation: ba-win-in .55s cubic-bezier(.34,1.56,.64,1) forwards; }

.ba-scroll::-webkit-scrollbar { width: 2px; }
.ba-scroll::-webkit-scrollbar-thumb { background: rgba(157,111,255,.22); border-radius: 2px; }

.ba-col {
  position: relative; flex: 1; display: flex; flex-direction: column;
  border-radius: 18px; overflow: hidden; background: var(--bg-card);
  border: 1.5px solid var(--border-subtle); min-width: 0;
  transition: border-color .35s, box-shadow .35s;
}

.ba-btn-ghost {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
  border-radius: 10px; color: var(--text-mid); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .18s, border-color .18s, color .18s; font-family: 'Outfit', sans-serif;
}
.ba-btn-ghost:hover { background: rgba(245,200,66,.1); border-color: rgba(245,200,66,.3); color: var(--gold); }

.ba-btn-gold {
  background: linear-gradient(135deg, #f5c842 0%, #e8a800 100%);
  border: none; border-radius: 12px; color: #0a0600; font-weight: 900;
  font-family: 'Outfit', sans-serif; cursor: pointer;
  box-shadow: 0 0 28px rgba(245,200,66,.3), 0 4px 16px rgba(0,0,0,.4);
  transition: transform .18s, box-shadow .18s;
}
.ba-btn-gold:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 0 42px rgba(245,200,66,.5), 0 6px 20px rgba(0,0,0,.5); }
.ba-btn-gold:active { transform: scale(.99); }
.ba-btn-gold:disabled { opacity: .35; cursor: not-allowed; transform: none; }

.ba-rarity {
  display: inline-flex; align-items: center; padding: 1px 7px;
  border-radius: 20px; font-size: 9px; font-weight: 800;
  letter-spacing: .08em; text-transform: uppercase;
}
`;

/* ─── Rarity ──────────────────────────────────────────────────────── */
const RARITY = {
  legendary: { color:'#f5c842', bg:'rgba(245,200,66,.1)',  border:'rgba(245,200,66,.3)',  glow:'drop-shadow(0 0 10px rgba(245,200,66,.9)) drop-shadow(0 0 22px rgba(245,200,66,.45))' },
  epic:      { color:'#c084fc', bg:'rgba(192,132,252,.1)', border:'rgba(192,132,252,.3)', glow:'drop-shadow(0 0 10px rgba(192,132,252,.85)) drop-shadow(0 0 20px rgba(192,132,252,.4))' },
  rare:      { color:'#60a5fa', bg:'rgba(96,165,250,.08)', border:'rgba(96,165,250,.25)', glow:'drop-shadow(0 0 10px rgba(96,165,250,.8))' },
  uncommon:  { color:'#34d399', bg:'rgba(52,211,153,.08)', border:'rgba(52,211,153,.25)', glow:'drop-shadow(0 0 8px rgba(52,211,153,.7))' },
  common:    { color:'rgba(255,255,255,.35)', bg:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.1)', glow:'drop-shadow(0 0 5px rgba(161,161,170,.35))' },
};
const rr = r => RARITY[r] || RARITY.common;

const TEAM_PALETTE = [
  { color:'#f5c842', glow:'rgba(245,200,66,.35)',  bg:'rgba(245,200,66,.07)',  border:'rgba(245,200,66,.22)' },
  { color:'#c084fc', glow:'rgba(192,132,252,.35)', bg:'rgba(192,132,252,.07)', border:'rgba(192,132,252,.22)' },
  { color:'#60a5fa', glow:'rgba(96,165,250,.35)',  bg:'rgba(96,165,250,.07)',  border:'rgba(96,165,250,.22)'  },
  { color:'#34d399', glow:'rgba(52,211,153,.35)',  bg:'rgba(52,211,153,.07)',  border:'rgba(52,211,153,.22)'  },
];
const PLAYER_COLORS = ['#f5c842','#c084fc','#60a5fa','#34d399','#f472b6','#fb923c','#22d3ee','#a3e635'];

/* ─── Audio ─────────────────────────────────────────────────────── */
let _ctx = null;
let _keepaliveStarted = false;

const getCtx = () => {
  try {
    const AC = window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!_ctx) _ctx = new AC();
    return _ctx;
  } catch { return null; }
};

const startKeepalive = (c) => {
  if(_keepaliveStarted) return;
  _keepaliveStarted = true;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
  } catch {}
};

const unlockAudio = () => {
  const c = getCtx();
  if(!c) return;
  if(c.state === 'suspended') c.resume();
  try {
    const b = c.createBuffer(1,1,c.sampleRate);
    const s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
  } catch {}
  startKeepalive(c);
};

if(typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudio, {capture:true});
}

let _tick = null;
const stopSpin = () => { if(_tick){ clearTimeout(_tick); _tick=null; } };
const playSpin = (fast) => {
  stopSpin();
  const dur = fast?1500:3100; const t0 = Date.now();
  const tick = () => {
    const c = getCtx();
    if(c && c.state==='running') {
      try {
        const n=c.currentTime;
        const o=c.createOscillator(), g=c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type='triangle';
        o.frequency.setValueAtTime(260+Math.random()*120, n);
        g.gain.setValueAtTime(0.028, n);
        g.gain.exponentialRampToValueAtTime(0.001, n+.065);
        o.start(n); o.stop(n+.065);
      } catch {}
    }
    const el = Date.now()-t0;
    if(el < dur) { const p=el/dur; _tick=setTimeout(tick, 35+p*290); }
  };
  const c = getCtx();
  if(c && c.state==='suspended') { c.resume().then(tick).catch(tick); } else tick();
};

const playReward = () => {
  const c = getCtx(); if(!c) return;
  const run = () => {
    try {
      const n = c.currentTime;
      [[523.25,0],[659.25,.11],[783.99,.22],[1046.5,.34]].forEach(([freq,dt]) => {
        const o=c.createOscillator(), g=c.createGain();
        o.connect(g); g.connect(c.destination); o.type='sine';
        o.frequency.setValueAtTime(freq, n+dt);
        g.gain.setValueAtTime(0, n+dt);
        g.gain.linearRampToValueAtTime(0.16, n+dt+.04);
        g.gain.exponentialRampToValueAtTime(0.001, n+dt+.48);
        o.start(n+dt); o.stop(n+dt+.5);
      });
      [523.25,659.25,783.99].forEach(freq => {
        const o=c.createOscillator(), g=c.createGain();
        o.connect(g); g.connect(c.destination); o.type='triangle';
        o.frequency.setValueAtTime(freq, n+.34);
        g.gain.setValueAtTime(0, n+.34);
        g.gain.linearRampToValueAtTime(0.055, n+.46);
        g.gain.exponentialRampToValueAtTime(0.001, n+1.4);
        o.start(n+.34); o.stop(n+1.4);
      });
    } catch {}
  };
  if(c.state==='suspended') { c.resume().then(run).catch(run); } else run();
};

/* ─── Particles ──────────────────────────────────────────────────── */
const Particles = React.memo(({ accent='#f5c842', count=10 }) => {
  const pts = useRef(Array.from({length:count},(_,i)=>({id:i,left:`${6+Math.random()*88}%`,bottom:`${Math.random()*14}%`,size:1.2+Math.random()*2.2,d:`${3+Math.random()*5}s`,delay:`${-Math.random()*7}s`,dx:`${(Math.random()-.5)*34}px`}))).current;
  return <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>{pts.map(p=><div key={p.id} className="ba-pt" style={{left:p.left,bottom:p.bottom,width:p.size,height:p.size,background:accent,boxShadow:`0 0 ${p.size*3}px ${accent}`,'--d':p.d,'--delay':p.delay,'--dx':p.dx}}/>)}</div>;
});

/* ─── Confetti ───────────────────────────────────────────────────── */
const ConfettiEffect = ({ active }) => {
  const ref = useRef(null);
  useEffect(()=>{
    if(!active)return; const cv=ref.current; if(!cv)return; const ctx=cv.getContext('2d');
    cv.width=window.innerWidth; cv.height=window.innerHeight;
    const ps=Array.from({length:180},()=>({x:Math.random()*cv.width,y:-20,r:3+Math.random()*7,color:['#f5c842','#c084fc','#60a5fa','#34d399','#f472b6','#00e5ff'][Math.floor(Math.random()*6)],vx:(Math.random()-.5)*5,vy:2+Math.random()*4,a:Math.random()*360,va:(Math.random()-.5)*8}));
    let fr; const draw=()=>{ctx.clearRect(0,0,cv.width,cv.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=p.va;if(p.y>cv.height){p.y=-20;p.x=Math.random()*cv.width;}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);ctx.restore();});fr=requestAnimationFrame(draw);};
    draw(); const t=setTimeout(()=>cancelAnimationFrame(fr),5500); return()=>{cancelAnimationFrame(fr);clearTimeout(t);};
  },[active]);
  if(!active)return null;
  return <canvas ref={ref} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999}}/>;
};

/* ─── Stable Avatar ──────────────────────────────────────────────── */
const PlayerAvatar = React.memo(({ player, color, size=38, iconSize=15 }) => {
  const url = safeAvatarUrl(player?.avatar_url);
  const [loaded,setLoaded] = useState(false);
  const [err,setErr]       = useState(false);
  const urlRef = useRef(url);
  useEffect(()=>{ if(urlRef.current!==url){ urlRef.current=url; setLoaded(false); setErr(false); } },[url]);
  const showImg = url&&!err;
  return (
    <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',background:`${color}1e`,border:`2px solid ${color}50`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',flexShrink:0,boxShadow:`0 0 10px ${color}2a`}}>
      {showImg&&<img src={url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:loaded?1:0,transition:'opacity .22s'}} onLoad={()=>setLoaded(true)} onError={()=>setErr(true)}/>}
      <div style={{opacity:showImg&&loaded?0:1,transition:'opacity .22s',display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%'}}>
        {player?.isBot?<Bot style={{width:iconSize,height:iconSize,color}}/>:<User style={{width:iconSize,height:iconSize,color}}/>}
      </div>
    </div>
  );
});

/* ─── Vertical Spinner ───────────────────────────────────────────── */
const VerticalSpinner = ({ items, winnerItem, onDone, fast }) => {
  const H=84,WIN=28,TOTAL=36,VH=252,dur=fast?1.35:2.9,spinMs=fast?1450:3050;
  useEffect(()=>{const t=setTimeout(onDone,spinMs);return()=>clearTimeout(t);},[]);
  const strip=useRef(Array.from({length:TOTAL},(_,i)=>i===WIN?winnerItem:items[Math.floor(Math.random()*items.length)])).current;
  const targetY=-(WIN*H-VH/2+H/2);
  const rc=rr(winnerItem?.rarity);
  return (
    <>
      <div style={{position:'absolute',inset:'0 0',top:'50%',transform:'translateY(-50%)',height:H,zIndex:10,pointerEvents:'none',background:`linear-gradient(180deg,transparent 0%,${rc.bg} 30%,${rc.bg} 70%,transparent 100%)`,borderTop:`1.5px solid ${rc.border}`,borderBottom:`1.5px solid ${rc.color}44`}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:78,zIndex:20,pointerEvents:'none',background:'linear-gradient(to bottom,#04010e 0%,transparent 100%)'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:78,zIndex:20,pointerEvents:'none',background:'linear-gradient(to top,#04010e 0%,transparent 100%)'}}/>
      <motion.div style={{position:'absolute',left:0,right:0,top:0,display:'flex',flexDirection:'column'}} initial={{y:0}} animate={{y:targetY}} transition={{duration:dur,ease:[0.03,0.78,0.14,1]}}>
        {strip.map((item,i)=>{
          const rc2=rr(item?.rarity);
          return (
            <div key={i} style={{height:H,display:'flex',alignItems:'center',gap:10,padding:'0 12px',flexShrink:0}}>
              <div style={{width:52,height:52,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:rc2.bg,border:`1px solid ${rc2.border}`}}>
                {item?.image||item?.image_url?<img src={item.image||item.image_url} alt={item?.name} style={{width:40,height:40,objectFit:'contain',filter:rc2.glow}}/>:<span style={{fontSize:22}}>📦</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:11,color:'rgba(240,234,255,.65)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{item?.name||'---'}</p>
                <span style={{fontSize:13,color:rc2.color,fontWeight:800}}>{item?.value?.toLocaleString()||0}</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </>
  );
};

/* ─── Item Chip ──────────────────────────────────────────────────── */
const ItemChip = React.memo(({ item, index=0 }) => {
  const rc=rr(item?.rarity);
  return (
    <div className="ba-item-in" style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:10,background:rc.bg,border:`1px solid ${rc.border}`,animationDelay:`${index*0.033}s`,borderLeft:`3px solid ${rc.color}`}}>
      <div style={{width:30,height:30,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.25)'}}>
        {item?.image||item?.image_url?<img src={item.image||item.image_url} alt={item?.name} style={{width:24,height:24,objectFit:'contain',filter:rc.glow}}/>:<span style={{fontSize:13}}>📦</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,color:'rgba(240,234,255,.55)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:1}}>{item?.name}</p>
        <p style={{fontSize:11,color:rc.color,fontWeight:800}}>{item?.value?.toLocaleString()}</p>
      </div>
    </div>
  );
});

/* ─── Player Column ──────────────────────────────────────────────── */
const PlayerColumn = ({ player, playerColor:pc, isWinner, wonItems, spinPhase, caseItems, spinnerKey, spinnerItem, magicItem, onSpinDone, onMagicSpinDone, fast, showPct, pct }) => {
  if(!player)return null;
  const total=wonItems.reduce((s,it)=>s+(it?.value||0),0);
  const topItems=caseItems.filter(it=>['epic','legendary'].includes(it.rarity));
  const magicPool=topItems.length>0?topItems:caseItems;
  const isSpinning=spinPhase==='spinning'||spinPhase==='magic_spin';
  const lastItem=wonItems[wonItems.length-1];
  return (
    <div className={`ba-col${isWinner?' ba-winner':''}`} style={{border:`1.5px solid ${isWinner?'rgba(245,200,66,.35)':pc+'28'}`,boxShadow:isWinner?undefined:`0 0 0 1px rgba(0,0,0,.3),inset 0 0 28px rgba(0,0,0,.25)`}}>
      <div style={{height:3,flexShrink:0,background:isWinner?`linear-gradient(90deg,transparent,${pc},rgba(255,255,255,.7),${pc},transparent)`:`linear-gradient(90deg,transparent,${pc}55,transparent)`}}/>
      <div className="ba-scan"/>
      <div className="ba-noise"/>
      {isWinner&&<div style={{position:'absolute',top:0,left:0,right:0,height:110,pointerEvents:'none',background:`radial-gradient(ellipse 70% 60% at 50% 0%,rgba(245,200,66,.1) 0%,transparent 100%)`}}/>}
      <div style={{display:'flex',alignItems:'center',gap:9,padding:'13px 12px 9px',flexShrink:0,position:'relative',zIndex:2}}>
        <PlayerAvatar player={player} color={pc} size={38} iconSize={15}/>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:13,fontWeight:700,color:'#f0eaff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.2}}>{player.name}</p>
          <p style={{fontSize:9,fontWeight:700,color:pc,textTransform:'uppercase',letterSpacing:'.1em',marginTop:1,opacity:.75}}>{player.isBot?'AI Bot':'Player'}</p>
        </div>
        {isWinner
          ? <div style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:20,background:'rgba(245,200,66,.14)',border:'1px solid rgba(245,200,66,.32)'}}>
              <Crown style={{width:10,height:10,color:'#f5c842'}}/><span style={{fontSize:9,fontWeight:800,color:'#f5c842',letterSpacing:'.08em'}}>WIN</span>
            </div>
          : <Shield style={{width:13,height:13,color:pc,opacity:.3,flexShrink:0}}/>}
      </div>
      <div style={{height:1,background:`linear-gradient(90deg,transparent,${pc}28,transparent)`,margin:'0 10px',flexShrink:0}}/>
      <div style={{padding:'9px 12px 7px',flexShrink:0,position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'baseline',gap:4}}>
          <motion.span key={total} initial={{y:-6,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.18}} className="ba-title" style={{fontSize:26,fontWeight:700,color:isWinner?'#f5c842':'#f0eaff',letterSpacing:'.01em',lineHeight:1}}>
            {total.toLocaleString()}
          </motion.span>
          <span style={{fontSize:10,color:'var(--text-dim)',fontWeight:600}}>pts</span>
        </div>
        {wonItems.length>0&&<p style={{fontSize:10,color:'var(--text-dim)',marginTop:2}}>{wonItems.length} item{wonItems.length!==1?'s':''} · avg {Math.round(total/wonItems.length).toLocaleString()}</p>}
      </div>
      {showPct&&(
        <div style={{padding:'0 12px 7px',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
            <span style={{fontSize:9,fontWeight:700,color:pc,textTransform:'uppercase',letterSpacing:'.1em'}}>Win chance</span>
            <span style={{fontSize:9,fontWeight:800,color:pc}}>{Math.round(pct*100)}%</span>
          </div>
          <div style={{height:3,borderRadius:3,background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
            <motion.div style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${pc},${pc}88)`}} initial={{width:'0%'}} animate={{width:`${pct*100}%`}} transition={{duration:.7,ease:'easeOut'}}/>
          </div>
        </div>
      )}
      <div style={{padding:'0 10px 10px',flexShrink:0,position:'relative',zIndex:2}}>
        {spinPhase==='magic_spin'&&<span className="ba-magic-lbl" style={{marginBottom:5}}>✦ Magic Spin ✦</span>}
        <div className="ba-spin-slot">
          {isSpinning&&caseItems.length>0
            ? <VerticalSpinner key={`${spinnerKey}-${spinPhase}`} items={spinPhase==='magic_spin'?magicPool:caseItems} winnerItem={spinPhase==='magic_spin'?magicItem:spinnerItem} onDone={spinPhase==='magic_spin'?onMagicSpinDone:onSpinDone} fast={fast}/>
            : <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
                {lastItem
                  ? <>
                      {lastItem?.image||lastItem?.image_url?<img src={lastItem.image||lastItem.image_url} alt="" style={{width:56,height:56,objectFit:'contain',filter:rr(lastItem?.rarity).glow,opacity:.5}}/>:<span style={{fontSize:34,opacity:.25}}>📦</span>}
                      <div style={{textAlign:'center'}}>
                        <p style={{fontSize:10,color:'var(--text-dim)',fontWeight:500}}>{lastItem?.name}</p>
                        <p style={{fontSize:12,color:rr(lastItem?.rarity).color,fontWeight:800,opacity:.55}}>{lastItem?.value?.toLocaleString()}</p>
                      </div>
                    </>
                  : <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,opacity:.18}}>
                      <Swords style={{width:26,height:26,color:'#9d6fff'}}/>
                      <span style={{fontSize:10,color:'var(--text-dim)',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase'}}>Ready</span>
                    </div>
                }
              </div>
          }
        </div>
      </div>
      <div className="ba-scroll" style={{flex:1,minHeight:0,overflowY:'auto',padding:'0 10px 12px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {wonItems.length===0&&!isSpinning&&<p style={{fontSize:10,color:'var(--text-dim)',textAlign:'center',padding:'8px 0',fontWeight:500}}>No items yet</p>}
          {wonItems.map((item,i)=><ItemChip key={i} item={item} index={i}/>)}
        </div>
      </div>
    </div>
  );
};

/* ─── VS Divider ─────────────────────────────────────────────────── */
const VsDivider = () => (
  <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px',flexShrink:0,alignSelf:'stretch'}}>
    <div style={{width:1,height:'100%',background:'rgba(255,255,255,.05)'}}/>
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:28,height:28,borderRadius:'50%',background:'#07041a',border:'1px solid rgba(255,255,255,.09)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,boxShadow:'0 0 20px rgba(0,0,0,.9)'}}>
      <span className="ba-vs-badge ba-title" style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',display:'block'}}>VS</span>
    </div>
  </div>
);

const ModeBadge = ({icon,color,label}) => (
  <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:20,background:`${color}12`,color,border:`1px solid ${color}2e`,letterSpacing:'.1em',textTransform:'uppercase'}}>{icon} {label}</span>
);

const ModeNotice = ({icon,color,children}) => (
  <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:12,background:`${color}0d`,border:`1px solid ${color}26`}}>
    <span style={{fontSize:15,flexShrink:0}}>{icon}</span>
    <p style={{fontSize:12,color:`${color}c0`,fontWeight:600}}>{children}</p>
  </div>
);

/* ─── Waiting Lobby ──────────────────────────────────────────────── */
const WaitingLobby = ({ battle, players, teams, userEmail, onJoin, onAddBot, onFillBots, balance }) => {
  const maxPlayers=battle.max_players||2;
  const isCreator=battle.creator_email===userEmail;
  const hasJoined=players.some(p=>p&&p.email===userEmail&&!p.isBot);
  const filled=players.filter(p=>p&&p.email).length;
  const wl=teams&&teams.length>0?teams:[Array.from({length:Math.ceil(maxPlayers/2)},(_,i)=>i),Array.from({length:Math.floor(maxPlayers/2)},(_,i)=>i+Math.ceil(maxPlayers/2))];
  return (
    <div style={{position:'relative',overflow:'hidden',borderRadius:20,background:'linear-gradient(145deg,#07041a,#0d0822,#04010f)',border:'1px solid rgba(157,111,255,.16)',padding:'24px 20px',boxShadow:'0 0 80px rgba(157,111,255,.07)'}}>
      <div className="ba-noise"/><div className="ba-scan"/>
      <Particles accent="#9d6fff" count={6}/><Particles accent="#f5c842" count={4}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#9d6fff,#f5c842,transparent)'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(157,111,255,.07) 0%,transparent 60%)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
        <div style={{position:'relative',width:9,height:9,flexShrink:0}}>
          <div className="ba-ring" style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(157,111,255,.4)'}}/>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#9d6fff'}}/>
        </div>
        <span className="ba-title" style={{fontSize:14,fontWeight:700,color:'#c4a3ff',letterSpacing:'.1em',textTransform:'uppercase'}}>Battle Lobby</span>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:7}}>
          <span style={{fontSize:11,color:'var(--text-dim)',fontWeight:500}}>Players</span>
          <span style={{fontSize:13,fontWeight:800,padding:'2px 10px',borderRadius:20,background:'rgba(245,200,66,.1)',color:'#f5c842',border:'1px solid rgba(245,200,66,.22)'}}>{filled}/{maxPlayers}</span>
        </div>
      </div>
      <div style={{position:'relative',zIndex:2,display:'flex',gap:10,alignItems:'stretch',overflowX:'auto'}}>
        {wl.map((memberIndices,ti)=>{
          const pal=TEAM_PALETTE[ti%TEAM_PALETTE.length];
          return (
            <React.Fragment key={ti}>
              <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:10}}>
                {wl.length>1&&<div style={{textAlign:'center'}}><span className="ba-title" style={{fontSize:11,fontWeight:700,padding:'3px 14px',borderRadius:20,background:pal.bg,color:pal.color,border:`1px solid ${pal.border}`,textTransform:'uppercase',letterSpacing:'.1em'}}>Team {ti+1}</span></div>}
                <div style={{display:'flex',gap:10}}>
                  {memberIndices.map(gi=>{
                    const p=players[gi],f=p&&p.email,canJoin=!f&&!hasJoined&&!isCreator;
                    return (
                      <div key={gi} style={{flex:1,minWidth:110,borderRadius:16,background:f?pal.bg:'rgba(255,255,255,.02)',border:`1px solid ${f?pal.border:'rgba(255,255,255,.06)'}`,minHeight:190,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'18px 12px',transition:'border-color .3s,background .3s'}}>
                        {f?(
                          <>
                            <PlayerAvatar player={p} color={pal.color} size={48} iconSize={20}/>
                            <div style={{textAlign:'center'}}>
                              <p style={{fontSize:13,fontWeight:700,color:'#f0eaff'}}>{p.name}</p>
                              {p.isBot&&<p style={{fontSize:9,fontWeight:700,color:pal.color,textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}}>BOT</p>}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,background:'rgba(0,229,160,.09)',border:'1px solid rgba(0,229,160,.22)'}}>
                              <CheckCircle2 style={{width:11,height:11,color:'#00e5a0'}}/><span style={{fontSize:10,fontWeight:700,color:'#00e5a0'}}>Ready</span>
                            </div>
                          </>
                        ):(
                          <>
                            <div style={{width:48,height:48,borderRadius:'50%',border:`2px dashed ${pal.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}><Loader2 style={{width:18,height:18,color:pal.color,opacity:.4}} className="animate-spin"/></div>
                            <p style={{fontSize:11,color:'var(--text-dim)',fontWeight:500,textAlign:'center'}}>Waiting…</p>
                            {canJoin&&<button onClick={onJoin} disabled={battle.entry_cost>balance} className="ba-btn-gold" style={{padding:'8px 20px',fontSize:12}}>Join Battle</button>}
                            {isCreator&&(
                              <div style={{display:'flex',flexDirection:'column',gap:6,width:'100%',padding:'0 4px'}}>
                                <button onClick={onAddBot} className="ba-btn-ghost" style={{padding:'7px 0',fontSize:11,fontWeight:700,gap:5,width:'100%'}}><Bot style={{width:11,height:11}}/> Add Bot</button>
                                <button onClick={onFillBots} className="ba-btn-ghost" style={{padding:'7px 0',fontSize:11,fontWeight:700,gap:5,width:'100%',color:'#f5c842',borderColor:'rgba(245,200,66,.22)'}}>Fill All</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {ti<wl.length-1&&<VsDivider/>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Round label ────────────────────────────────────────────────── */
const RoundLabel = ({ round, total, caseName }) => (
  <motion.div key={round} initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.35}}>
    <div style={{textAlign:'center',padding:'8px 16px',borderRadius:10,background:'rgba(157,111,255,.07)',border:'1px solid rgba(157,111,255,.18)'}}>
      <span className="ba-title" style={{fontSize:12,fontWeight:600,color:'#c4a3ff',letterSpacing:'.16em',textTransform:'uppercase'}}>
        Round {round+1} of {total}{caseName?` · ${caseName}`:''}
      </span>
    </div>
  </motion.div>
);

/* ─── Main ───────────────────────────────────────────────────────── */
export default function BattleArena({ battle, selectedCases, players:rawPlayers, teams, modeLabel, battleModes={}, userEmail, onClose, onReward, onJoin, onAddBot, onFillBots, onBattleUpdated, balance=0 }) {
  const players    = usePlayerAvatars(rawPlayers);
  const totalRounds= selectedCases.length;
  const teamList   = useMemo(()=>teams||[players.map((_,i)=>i)],[teams,players.length]);
  const isWaiting  = battle?.status==='waiting';

  // ── ADDED: provably fair hook — reads committed rolls from battle record ──
  const { rolls: fairRolls, blockHash, blockNum, status: fairStatus } =
    useProvablyFairArena(battle, selectedCases, players, battleModes);

  const [showVerifier, setShowVerifier] = useState(false); // ← ADDED
  // ── END ADDED ──

  const cbRef=useRef(onBattleUpdated); useEffect(()=>{cbRef.current=onBattleUpdated;},[onBattleUpdated]);
  const lastFilled=useRef(-1), lastStatus=useRef('');
  useEffect(()=>{
    if(!isWaiting||!battle?.id)return;
    const poll=async()=>{
      try{
        const {base44}=await import('@/api/base44Client');
        const res=await base44.entities.CaseBattle.filter({id:battle.id});
        const u=res?.[0]; if(!u)return;
        const fc=(u.players||[]).filter(p=>p&&p.email).length, mp=u.max_players||2;
        if(fc!==lastFilled.current||u.status!==lastStatus.current){ lastFilled.current=fc; lastStatus.current=u.status; if(cbRef.current)cbRef.current(u); }
        if(fc>=mp&&u.status==='waiting') await base44.entities.CaseBattle.update(u.id,{status:'in_progress'});
      }catch{}
    };
    const id=setInterval(poll,2000); return()=>clearInterval(id);
  },[isWaiting,battle?.id]);

  const m=battleModes&&typeof battleModes==='object'?battleModes:{};
  const isCrazy=m.crazy,isTerminal=m.terminal,isGroup=m.group,isMagicSpin=m.magic_spin,isFast=m.fast_mode,isJackpot=m.jackpot;

  const [phase,setPhase]     = useState('countdown');
  const [countdown,setCd]    = useState(3);
  const [currentRound,setCR] = useState(0);
  const [playerItems,setPI]  = useState(()=>players.map(()=>[]));
  const [done,setDone]       = useState(false);
  const [jackpot,setJackpot] = useState(false);
  const [winnerTeam,setWT]   = useState(null);
  const [confetti,setConf]   = useState(false);
  const [pPhases,setPP]      = useState(()=>players.map(()=>'idle'));

  const allRolled=useRef(null), roundDone=useRef(0), crRef=useRef(0), rewardGiven=useRef(false);

  // ── ADDED: sync fairRolls into allRolled.current when they arrive ──
  useEffect(() => {
    if (fairRolls) {
      allRolled.current = fairRolls;
    }
  }, [fairRolls]);
  // ── END ADDED ──

  // ── CHANGED: pause countdown until rolls are ready ──
  useEffect(()=>{
    if(isWaiting || phase !== 'countdown' || fairStatus !== 'ready') return; // ← fairStatus check added
    if(countdown===0){setPhase('spinning');launchRound(0);return;}
    const t=setTimeout(()=>setCd(c=>c-1),1000); return()=>clearTimeout(t);
  },[phase,countdown,isWaiting,fairStatus]); // ← fairStatus added to deps

  const launchRound=r=>{ roundDone.current=0; crRef.current=r; setCR(r); setPP(players.map(()=>'spinning')); playSpin(isFast); };
  const handleSpinDone=pi=>{ if(roundDone.current===0)stopSpin(); const r=crRef.current,rolled=allRolled.current[r]; if(rolled[pi].isMagic){setPP(prev=>{const n=[...prev];n[pi]='magic_spin';return n;});}else markDone(pi,r); };
  const handleMagicDone=pi=>{ stopSpin(); markDone(pi,crRef.current); };
  const markDone=(pi,r)=>{
    const rolled=allRolled.current[r];
    setPI(prev=>{const n=[...prev];n[pi]=[...n[pi],rolled[pi].item];return n;});
    setPP(prev=>{const n=[...prev];n[pi]='idle';return n;});
    roundDone.current+=1;
    if(roundDone.current>=players.length){ if(r+1>=totalRounds)setTimeout(()=>isJackpot?setJackpot(true):finishBattle(),isFast?1100:2400); else setTimeout(()=>launchRound(r+1),isFast?1400:4000); }
  };
  const getTotal=pi=>{ if(!allRolled.current)return 0; if(isTerminal)return allRolled.current[totalRounds-1]?.[pi]?.item?.value||0; return allRolled.current.reduce((s,r)=>s+(r[pi]?.item?.value||0),0); };

  const finishBattle=(forced=null)=>{
    let wi; if(forced!==null)wi=forced; else if(isGroup)wi=-1; else{const v=teamList.map(mi=>mi.reduce((s,pi)=>s+getTotal(pi),0)/mi.length);wi=isCrazy?v.indexOf(Math.min(...v)):v.indexOf(Math.max(...v));}
    setWT(wi);setDone(true);setJackpot(false);
    playReward();
    if(!rewardGiven.current){
      rewardGiven.current=true;
      const tv=allRolled.current.reduce((a,rnd)=>a+rnd.reduce((b,r)=>b+(r?.item?.value||0),0),0);
      const upi=players.findIndex(p=>p.email===userEmail);
      if(isGroup){setConf(true);setTimeout(()=>setConf(false),5500);onReward&&onReward(Math.floor(tv/players.length));}
      else if(wi>=0&&teamList[wi]?.includes(upi)){setConf(true);setTimeout(()=>setConf(false),5500);onReward&&onReward(Math.floor(tv/(teamList[wi]?.length||1)));}

      import('@/api/base44Client').then(({ base44: b44 }) => {
        allRolled.current.forEach((rnd, roundIdx) => {
          rnd.forEach((rolled, pi) => {
            const p = players[pi];
            if (!p?.email || p.isBot) return;
            const item = rolled?.item;
            if (!item) return;
            b44.entities.UserInventory.create({
              user_email:     p.email,
              item_name:      item.name,
              item_image_url: item.image || item.image_url || null,
              rarity:         item.rarity,
              value:          item.value,
              source:         'battle_win',
              source_case:    selectedCases[roundIdx]?.name || '',
              status:         'owned',
            }).catch(() => {});
          });
        });
      }).catch(() => {});
    }
  };

  const pTotals  = playerItems.map(its=>its.reduce((s,it)=>s+(it?.value||0),0));
  const tTotals  = teamList.map(mi=>mi.reduce((s,pi)=>s+(pTotals[pi]||0),0));
  const grandPot = (battle?.max_players||players.length)*(battle?.entry_cost||0);
  const allPIs   = teamList.flat();
  const colMap   = {}; allPIs.forEach((pi,i)=>{colMap[pi]=PLAYER_COLORS[i%PLAYER_COLORS.length];});
  const grandTotal = pTotals.reduce((s,v)=>s+v,0);
  const caseItems  = (selectedCases[currentRound]||selectedCases[0])?.items||[];
  const totalItemsVal = allRolled.current?allRolled.current.reduce((a,rnd)=>a+rnd.reduce((b,r)=>b+(r?.item?.value||0),0),0):0;
  let payoutLabel='';
  if(done){ if(isGroup)payoutLabel=`Split: ${Math.floor(totalItemsVal/players.length).toLocaleString()} coins each`; else if(winnerTeam>=0){const wc=teamList[winnerTeam]?.length||1;payoutLabel=wc===1?`Winner takes ${totalItemsVal.toLocaleString()} coins`:`${Math.floor(totalItemsVal/wc).toLocaleString()} coins each`;} }
  const activeModes=[isCrazy&&{icon:'🎭',color:'#f472b6',label:'Crazy'},isTerminal&&{icon:'⚡',color:'#f5c842',label:'Terminal'},isGroup&&{icon:'🔄',color:'#00e5a0',label:'Group'},isMagicSpin&&{icon:'✨',color:'#c084fc',label:'Magic Spin'},isFast&&{icon:'💨',color:'#00e5ff',label:'Fast Mode'},isJackpot&&{icon:'👑',color:'#f5c842',label:'Jackpot'}].filter(Boolean);

  if(isWaiting) return (
    <div className="ba" style={{background:'var(--bg-deep)',minHeight:'100vh',padding:'20px 0 80px'}}>
      <style>{CSS}</style>
      <div style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:18,padding:'0 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} className="ba-btn-ghost" style={{width:34,height:34}}><ArrowLeft style={{width:15,height:15}}/></button>
          <div style={{width:2,height:22,borderRadius:2,background:'linear-gradient(to bottom,#f5c842,#9d6fff)'}}/>
          <Swords style={{width:16,height:16,color:'#f5c842'}}/>
          <span className="ba-title" style={{fontSize:18,fontWeight:700,color:'#f0eaff',letterSpacing:'.04em'}}>Battle Lobby</span>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:12,color:'var(--text-dim)'}}>Entry pot</span>
            <span style={{fontSize:15,fontWeight:800,color:'#f5c842'}}>{(battle.entry_cost*(battle.max_players||2)).toLocaleString()}</span>
            <span style={{fontSize:10,color:'rgba(245,200,66,.5)',fontWeight:600}}>coins</span>
          </div>
        </div>
        {activeModes.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{activeModes.map(m=><ModeBadge key={m.label} {...m}/>)}</div>}
        <WaitingLobby battle={battle} players={players} teams={teams} userEmail={userEmail} onJoin={onJoin} onAddBot={onAddBot} onFillBots={onFillBots} balance={balance}/>
      </div>
    </div>
  );

  return (
    <div className="ba" style={{background:'var(--bg-deep)',minHeight:'100vh',padding:'20px 0 80px',position:'relative'}}>
      <style>{CSS}</style>
      <ConfettiEffect active={confetti}/>

      {/* ── ADDED: Provably Fair verifier modal ── */}
      {showVerifier && (
        <ProvablyFairVerifier
          battle={{ ...battle, eos_block_hash: blockHash, eos_block_num: blockNum }}
          selectedCases={selectedCases}
          players={players}
          battleModes={battleModes}
          onClose={() => setShowVerifier(false)}
        />
      )}
      {/* ── END ADDED ── */}

      <div style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:14,padding:'0 16px'}}>
        <div style={{position:'relative',overflow:'hidden',borderRadius:16,background:'linear-gradient(120deg,#07041a 0%,#0d0822 50%,#060110 100%)',border:'1px solid rgba(157,111,255,.14)',padding:'14px 18px'}}>
          <div className="ba-scan"/><div className="ba-noise"/>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:'35%',background:'radial-gradient(ellipse 80% 100% at 100% 50%,rgba(157,111,255,.09) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <button onClick={onClose} className="ba-btn-ghost" style={{width:30,height:30,flexShrink:0}}><ArrowLeft style={{width:13,height:13}}/></button>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:2,height:16,borderRadius:2,background:'linear-gradient(to bottom,#f5c842,#9d6fff)'}}/>
              <span className="ba-title" style={{fontSize:15,fontWeight:700,color:'#f0eaff',letterSpacing:'.04em'}}>{modeLabel||'1v1 Battle'}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:'rgba(245,200,66,.08)',border:'1px solid rgba(245,200,66,.18)'}}>
              <Trophy style={{width:10,height:10,color:'#f5c842'}}/>
              <span style={{fontSize:12,fontWeight:800,color:'#f5c842'}}>{grandPot.toLocaleString()}</span>
              <span style={{fontSize:9,color:'rgba(245,200,66,.45)',fontWeight:600}}>coins</span>
            </div>
            {activeModes.map(m=><ModeBadge key={m.label} {...m}/>)}

            {/* ── ADDED: Provably Fair button ── */}
            {blockHash && (
              <button
                onClick={() => setShowVerifier(true)}
                style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:8,
                  background:'rgba(0,229,160,.08)', border:'1px solid rgba(0,229,160,.22)',
                  color:'#00e5a0', fontSize:10, fontWeight:800,
                  fontFamily:'Outfit,sans-serif', cursor:'pointer',
                  letterSpacing:'.06em', textTransform:'uppercase',
                }}>
                <Shield style={{width:10,height:10}}/> Provably Fair
              </button>
            )}
            {/* ── END ADDED ── */}

            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5}}>
              {selectedCases.map((_,i)=>(
                <div key={i} className={i===currentRound&&!done?'ba-pip-live':''} style={{height:5,borderRadius:3,transition:'all .35s',width:i===currentRound?22:i<currentRound?15:7,background:i<currentRound?'#9d6fff':i===currentRound?'#f5c842':'rgba(255,255,255,.1)'}}/>
              ))}
              <span style={{fontSize:10,fontWeight:700,color:'var(--text-dim)',marginLeft:4}}>{done?totalRounds:currentRound+1}/{totalRounds}</span>
            </div>
          </div>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:1.5,background:'linear-gradient(90deg,transparent,rgba(245,200,66,.3),rgba(157,111,255,.3),transparent)'}}/>
        </div>

        {isTerminal&&!done&&<ModeNotice icon="⚡" color="#f5c842">Terminal — only the <strong>last round</strong> determines the winner</ModeNotice>}
        {isCrazy&&!done&&<ModeNotice icon="🎭" color="#f472b6">Crazy mode — player with the <strong>lowest</strong> total wins!</ModeNotice>}
        {isGroup&&!done&&<ModeNotice icon="🔄" color="#00e5a0">Group mode — profit is split equally among all players</ModeNotice>}

        {/* ── ADDED: waiting for rolls notice ── */}
        {fairStatus === 'resolving' && !isWaiting && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:12,background:'rgba(0,229,160,.06)',border:'1px solid rgba(0,229,160,.2)'}}>
            <Loader2 style={{width:13,height:13,color:'#00e5a0'}} className="animate-spin"/>
            <span style={{fontSize:12,color:'#00e5a0',fontWeight:600}}>Fetching EOS block · locking outcomes…</span>
          </div>
        )}
        {/* ── END ADDED ── */}

        <AnimatePresence mode="wait">{!done&&<RoundLabel key={currentRound} round={currentRound} total={totalRounds} caseName={selectedCases[currentRound]?.name}/>}</AnimatePresence>

        {jackpot&&<motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><JackpotWheel teamList={teamList} players={players} playerTotals={players.map((_,pi)=>getTotal(pi))} onWinner={wTi=>setTimeout(()=>finishBattle(wTi),800)}/></motion.div>}

        {done&&(
          <div className="ba-win-banner" style={{position:'relative',overflow:'hidden',borderRadius:20,background:'linear-gradient(145deg,#0c0800,#160e00,#080300)',border:'1px solid rgba(245,200,66,.28)',boxShadow:'0 0 0 1px rgba(245,200,66,.07),0 0 90px rgba(245,200,66,.1)',padding:'30px 24px',textAlign:'center'}}>
            <div className="ba-noise"/><Particles accent="#f5c842" count={13}/><Particles accent="#c084fc" count={6}/>
            <div style={{position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse 70% 55% at 50% 0%,rgba(245,200,66,.13) 0%,transparent 65%)'}}/>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#f5c842,#e8a800,transparent)'}}/>
            <div style={{position:'relative',zIndex:2}}>
              <p style={{fontSize:11,fontWeight:700,color:'var(--text-dim)',letterSpacing:'.2em',textTransform:'uppercase',marginBottom:8}}>Battle complete</p>
              <p className="ba-title" style={{fontSize:32,fontWeight:700,color:'#f0eaff',letterSpacing:'.04em',marginBottom:6}}>🏆 Round Over</p>
              {payoutLabel&&<p style={{fontSize:13,color:'#00e5a0',fontWeight:600,marginBottom:26}}>{payoutLabel}</p>}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:26,overflowX:'auto',flexWrap:'wrap'}}>
                {teamList.map((mi,ti)=>{
                  const isW=isGroup||ti===winnerTeam, pal=TEAM_PALETTE[ti%TEAM_PALETTE.length];
                  return (
                    <React.Fragment key={ti}>
                      <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:ti*.14}} style={{opacity:isW?1:.22,display:'flex',flexDirection:'column',alignItems:'center',gap:11}}>
                        {teamList.length>1&&<span className="ba-title" style={{fontSize:11,fontWeight:700,color:pal.color,textTransform:'uppercase',letterSpacing:'.12em'}}>Team {ti+1} · {tTotals[ti]?.toLocaleString()}</span>}
                        <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                          {mi.map(pi=>(
                            <div key={pi} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7,width:66}}>
                              {isW&&<span style={{fontSize:17,marginBottom:1}}>{isGroup?'🎁':'👑'}</span>}
                              <PlayerAvatar player={players[pi]} color={pal.color} size={50} iconSize={21}/>
                              <p style={{fontSize:11,color:'var(--text-mid)',textAlign:'center',width:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{players[pi]?.name}</p>
                              <p className="ba-title" style={{fontSize:17,fontWeight:700,color:isW?'#f5c842':'var(--text-dim)',letterSpacing:'.02em'}}>{pTotals[pi]?.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                      {ti<teamList.length-1&&<div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,.1)',flexShrink:0}}>VS</div>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div style={{marginTop:26}}><button onClick={onClose} className="ba-btn-gold" style={{padding:'13px 52px',fontSize:15}}>Done</button></div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {phase==='countdown'&&(
            <motion.div key="cd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,transition:{duration:.3}}} style={{position:'fixed',inset:0,zIndex:9000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(3,0,13,.94)',gap:34,backdropFilter:'blur(8px)'}}>
              <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 50% at 50% 42%,rgba(157,111,255,.11) 0%,transparent 70%)',pointerEvents:'none'}}/>
              <Particles accent="#f5c842" count={15}/><Particles accent="#9d6fff" count={9}/>
              <div style={{display:'flex',gap:22,flexWrap:'wrap',justifyContent:'center',position:'relative',zIndex:2}}>
                {allPIs.map((pi,idx)=>{
                  const c=PLAYER_COLORS[idx%PLAYER_COLORS.length];
                  return (
                    <motion.div key={pi} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*.1,type:'spring',stiffness:280,damping:22}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:9}}>
                      <div style={{position:'relative'}}><div style={{position:'absolute',inset:-8,borderRadius:'50%',background:`radial-gradient(circle,${c}1e 0%,transparent 70%)`}}/><PlayerAvatar player={players[pi]} color={c} size={54} iconSize={23}/></div>
                      <span style={{fontSize:12,fontWeight:700,color:'rgba(240,234,255,.8)',letterSpacing:'.02em'}}>{players[pi]?.name}</span>
                      <div style={{width:30,height:2.5,borderRadius:2,background:c,boxShadow:`0 0 8px ${c}`}}/>
                    </motion.div>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={countdown} className="ba-cdnum" style={{position:'relative',zIndex:2,fontSize:'8rem',fontWeight:700,color:'#f0eaff',lineHeight:1,fontFamily:'Rajdhani,sans-serif',textShadow:`0 0 80px rgba(157,111,255,.45),0 0 30px rgba(245,200,66,.25)`,letterSpacing:'.02em'}}>
                  {countdown===0?'⚔️':countdown}
                </motion.div>
              </AnimatePresence>
              <span className="ba-title" style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',letterSpacing:'.22em',textTransform:'uppercase',position:'relative',zIndex:2}}>
                {fairStatus==='resolving' ? '🔗 Locking outcomes on EOS…' : countdown>0 ? 'Battle starts in…' : 'Fight!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{display:'flex',gap:8,alignItems:'stretch',width:'100%'}}>
          {teamList.map((mi,ti)=>{
            const pal=TEAM_PALETTE[ti%TEAM_PALETTE.length];
            return (
              <React.Fragment key={ti}>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,minWidth:0}}>
                  {teamList.length>1&&<div style={{textAlign:'center'}}><span className="ba-title" style={{fontSize:10,fontWeight:700,padding:'3px 14px',borderRadius:20,background:pal.bg,color:pal.color,border:`1px solid ${pal.border}`,textTransform:'uppercase',letterSpacing:'.12em'}}>Team {ti+1}{done?` · ${tTotals[ti]?.toLocaleString()}`:''}</span></div>}
                  <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
                    {mi.map(pi=>{
                      const r=crRef.current,rolled=allRolled.current?.[r]?.[pi];
                      return (
                        <PlayerColumn
                          key={pi} player={players[pi]} playerColor={colMap[pi]}
                          isWinner={done&&(isGroup||ti===winnerTeam)}
                          wonItems={playerItems[pi]||[]} spinPhase={pPhases[pi]}
                          caseItems={caseItems} spinnerKey={`${currentRound}-${pi}`}
                          spinnerItem={rolled?.item} magicItem={rolled?.isMagic?rolled.item:null}
                          onSpinDone={()=>handleSpinDone(pi)} onMagicSpinDone={()=>handleMagicDone(pi)}
                          fast={isFast} pct={grandTotal>0?(pTotals[pi]||0)/grandTotal:0} showPct={isJackpot}
                        />
                      );
                    })}
                  </div>
                </div>
                {ti<teamList.length-1&&<VsDivider/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}