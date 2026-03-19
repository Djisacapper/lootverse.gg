import { useRequireAuth } from '@/components/useRequireAuth';
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/game/useWallet';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Swords, Box, RotateCcw, Zap } from 'lucide-react';

/* ══════ HERO IMAGES ══════ */
const vtechImg = 'https://i.imgur.com/doYHRMp.png';
const roseImg  = 'https://i.imgur.com/WVoUpzN.png';
const irishImg = 'https://i.imgur.com/7KIsUqY.png';

/* ══ GAMEMODE IMAGES ══ */
const battlesImg  = 'https://i.imgur.com/vHp8zbU.png';
const casesImg    = 'https://i.imgur.com/WXw330m.png';
const coinflipImg = 'https://i.imgur.com/3AUD8Vu.png';
const crashImg    = 'https://i.imgur.com/53dgn4r.png';

/* ══════════════════════════════════════════════════
   GEM DATA — absolute positions on left & right edge
   Using position:fixed on each gem individually so
   nothing can clip or contain them
   ══════════════════════════════════════════════════ */
/* topPct = percentage of the INITIAL window height, resolved to px once on mount.
   This avoids iOS Safari's "dynamic viewport" jitter where vh units are
   recalculated on every scroll event, making fixed elements bounce. */


const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.lv { font-family: 'Nunito', sans-serif; }

/* ── hero floats ── */
@keyframes hf1{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(0deg)}}
@keyframes hf2{0%,100%{transform:translateY(0) rotate(2deg)}50%{transform:translateY(-18px) rotate(5deg)}}
@keyframes hf3{0%,100%{transform:translateY(0) rotate(1deg)}42%{transform:translateY(-10px) rotate(-2deg)}}
.hfa{animation:hf1 6s ease-in-out infinite}
.hfb{animation:hf2 8s ease-in-out infinite .9s}
.hfc{animation:hf3 7s ease-in-out infinite 1.5s}

/* ── gem floats ── */
@keyframes gfA{0%,100%{transform:translateY(0) rotate(0deg)}40%{transform:translateY(-16px) rotate(9deg) scale(1.04)}72%{transform:translateY(-6px) rotate(-5deg)}}
@keyframes gfB{0%,100%{transform:translateY(0) rotate(0deg)}36%{transform:translateY(-20px) rotate(-11deg) scale(1.05)}68%{transform:translateY(-8px) rotate(6deg)}}
@keyframes gfC{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-18px) rotate(7deg) scale(1.04)}}
@keyframes gfD{0%,100%{transform:translateY(0) rotate(0deg)}46%{transform:translateY(-13px) rotate(-7deg) scale(1.03)}}
@keyframes gfE{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}40%{transform:translateY(-15px) rotate(12deg) scale(1.05)}}
@keyframes gfF{0%,100%{transform:translateY(0) rotate(0deg)}52%{transform:translateY(-22px) rotate(-9deg) scale(1.03)}}

/* gem inner shimmer */
@keyframes gem-shimmer{0%,100%{opacity:.28;transform:rotate(0deg) scale(.82)}50%{opacity:.72;transform:rotate(180deg) scale(1.08)}}
.gs{animation:gem-shimmer 3.2s ease-in-out infinite}

/* ── particles ── */
@keyframes ptcl{0%{transform:translateY(0) translateX(0);opacity:0}8%{opacity:1}88%{opacity:.5}100%{transform:translateY(var(--py)) translateX(var(--px));opacity:0}}
.pt{position:absolute;border-radius:50%;pointer-events:none;animation:ptcl var(--pd) ease-out infinite var(--pdl)}

/* ── live dot ── */
@keyframes live-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.5);opacity:0}}
.live-ring{animation:live-pulse 1.8s ease-out infinite}

/* ── hero scan ── */
@keyframes scan{0%{top:-1px;opacity:0}4%{opacity:.45}92%{opacity:.2}100%{top:100%;opacity:0}}
.scan{position:absolute;left:0;right:0;height:1px;pointer-events:none;z-index:4;
  background:linear-gradient(90deg,transparent,rgba(251,191,36,.14),rgba(200,140,255,.1),transparent);
  animation:scan 10s linear infinite}

