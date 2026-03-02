// FULL REVAMPED HOME.JSX
// Includes:
// ✔ Floating 3D cases
// ✔ Clean glass UI
// ✔ Premium gradients
// ✔ Motion smoothing
// ✔ Depth lighting
// ✔ Parallax movement
// ✔ Glow upgrades

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { useWallet } from '../components/game/useWallet'
import { Zap, Trophy, ChevronRight, Star, Sparkles, Box } from 'lucide-react'

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href
const roseImg  = new URL('../assets/Rose Love.png', import.meta.url).href
const vtechImg = new URL('../assets/V-Tech.png', import.meta.url).href

const FLOAT_CASES = [
  { src: vtechImg,  w: 140, right:'4%',  top:'6%',  opacity:.95 },
  { src: irishImg,  w: 100, right:'20%', top:'42%', opacity:.9 },
  { src: roseImg,   w: 120, right:'5%',  top:'60%', opacity:.9 },
  { src: vtechImg,  w: 80,  right:'30%', top:'12%', opacity:.75 },
  { src: irishImg,  w: 90,  right:'34%', top:'68%', opacity:.7 },
]

function FloatingCases() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
      <div className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(7,8,15,1) 0%, rgba(7,8,15,.6) 25%, rgba(7,8,15,0) 55%)"
        }}
      />

      {FLOAT_CASES.map((c, i) => (
        <motion.img
          key={i}
          src={c.src}
          alt=""
          initial={{ y: 40, opacity: 0 }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 3, -2, 0],
            opacity: c.opacity
          }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: c.w,
            right: c.right,
            top: c.top,
            position: 'absolute',
            filter: `
              drop-shadow(0 20px 40px rgba(0,0,0,.8))
              drop-shadow(0 0 30px rgba(56,189,248,.25))
            `
          }}
        />
      ))}
    </div>
  )
}

function DepthLight() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 right-0 w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,.12), transparent 60%)",
          filter: "blur(80px)"
        }}
      />
    </div>
  )
}

export default function Home() {
  const { loading } = useWallet()

  if (loading) return null

  return (
    <div className="space-y-10 pb-16" style={{background:'#07080f',minHeight:'100vh'}}>

      <motion.section
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        transition={{duration:.9}}
        className="relative overflow-hidden rounded-[32px]"
        style={{
          minHeight:360,
          background: `
radial-gradient(circle at 20% 30%, rgba(16,185,129,.18), transparent 45%),
radial-gradient(circle at 80% 70%, rgba(139,92,246,.18), transparent 50%),
linear-gradient(160deg, #0a0f1f 0%, #07080f 60%, #05060c 100%)`
        }}
      >

        <DepthLight />
        <FloatingCases />

        <div className="relative z-10 p-10 max-w-[520px]">

          <motion.div
            initial={{opacity:0,x:-12}}
            animate={{opacity:1,x:0}}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
            style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.22)'}}
          >
            <Sparkles className="w-3 h-3" style={{color:'#10b981'}}/>
            <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#10b981]">Lootverse</span>
          </motion.div>

          <motion.h1
            initial={{opacity:0,y:18}}
            animate={{opacity:1,y:0}}
            className="text-white leading-none mb-4 font-bold"
            style={{fontSize:'clamp(48px,7vw,82px)'}}
          >
            OPEN CASES.<br/>
            <span style={{color:'#10b981'}}>WIN BIG.</span>
          </motion.h1>

          <motion.p
            initial={{opacity:0}}
            animate={{opacity:1}}
            className="text-sm leading-relaxed mb-8"
            style={{color:'#304555',maxWidth:280}}
          >
            Premium loot. Real battles.
          </motion.p>

          <div className="flex gap-3">
            <Link to={createPageUrl('Leaderboard')}>
              <motion.button
                whileHover={{scale:1.05,y:-2}}
                className="px-7 py-3.5 text-white rounded-[18px]"
                style={{
                  background:'linear-gradient(135deg,#10b981 0%,#059669 100%)'
                }}
              >
                <Trophy className="w-4 h-4 inline mr-2"/> LEADERBOARD
              </motion.button>
            </Link>
          </div>

        </div>

      </motion.section>

    </div>
  )
}
