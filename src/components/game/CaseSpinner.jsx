import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getRarityColor, getRarityBorder, getRarityGlow } from './useWallet';
import { Sparkles } from 'lucide-react';

export default function CaseSpinner({ items, result, spinning, onComplete }) {
  const [spinItems, setSpinItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef(null);
  const ITEM_WIDTH = 120;
  const VISIBLE_ITEMS = 40;
  const WINNER_INDEX = 33;

  useEffect(() => {
    if (!items || items.length === 0) return;

    // Build spin strip
    const strip = [];
    for (let i = 0; i < VISIBLE_ITEMS; i++) {
      if (i === WINNER_INDEX && result) {
        strip.push({ ...result, isWinner: true });
      } else {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        strip.push({ ...randomItem, isWinner: false });
      }
    }
    setSpinItems(strip);
  }, [items, result]);

  useEffect(() => {
    if (spinning && spinItems.length > 0 && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const targetOffset = (WINNER_INDEX * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2);
      // Add small random offset for realism
      const jitter = (Math.random() - 0.5) * 40;
      setOffset(targetOffset + jitter);

      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 4200);
      return () => clearTimeout(timer);
    } else {
      setOffset(0);
    }
  }, [spinning, spinItems]);

  if (spinItems.length === 0) {
    return <div className="h-32 glass rounded-2xl animate-pulse" />;
  }

  return (
    <div className="relative">
      {/* Center indicator */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-amber-400 z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-amber-400" />
      </div>

      {/* Spinner container */}
      <div ref={containerRef} className="overflow-hidden rounded-2xl glass border border-white/5 py-4">
        <div className="relative h-28">
          <motion.div
            className="flex gap-2 absolute top-0 left-0"
            animate={{ x: spinning ? -offset : 0 }}
            transition={spinning ? {
              duration: 4,
              ease: [0.15, 0.85, 0.35, 1.0],
            } : { duration: 0.3 }}
          >
            {spinItems.map((item, i) => (
              <div
                key={i}
                className={`flex-shrink-0 rounded-xl border p-2 flex flex-col items-center justify-center transition-all
                  ${item.isWinner && !spinning
                    ? `${getRarityBorder(item.rarity)} bg-gradient-to-b from-white/10 to-transparent shadow-lg ${getRarityGlow(item.rarity)}`
                    : `border-white/5 bg-white/[0.02]`
                  }`}
                style={{ width: ITEM_WIDTH - 8, height: 112 }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)} flex items-center justify-center mb-1.5`}>
                  {item.image_urls?.[0] || item.image_url ? (
                    <img src={item.image_urls?.[0] || item.image_url} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 font-medium truncate w-full text-center">{item.name}</p>
                <p className="text-[9px] text-amber-400/80 font-semibold">{item.value?.toLocaleString()}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Gradient edges */}
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none rounded-l-2xl" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none rounded-r-2xl" />
    </div>
  );
}