/* ── ambient grid ── */
.ambi-grid{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(251,191,36,.024) 1px,transparent 1px),
    linear-gradient(90deg,rgba(251,191,36,.024) 1px,transparent 1px);
  background-size:44px 44px}

/* ── hero title ── */
@keyframes grad-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.title-grad{
  background:linear-gradient(90deg,#fbbf24,#f59e0b,#e879f9,#c084fc,#818cf8,#fbbf24);
  background-size:300% 100%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  animation:grad-shift 5s ease-in-out infinite;
  filter:drop-shadow(0 0 20px rgba(251,191,36,.28));
}

/* ══ GAME CARD ══ */
.gc-img{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;object-position:center;border-radius:inherit;
  filter:grayscale(1) brightness(.3) sepia(.5) hue-rotate(228deg);
  transform:scale(1.03);
  transition:filter .55s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1);
  will-change:filter,transform;
}
.gc-card:hover .gc-img{
  filter:grayscale(0) brightness(.88) saturate(1.15) contrast(1.04);
  transform:scale(1.1);
}
.gc-vignette{
  position:absolute;inset:0;z-index:2;border-radius:inherit;pointer-events:none;
  background:linear-gradient(to top,rgba(2,0,14,.97) 0%,rgba(5,0,20,.62) 32%,rgba(8,0,28,.18) 62%,transparent 100%);
}
.gc-overlay{
  position:absolute;inset:0;z-index:3;border-radius:inherit;pointer-events:none;
  opacity:0;transition:opacity .5s ease;
}
.gc-card:hover .gc-overlay{opacity:1}

@keyframes sheen{0%{transform:translateX(-130%) skewX(-20deg)}100%{transform:translateX(320%) skewX(-20deg)}}
.gc-sheen{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;border-radius:inherit}
.gc-sheen::after{content:'';position:absolute;top:0;bottom:0;width:32%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.055) 40%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.055) 60%,transparent);
  transform:translateX(-130%) skewX(-20deg);opacity:0;transition:opacity .08s}
.gc-card:hover .gc-sheen::after{opacity:1;animation:sheen .8s ease forwards}

.gc-bar{
  position:absolute;top:0;left:0;right:0;height:2px;z-index:9;
  transform:scaleX(0);opacity:0;transform-origin:left;
  transition:transform .42s cubic-bezier(.4,0,.2,1), opacity .28s ease;
}
.gc-card:hover .gc-bar{transform:scaleX(1);opacity:1}

.gc-card{
  position:relative;overflow:hidden;border-radius:20px;cursor:pointer;
  transition:box-shadow .4s ease, transform .3s cubic-bezier(.4,0,.2,1);
}
.gc-card:hover{transform:translateY(-8px) scale(1.016)}

@keyframes badge-pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}50%{box-shadow:0 0 0 5px rgba(124,58,237,0)}}
.badge-live{animation:badge-pulse 2s ease infinite}

@keyframes spin  {to{transform:rotate(360deg)}}
@keyframes spinr {to{transform:rotate(-360deg)}}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:#120020;border-radius:4px}

/* ══ GEM RESPONSIVE ══
   Desktop (≥1100px): gems visible, hugging edges of a ~860px content column
   Tablet (768–1099px): gems smaller, tucked tight to viewport edges
   Mobile (<768px): gems hidden entirely — no room, no clipping issues
*/
.gem-col-wrap {
  display: block;
}
@media (max-width: 767px) {
  .gem-col-wrap {
    display: none !important;
  }
}
`;

/* ══════════════════════════════════════════
   GEM SVG SHAPES
   ══════════════════════════════════════════ */
function DiamondSVG({ id, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1}/>
          <stop offset="52%" stopColor={c2} stopOpacity=".88"/>
          <stop offset="100%" stopColor={c1} stopOpacity=".68"/>
        </linearGradient>
        <linearGradient id={`${id}b`} x1="12%" y1="0%" x2="60%" y2="76%">
          <stop offset="0%" stopColor="rgba(255,255,255,.7)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <radialGradient id={`${id}c`} cx="34%" cy="25%" r="46%">
          <stop offset="0%" stopColor="rgba(255,255,255,.52)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <polygon points="50,4 96,38 76,96 24,96 4,38" fill={`url(#${id}a)`}/>
      <polygon points="50,4 96,38 50,46" fill={`url(#${id}b)`} opacity=".52"/>
      <polygon points="50,4 4,38 50,46" fill="rgba(255,255,255,.07)"/>
      <polygon points="96,38 76,96 50,66 50,46" fill="rgba(0,0,0,.2)"/>
      <polygon points="4,38 24,96 50,66 50,46" fill="rgba(255,255,255,.05)"/>
      <polygon points="50,46 50,66 76,96 24,96" fill="rgba(0,0,0,.11)"/>
      <ellipse cx="36" cy="24" rx="11" ry="7" fill={`url(#${id}c)`} className="gs"/>
      <circle cx="50" cy="4" r="2.4" fill="rgba(255,255,255,.92)"/>
      <circle cx="86" cy="26" r="1.2" fill="rgba(255,255,255,.48)"/>
    </svg>
  );
}

