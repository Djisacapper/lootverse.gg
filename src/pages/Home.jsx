import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy } from "lucide-react";

const irishImg = new URL('../assets/Luck Of The Irish.png', import.meta.url).href
const roseImg  = new URL('../assets/Rose Love.png', import.meta.url).href
const vtechImg = new URL('../assets/V-Tech.png', import.meta.url).href

const FLOAT_CASES = [
  { src: vtechImg, size: 160, top: "10%", right: "6%" },
  { src: roseImg, size: 130, top: "55%", right: "10%" },
  { src: irishImg, size: 110, top: "30%", right: "25%" },
]

function FloatingCases() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {FLOAT_CASES.map((c, i) => (
        <motion.img
          key={i}
          src={c.src}
          initial={{ y: 0 }}
          animate={{ y: [0, -25, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity }}
          style={{
            position: "absolute",
            width: c.size,
            top: c.top,
            right: c.right,
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.8))"
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="bg-[#07080f] min-h-screen p-6">

      <div className="relative rounded-3xl overflow-hidden" style={{
        background: `
        radial-gradient(circle at 20% 30%, rgba(16,185,129,.15), transparent 45%),
        radial-gradient(circle at 80% 70%, rgba(139,92,246,.15), transparent 50%),
        linear-gradient(160deg, #0a0f1f 0%, #07080f 60%, #05060c 100%)`
      }}>

        <FloatingCases />

        <div className="relative z-20 p-10 max-w-lg">

          <h1 className="text-white font-bold leading-none mb-4"
            style={{ fontSize: "clamp(48px,7vw,82px)" }}>
            OPEN CASES.<br />
            <span className="text-[#10b981]">WIN BIG.</span>
          </h1>

          <p className="text-sm text-[#3a5166] mb-6">
            Premium loot. Real battles.
          </p>

          <Link to={createPageUrl("Leaderboard")}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-7 py-3.5 text-white rounded-xl flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg,#10b981 0%,#059669 100%)"
              }}
            >
              <Trophy size={16}/> Leaderboard
            </motion.button>
          </Link>

        </div>

      </div>

    </div>
  )
}