function HexSVG({ id, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <radialGradient id={`${id}b`} cx="32%" cy="26%" r="44%">
          <stop offset="0%" stopColor="rgba(255,255,255,.58)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <polygon points="50,4 82,18 96,50 82,82 50,96 18,82 4,50 18,18" fill={`url(#${id}a)`}/>
      <polygon points="50,4 82,18 50,34 18,18" fill="rgba(255,255,255,.14)"/>
      <polygon points="82,18 96,50 66,50 50,34" fill="rgba(255,255,255,.06)"/>
      <polygon points="4,50 18,18 50,34 50,66" fill="rgba(255,255,255,.04)"/>
      <polygon points="50,34 66,50 82,82 18,82 34,50" fill="rgba(0,0,0,.14)"/>
      <ellipse cx="34" cy="27" rx="12" ry="7" fill={`url(#${id}b)`} className="gs"/>
      <circle cx="50" cy="4" r="2" fill="rgba(255,255,255,.9)"/>
      <circle cx="96" cy="50" r="1.3" fill="rgba(255,255,255,.44)"/>
    </svg>
  );
}

function MarquiseSVG({ id, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}a`} x1="14%" y1="0%" x2="86%" y2="100%">
          <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <radialGradient id={`${id}b`} cx="35%" cy="26%" r="42%">
          <stop offset="0%" stopColor="rgba(255,255,255,.62)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <path d="M50,5 Q95,50 50,95 Q5,50 50,5 Z" fill={`url(#${id}a)`}/>
      <path d="M50,5 Q95,50 50,50 Q26,30 50,5 Z" fill="rgba(255,255,255,.1)"/>
      <path d="M50,50 Q95,50 50,95 Q26,72 50,50 Z" fill="rgba(0,0,0,.15)"/>
      <ellipse cx="35" cy="29" rx="12" ry="7" fill={`url(#${id}b)`} className="gs"/>
      <circle cx="50" cy="5" r="2.2" fill="rgba(255,255,255,.9)"/>
      <circle cx="50" cy="95" r="2.2" fill="rgba(255,255,255,.5)"/>
    </svg>
  );
}

function OvalSVG({ id, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <defs>
        <radialGradient id={`${id}a`} cx="38%" cy="33%" r="54%">
          <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
        </radialGradient>
        <radialGradient id={`${id}b`} cx="30%" cy="24%" r="37%">
          <stop offset="0%" stopColor="rgba(255,255,255,.66)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id}a)`}/>
      {[0,60,120,180,240,300].map(a=>{
        const r=a*Math.PI/180;
        return <line key={a} x1="50" y1="50" x2={50+46*Math.cos(r)} y2={50+46*Math.sin(r)} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>;
      })}
      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <circle cx="50" cy="50" r="46" fill={`url(#${id}b)`}/>
      <circle cx="32" cy="25" r="6" fill="rgba(255,255,255,.38)"/>
      <circle cx="62" cy="60" r="2.8" fill="rgba(255,255,255,.18)"/>
    </svg>
  );
}

const SHAPE_MAP = { diamond: DiamondSVG, hex: HexSVG, marquise: MarquiseSVG, oval: OvalSVG };

/* ══════════════════════════════════════════
   RESPONSIVE GEM POSITIONING HOOK
   Returns current breakpoint: 'desktop' | 'tablet' | 'mobile'
   ══════════════════════════════════════════ */
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1100) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      if (w < 768) setBp('mobile');
      else if (w < 1100) setBp('tablet');
      else setBp('desktop');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

/* Single fixed gem — topPx is a resolved pixel number (never vh/%) so iOS
   Safari's dynamic-viewport recalc during scroll can't make gems jump */
function FixedGem({ shape, size, c1, c2, glow, topPx, side, offsetPx, anim }) {
  const id = useRef(`g${Math.random().toString(36).slice(2,8)}`).current;
  const ShapeSVG = SHAPE_MAP[shape];

  const posStyle = side === 'left'
    ? { left: offsetPx }
    : { right: offsetPx };

  return (
    <div style={{
      position: 'fixed',
      top: topPx,
      ...posStyle,
      width:  size,
      height: size,
      pointerEvents: 'none',
      zIndex: 9999,
      animation: anim,
      willChange: 'transform',
      overflow: 'visible',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        filter: `drop-shadow(0 0 ${Math.round(size*.35)}px ${glow}) drop-shadow(0 ${Math.round(size*.08)}px ${Math.round(size*.2)}px rgba(0,0,0,.6))`,
        overflow: 'visible',
      }}>
        <ShapeSVG id={id} c1={c1} c2={c2}/>
      </div>
    </div>
  );
}

/* Left & right gem columns — responsive */
function GemColumns() {
  const bp = useBreakpoint();

  // Resolve vh percentages → px once on mount using the *initial* window height.
  // We snapshot it immediately and never update it — this is intentional so that
  // iOS Safari's shrinking/growing viewport bar during scroll has zero effect.
  const vhPx = useRef(
    typeof window !== 'undefined' ? window.innerHeight / 100 : 8
  ).current;

  // Hide on mobile entirely (CSS also hides, this is belt+suspenders)
  if (bp === 'mobile') return null;

  const getGemProps = (gem, side) => {
    const scale = bp === 'tablet' ? 0.55 : 1;
    const scaledSize = Math.round(gem.size * scale);

    // Convert topPct → locked pixel value
    const topPx = Math.round(gem.topPct * vhPx);

    let offsetPx;
    if (bp === 'desktop') {
      if (side === 'left') {
        offsetPx = `calc((100vw - 860px) / 2 - ${Math.round(scaledSize * 0.5)}px)`;
      } else {
        offsetPx = `calc((100vw - 860px) / 2 - ${Math.round(scaledSize * 0.5)}px)`;
      }
    } else {
      // Tablet: gems peek from the very edge, half off screen
      offsetPx = `${-Math.round(scaledSize * 0.3)}px`;
    }

    return { ...gem, size: scaledSize, topPx, offsetPx };
  };

  return (
    <div className="gem-col-wrap">
      {GEM_LEFT.map((g, i) => {
        const props = getGemProps(g, 'left');
        return <FixedGem key={`L${i}`} {...props} side="left" />;
      })}
      {GEM_RIGHT.map((g, i) => {
        const props = getGemProps(g, 'right');
        return <FixedGem key={`R${i}`} {...props} side="right" />;
      })}
    </div>
  );
}

/* ══ PARTICLES ══ */
function Particles({ accent, count = 10 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id:i, left:`${5+Math.random()*90}%`, bottom:`${Math.random()*18}%`,
    size:1.2+Math.random()*2.2, pd:`${3+Math.random()*5}s`,
    pdl:`${-Math.random()*6}s`, px:`${(Math.random()-.5)*45}px`,
    py:`-${48+Math.random()*75}px`,
  }))).current;
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {pts.map(p=>(
        <div key={p.id} className="pt" style={{
          left:p.left,bottom:p.bottom,width:p.size,height:p.size,
          background:accent,boxShadow:`0 0 ${p.size*4}px ${accent}`,
          '--pd':p.pd,'--pdl':p.pdl,'--px':p.px,'--py':p.py,
        }}/>
      ))}
    </div>
  );
}

/* ══ HERO ══ */
function HeroBanner() {
  return (
    <motion.div initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
      transition={{duration:.78,ease:[.22,1,.36,1]}}
      style={{position:'relative',overflow:'hidden',borderRadius:22,
        background:'linear-gradient(130deg,#040010 0%,#0b001e 35%,#170035 65%,#060014 100%)',
        minHeight:260,
        boxShadow:'0 0 0 1px rgba(251,191,36,.09),0 28px 88px rgba(0,0,0,.96),inset 0 1px 0 rgba(255,255,255,.03)'}}>
      <div className="ambi-grid"/>
      <div className="scan"/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse 58% 80% at 70% 50%,rgba(100,25,195,.26) 0%,transparent 62%),' +
                   'radial-gradient(ellipse 30% 40% at 88% 8%,rgba(251,191,36,.1) 0%,transparent 52%)'}}/>
      <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
        <Particles accent="#fbbf24" count={9}/>
        <Particles accent="#a855f7" count={7}/>
      </div>
      <img src={vtechImg} alt="" className="hfa" style={{position:'absolute',right:'27%',top:'5%',width:126,pointerEvents:'none',
        filter:'drop-shadow(0 0 24px rgba(168,85,247,.88)) drop-shadow(0 12px 36px rgba(0,0,0,.95))'}}/>
      <img src={roseImg}  alt="" className="hfb" style={{position:'absolute',right:'6%', top:'10%',width:144,pointerEvents:'none',
        filter:'drop-shadow(0 0 24px rgba(251,191,36,.8)) drop-shadow(0 12px 36px rgba(0,0,0,.95))'}}/>
      <img src={irishImg} alt="" className="hfc" style={{position:'absolute',right:'17%',bottom:'6%',width:106,pointerEvents:'none',
        filter:'drop-shadow(0 0 19px rgba(251,191,36,.68)) drop-shadow(0 10px 32px rgba(0,0,0,.95))'}}/>
      <div className="hfa" style={{position:'absolute',right:'44%',top:'9%',width:46,height:46,
        background:'radial-gradient(circle at 35% 35%,#e9d5ff,#7c3aed)',
        clipPath:'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
        filter:'drop-shadow(0 0 15px rgba(168,85,247,.88))',animationDelay:'.4s'}}/>
      <div className="hfc" style={{position:'absolute',right:'50%',bottom:'14%',width:36,height:36,
        background:'radial-gradient(circle at 35% 30%,#fde68a,#b45309)',borderRadius:'50%',
        filter:'drop-shadow(0 0 11px rgba(251,191,36,.88))',animationDelay:'1s'}}/>
      <div style={{position:'relative',zIndex:10,padding:'46px 48px'}}>
        <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.2}}
          style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:18,
            background:'rgba(251,191,36,.065)',border:'1px solid rgba(251,191,36,.18)',
            borderRadius:100,padding:'4px 14px 4px 10px'}}>
          <div style={{position:'relative',width:7,height:7}}>
            <div className="live-ring" style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(251,191,36,.38)'}}/>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#fbbf24',boxShadow:'0 0 10px #fbbf24'}}/>
          </div>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:'.18em',color:'rgba(251,191,36,.68)',textTransform:'uppercase'}}>Live Now</span>
        </motion.div>
        <motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
          transition={{delay:.24,duration:.8,ease:[.22,1,.36,1]}}
          style={{margin:0,lineHeight:1.07,marginBottom:13}}>
          <span style={{display:'block',fontSize:'clamp(28px,3.6vw,44px)',fontWeight:900,color:'#fff',
            textShadow:'0 2px 22px rgba(0,0,0,.65)'}}>Welcome To</span>
          <span className="title-grad" style={{display:'block',fontSize:'clamp(32px,4.2vw,50px)',fontWeight:900}}>Amethystgg!</span>
        </motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.38}}
          style={{fontSize:13,color:'rgba(255,255,255,.36)',lineHeight:1.72,marginBottom:30,maxWidth:305,fontWeight:400}}>
          Step into a world of magic, luck, and excitement where every unbox and battle brings you closer to{' '}
          <span style={{color:'#fbbf24',fontWeight:700}}>amazing rewards.</span>
        </motion.p>
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.5}}
          style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link to={createPageUrl('Leaderboard')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'12px 24px',borderRadius:12,border:'none',cursor:'pointer',
                fontSize:14,fontWeight:800,color:'#000',fontFamily:'Nunito,sans-serif',
                background:'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#fde68a 100%)',
                boxShadow:'0 0 36px rgba(251,191,36,.46),0 4px 18px rgba(0,0,0,.55)'}}>
              <Trophy style={{width:15,height:15}}/> View Leaderboard
            </motion.button>
          </Link>
          <Link to={createPageUrl('Cases')}>
            <motion.button whileHover={{scale:1.05,y:-2}} whileTap={{scale:.96}}
              style={{display:'flex',alignItems:'center',gap:7,padding:'12px 24px',borderRadius:12,cursor:'pointer',
                fontSize:14,fontWeight:800,color:'rgba(251,191,36,.86)',fontFamily:'Nunito,sans-serif',
                background:'rgba(251,191,36,.065)',border:'1px solid rgba(251,191,36,.2)'}}>
              Open Cases <ChevronRight style={{width:15,height:15}}/>
            </motion.button>
          </Link>
        </motion.div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:1.5,
        background:'linear-gradient(90deg,transparent,rgba(251,191,36,.5),rgba(168,85,247,.42),transparent)',pointerEvents:'none'}}/>
    </motion.div>
  );
}

/* ══ GAME DATA ══ */
const GAMES = [
  {
    name:'Battles', page:'Battles', icon:Swords,
    img: battlesImg, accent:'#c084fc',
    overlay:'linear-gradient(150deg,rgba(192,132,252,.22) 0%,rgba(251,191,36,.11) 55%,rgba(76,29,149,.2) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#c084fc 18%,#fbbf24 50%,#c084fc 82%,transparent)',
    sd:'0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    sh:'0 0 0 1.5px rgba(192,132,252,.62), 0 18px 52px rgba(0,0,0,.92), 0 0 44px rgba(192,132,252,.26), 0 0 90px rgba(251,191,36,.07)',
    tag:'HOT', tagBg:'linear-gradient(135deg,#fbbf24,#f59e0b)', tagColor:'#000',
  },
  {
    name:'Cases', page:'Cases', icon:Box,
    img: casesImg, accent:'#fbbf24',
    overlay:'linear-gradient(150deg,rgba(251,191,36,.2) 0%,rgba(192,132,252,.1) 55%,rgba(120,50,0,.2) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#fbbf24 18%,#c084fc 50%,#fbbf24 82%,transparent)',
    sd:'0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    sh:'0 0 0 1.5px rgba(251,191,36,.62), 0 18px 52px rgba(0,0,0,.92), 0 0 44px rgba(251,191,36,.26), 0 0 90px rgba(192,132,252,.07)',
    tag:'NEW', tagBg:'#7c3aed', tagColor:'#fff',
  },
  {
    name:'Coinflip', page:'Coinflip', icon:RotateCcw,
    img: coinflipImg, accent:'#fbbf24',
    overlay:'linear-gradient(150deg,rgba(251,191,36,.2) 0%,rgba(124,58,237,.13) 55%,rgba(76,29,149,.18) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#fbbf24 18%,#a855f7 50%,#fbbf24 82%,transparent)',
    sd:'0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    sh:'0 0 0 1.5px rgba(251,191,36,.58), 0 18px 52px rgba(0,0,0,.92), 0 0 40px rgba(251,191,36,.22), 0 0 80px rgba(168,85,247,.07)',
  },
  {
    name:'Crash', page:'Crash', icon:Zap,
    img: crashImg, accent:'#a855f7',
    overlay:'linear-gradient(150deg,rgba(168,85,247,.24) 0%,rgba(251,191,36,.11) 55%,rgba(76,29,149,.22) 100%)',
    barGrad:'linear-gradient(90deg,transparent,#a855f7 18%,#fbbf24 50%,#a855f7 82%,transparent)',
    sd:'0 0 0 1px rgba(255,255,255,.055), 0 14px 44px rgba(0,0,0,.92)',
    sh:'0 0 0 1.5px rgba(168,85,247,.6), 0 18px 52px rgba(0,0,0,.92), 0 0 40px rgba(168,85,247,.24), 0 0 80px rgba(251,191,36,.07)',
    tag:'LIVE', tagBg:'rgba(124,58,237,.9)', tagColor:'#fff',
  },
];

/* ══ GAME CARD ══ */
function GameCard({ g, i, height }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{opacity:0,y:26,scale:.95}}
      animate={{opacity:1,y:0,scale:1}}
      transition={{delay:.08+i*.1,duration:.66,ease:[.22,1,.36,1]}}>
      <Link to={createPageUrl(g.page)}>
        <div className="gc-card"
          onMouseEnter={()=>setHov(true)}
          onMouseLeave={()=>setHov(false)}
          style={{height, boxShadow:hov?g.sh:g.sd}}>
          <img src={g.img} alt={g.name} className="gc-img"/>
          <div className="gc-vignette"/>
          <div className="gc-overlay" style={{background:g.overlay}}/>
          <div className="gc-sheen"/>
          <div className="gc-bar" style={{background:g.barGrad}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:10,
            padding:height>200?'32px 22px 20px':'24px 20px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'center',
                width:height>200?32:28, height:height>200?32:28,
                borderRadius:height>200?10:8,
                background:`linear-gradient(135deg,${g.accent}1e,${g.accent}42)`,
                border:`1px solid ${g.accent}4e`,
                backdropFilter:'blur(10px)',
                flexShrink:0,
                transition:'transform .44s ease',
                transform:hov?'rotate(360deg)':'rotate(0deg)',
              }}>
                <g.icon style={{width:height>200?15:13,height:height>200?15:13,color:g.accent}}/>
              </div>
              <span style={{fontSize:height>200?18:15,fontWeight:900,color:'#fff',letterSpacing:'.01em',
                textShadow:'0 2px 14px rgba(0,0,0,.95),0 0 32px rgba(0,0,0,.6)'}}>{g.name}</span>
              {g.tag&&(
                <span className={g.tag==='LIVE'?'badge-live':''} style={{
                  fontSize:9,fontWeight:800,letterSpacing:'.15em',textTransform:'uppercase',
                  color:g.tagColor,background:g.tagBg,borderRadius:6,padding:'2px 9px',flexShrink:0,
                }}>{g.tag}</span>
              )}
            </div>
          </div>
          <div style={{
            position:'absolute',top:14,right:16,zIndex:9,
            width:5,height:5,borderRadius:'50%',
            background:g.accent,boxShadow:`0 0 10px 3px ${g.accent}`,
            opacity:hov?.88:0,transition:'opacity .32s ease',
          }}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══ SECTION HEAD ══ */
function SectionHead() {
  return (
    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:.26}}
      style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
      <div style={{width:3,height:22,borderRadius:3,
        background:'linear-gradient(to bottom,#fbbf24,#a855f7)',
        boxShadow:'0 0 12px rgba(251,191,36,.38)'}}/>
      <Zap style={{width:16,height:16,color:'#fbbf24'}}/>
      <span style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'.01em'}}>Magic Games</span>
    </motion.div>
  );
}

/* ══ MAIN ══ */
export default function Home() {
  const { loading } = useWallet();
  useRequireAuth();

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',background:'#030009'}}>
      <div style={{position:'relative',width:52,height:52}}>
        <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid #fbbf24',animation:'spin 1s linear infinite'}}/>
        <div style={{position:'absolute',inset:7,borderRadius:'50%',border:'2px solid #a855f7',animation:'spinr .72s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#fbbf24',boxShadow:'0 0 16px #fbbf24'}}/>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lv" style={{
      background:'#030009',
      backgroundImage:
        'radial-gradient(ellipse 62% 40% at 10% 0%,rgba(85,15,185,.17) 0%,transparent 60%),' +
        'radial-gradient(ellipse 48% 32% at 90% 100%,rgba(185,115,0,.11) 0%,transparent 55%)',
      minHeight:'100vh',
      padding:'24px 0 90px',
      position:'relative',
    }}>
      <style>{CSS}</style>

      {/* Gems rendered first, individually fixed — responsive via hook + CSS */}
      <GemColumns/>

      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:32}}>
        <HeroBanner/>
        <section>
          <SectionHead/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {GAMES.map((g,i)=>(
              <GameCard key={g.name} g={g} i={i} height={210}/>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
