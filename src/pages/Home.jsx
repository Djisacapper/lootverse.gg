import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

/* ── Images ── */
const battlesImg  = 'https://i.imgur.com/vHp8zbU.png';
const casesImg    = 'https://i.imgur.com/WXw330m.png';
const upgraderImg = 'https://i.imgur.com/53dgn4r.png';
const heroShipImg = 'https://i.imgur.com/doYHRMp.png';

/* ── CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.bw-root {
  font-family: 'Barlow', sans-serif;
  background: #0f1118;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #fff;
}

/* ── TOP NAV ── */
.bw-nav {
  height: 56px;
  background: #181b26;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 0;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.bw-logo {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .08em;
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 32px;
  flex-shrink: 0;
}

.bw-logo-x {
  color: #f5a623;
  font-style: italic;
}

.bw-nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.bw-nav-link {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  transition: color .15s, background .15s;
}
.bw-nav-link:hover {
  color: #fff;
  background: rgba(255,255,255,0.06);
}
.bw-nav-link.active {
  color: #fff;
}

.bw-nav-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.bw-signin-btn {
  margin-left: auto;
  padding: 8px 20px;
  border-radius: 6px;
  background: #f5a623;
  color: #111;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: opacity .15s, transform .15s;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.bw-signin-btn:hover { opacity: .88; transform: translateY(-1px); }

/* ── BODY (chat + content) ── */
.bw-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── CHAT SIDEBAR ── */
.bw-chat {
  width: 220px;
  flex-shrink: 0;
  background: #14161f;
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
}

.bw-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}

.bw-chat-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
}

.bw-online {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
}

.bw-online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.bw-rain-pot {
  margin: 10px 10px 6px;
  padding: 8px 10px;
  background: #1e2030;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.bw-rain-timer {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #f5a623;
}
.bw-rain-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 8px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: .1em;
}
.bw-rain-amount {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #2a2d3e;
  border-radius: 6px;
  padding: 4px 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #f5a623;
}

.bw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.bw-messages::-webkit-scrollbar { width: 2px; }
.bw-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

.bw-msg {
  padding: 5px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bw-msg-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bw-msg-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #fff;
}
.bw-msg-level {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #3a3d52;
  border-radius: 3px;
  padding: 1px 4px;
  flex-shrink: 0;
}
.bw-msg-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bw-msg-time {
  margin-left: auto;
  font-size: 9px;
  color: rgba(255,255,255,0.2);
  flex-shrink: 0;
}
.bw-msg-text {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  padding-left: 28px;
  line-height: 1.4;
  word-break: break-word;
}

.bw-chat-login {
  flex-shrink: 0;
  padding: 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.bw-chat-login-btn {
  width: 100%;
  padding: 9px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .15s;
}
.bw-chat-login-btn:hover { background: rgba(255,255,255,0.08); }

/* ── MAIN CONTENT ── */
.bw-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.bw-main::-webkit-scrollbar { width: 3px; }
.bw-main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

/* ── HERO ── */
.bw-hero {
  border-radius: 12px;
  background: linear-gradient(135deg, #1a2340 0%, #0f1520 50%, #1a1a2e 100%);
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
}

.bw-hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 75% 50%, rgba(20,60,120,0.5) 0%, transparent 60%),
    radial-gradient(ellipse 40% 60% at 85% 20%, rgba(245,166,35,0.12) 0%, transparent 50%);
  pointer-events: none;
}

.bw-hero-content {
  position: relative;
  z-index: 2;
  padding: 36px 40px;
  max-width: 360px;
}

.bw-hero-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 42px;
  font-weight: 900;
  letter-spacing: .04em;
  line-height: 1;
  color: #f5a623;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.bw-hero-sub {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: .06em;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  margin-bottom: 24px;
}

.bw-hero-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 28px;
  border-radius: 6px;
  background: #f5a623;
  color: #111;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity .15s, transform .15s;
}
.bw-hero-btn:hover { opacity: .88; transform: translateY(-1px); }

.bw-hero-img {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 90%;
  object-fit: contain;
  object-position: right bottom;
  opacity: 0.9;
  pointer-events: none;
  z-index: 1;
  filter: drop-shadow(0 0 40px rgba(245,166,35,0.3));
}

/* floating coins in hero */
@keyframes coin-float {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-12px) rotate(8deg); }
}
.bw-hero-coin {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5a623, #e08c00);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7a4500;
  font-weight: 900;
  font-size: 14px;
  box-shadow: 0 4px 20px rgba(245,166,35,0.5);
  z-index: 2;
  animation: coin-float var(--dur, 4s) ease-in-out infinite var(--delay, 0s);
}

/* ── SECTION LABEL ── */
.bw-section-label {
  display: inline-flex;
  align-items: center;
  gap: 0;
}
.bw-section-label-text {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: #fff;
  background: #f5a623;
  padding: 6px 18px;
  border-radius: 4px;
}

/* ── GAME CARDS ── */
.bw-games-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.bw-game-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  height: 200px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform .25s, box-shadow .25s;
  text-decoration: none;
}
.bw-game-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.6); }

.bw-game-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .4s;
  filter: brightness(0.45) saturate(0.7);
}
.bw-game-card:hover .bw-game-card-img {
  transform: scale(1.06);
  filter: brightness(0.6) saturate(0.85);
}

.bw-game-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
}

.bw-game-card-name {
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0,0,0,0.9);
}

/* ── LIVE WINS ── */
.bw-live-header {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.bw-tabs {
  display: flex;
  gap: 1px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
  padding: 3px;
}

.bw-tab {
  padding: 6px 18px;
  border-radius: 4px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all .15s;
}
.bw-tab.active {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.bw-wins-table {
  background: #14161f;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.05);
  overflow: hidden;
}

.bw-wins-thead {
  display: grid;
  grid-template-columns: 1.4fr 1.6fr 1.2fr 1fr 1fr;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.bw-wins-th {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
}

.bw-wins-row {
  display: grid;
  grid-template-columns: 1.4fr 1.6fr 1.2fr 1fr 1fr;
  padding: 11px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  align-items: center;
  transition: background .12s;
}
.bw-wins-row:hover { background: rgba(255,255,255,0.025); }
.bw-wins-row:last-child { border-bottom: none; }

.bw-wins-mode {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}

.bw-wins-user {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bw-wins-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bw-wins-lvl {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #2e3147;
  border-radius: 3px;
  padding: 1px 4px;
}
.bw-wins-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.bw-coin-val {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
}
.bw-coin-val.profit { color: #f5a623; }
.bw-coin-val.hot { color: #4ade80; }

.bw-coin-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5a623, #e08c00);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(245,166,35,0.4);
}

.bw-mult {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .04em;
}
.bw-mult.normal { color: rgba(255,255,255,0.3); }
.bw-mult.hot    { color: #4ade80; }

/* ── FOOTER ── */
.bw-footer {
  background: #0c0e16;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 48px 60px 28px;
}
.bw-footer-inner {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 36px;
}
.bw-footer-logo {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .08em;
  color: #fff;
  margin-bottom: 12px;
}
.bw-footer-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  line-height: 1.7;
  max-width: 260px;
}
.bw-footer-col-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: #f5a623;
  margin-bottom: 14px;
}
.bw-footer-link {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  text-decoration: none;
  margin-bottom: 8px;
  transition: color .15s;
}
.bw-footer-link:hover { color: rgba(255,255,255,0.8); }
.bw-footer-link-icon { width: 12px; height: 12px; opacity: 0.6; }
.bw-footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 20px;
  text-align: center;
  font-size: 10px;
  color: rgba(255,255,255,0.18);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: .08em;
}

@media (max-width: 900px) {
  .bw-chat { display: none; }
  .bw-games-grid { grid-template-columns: 1fr 1fr; }
  .bw-wins-thead, .bw-wins-row { grid-template-columns: 1.2fr 1.4fr 1fr 1fr; }
  .bw-wins-thead > *:nth-child(3),
  .bw-wins-row > *:nth-child(3) { display: none; }
}
`;

/* ── Mock chat messages ── */
const CHAT_MSGS = [
  { id:1, name:'Nemezis', level:23, color:'#c084fc', text:'Spinning my jackpot!', time:'09:35' },
  { id:2, name:'milogpt', level:17, color:'#f87171', text:'love this site so much', time:'09:35' },
  { id:3, name:'milogpt', level:17, color:'#f87171', text:'gotta hit x200 or idk', time:'09:35' },
  { id:4, name:'Nemezis', level:23, color:'#c084fc', text:'Spinning my jackpot!', time:'09:35' },
  { id:5, name:'adriano', level:74, color:'#fbbf24', text:'$200+ coinflip anyone????', time:'09:35' },
  { id:6, name:'Nemezis', level:23, color:'#c084fc', text:'Spinning my jackpot!', time:'09:35' },
  { id:7, name:'milogpt', level:17, color:'#f87171', text:'$$$$', time:'09:35' },
  { id:8, name:'adriano', level:74, color:'#fbbf24', text:'bruh tfff', time:'09:35' },
  { id:9, name:'milogpt', level:17, color:'#f87171', text:'gotta hit x200 or idk', time:'09:35' },
  { id:10, name:'adriano', level:74, color:'#fbbf24', text:'$200+ coinflip anyone????', time:'09:35' },
  { id:11, name:'Nemezis', level:23, color:'#c084fc', text:'love this site', time:'09:35' },
];

/* ── Mock live wins ── */
const LIVE_WINS = [
  { mode:'Battles',  user:'NEMEZIS',  level:23, color:'#c084fc', bet:10.00,     mult:0,    profit:0 },
  { mode:'Upgrader', user:'ADRIANO',  level:74, color:'#fbbf24', bet:25.22,     mult:0,    profit:0 },
  { mode:'Cases',    user:'NEMEZIS',  level:23, color:'#c084fc', bet:100.00,    mult:2.0,  profit:200.00 },
  { mode:'Battles',  user:'MILOGPT',  level:17, color:'#f87171', bet:25.22,     mult:0,    profit:0 },
  { mode:'Upgrader', user:'ADRIANO',  level:74, color:'#fbbf24', bet:1554.33,   mult:0,    profit:0 },
  { mode:'Cases',    user:'MILOGPT',  level:17, color:'#f87171', bet:10.64,     mult:2.5,  profit:26.13 },
  { mode:'Upgrader', user:'ADRIANO',  level:74, color:'#fbbf24', bet:1554.33,   mult:0,    profit:0 },
  { mode:'Upgrader', user:'NEMEZIS',  level:23, color:'#c084fc', bet:25.22,     mult:0,    profit:0 },
  { mode:'Cases',    user:'MILOGPT',  level:17, color:'#f87171', bet:25.22,     mult:0,    profit:0 },
  { mode:'Battles',  user:'NEMEZIS',  level:23, color:'#c084fc', bet:100.00,    mult:0,    profit:0 },
];

/* ── Mode icons (SVG) ── */
function ModeIcon({ mode }) {
  if (mode === 'Cases') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="5.5" width="13" height="9" rx="1.5" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1"/>
      <path d="M5.5 5.5V4a2.5 2.5 0 015 0v1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
  if (mode === 'Battles') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M11.5 1.5l3 3-1.5 1.5-1-1-5.5 5.5 1 1-1.5 1.5-3-3 1.5-1.5 1 1 5.5-5.5-1-1 1.5-1.5z" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.4 2.8 3.1.45-2.25 2.2.53 3.1L8 9l-2.78 1.55.53-3.1L3.5 5.25l3.1-.45L8 2z" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

/* ── Nav icons ── */
function NavIcon({ type }) {
  if (type === 'cases') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="bw-nav-icon">
      <rect x="1.5" y="5.5" width="13" height="9" rx="1.5" fill="currentColor" fillOpacity=".5" stroke="currentColor" strokeWidth="1.1" strokeOpacity=".8"/>
      <path d="M5.5 5.5V4a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity=".8"/>
    </svg>
  );
  if (type === 'battles') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="bw-nav-icon">
      <path d="M11.5 1.5l3 3-1.5 1.5-1-1-5.5 5.5 1 1-1.5 1.5-3-3 1.5-1.5 1 1 5.5-5.5-1-1 1.5-1.5z" fill="currentColor" fillOpacity=".85"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="bw-nav-icon">
      <path d="M8 2l1.4 2.8 3.1.45-2.25 2.2.53 3.1L8 9l-2.78 1.55.53-3.1L3.5 5.25l3.1-.45L8 2z" fill="currentColor" fillOpacity=".85"/>
    </svg>
  );
}

/* ── CoinIcon ── */
function Coin({ size = 14 }) {
  return <div className="bw-coin-icon" style={{ width: size, height: size }} />;
}

/* ── Timer hook ── */
function useTimer(initial) {
  const [secs, setSecs] = useState(initial);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s <= 0 ? initial : s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ── CHAT COMPONENT ── */
function ChatPanel() {
  const timer = useTimer(3600 - 27);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView(); }, []);

  return (
    <aside className="bw-chat">
      <div className="bw-chat-header">
        <span className="bw-chat-title">Chat Rules</span>
        <div className="bw-online">
          <div className="bw-online-dot" />
          1 443
        </div>
      </div>

      <div className="bw-rain-pot">
        <div>
          <div className="bw-rain-timer">{timer}</div>
          <div className="bw-rain-label">RAIN POT</div>
        </div>
        <div className="bw-rain-amount">
          <Coin size={12} />
          999.99
        </div>
        <div style={{
          marginLeft: 4, width: 20, height: 20, borderRadius: 5,
          background: '#f5a623', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}>
          <span style={{ color: '#111', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>+</span>
        </div>
      </div>

      <div className="bw-messages">
        {CHAT_MSGS.map(m => (
          <div key={m.id} className="bw-msg">
            <div className="bw-msg-top">
              <div className="bw-msg-avatar" style={{ background: m.color + '33', border: `1px solid ${m.color}55` }}>
                <span style={{ color: m.color }}>{m.name[0]}</span>
              </div>
              <span className="bw-msg-level">{m.level}</span>
              <span className="bw-msg-name">{m.name}:</span>
              <span className="bw-msg-time">{m.time}</span>
            </div>
            <div className="bw-msg-text">{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="bw-chat-login">
        <Link to={createPageUrl('Authpage')}>
          <button className="bw-chat-login-btn">Login to Chat...</button>
        </Link>
      </div>
    </aside>
  );
}

/* ── HERO ── */
function Hero() {
  return (
    <motion.div
      className="bw-hero"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5, ease: [.22, 1, .36, 1] }}
    >
      <div className="bw-hero-bg" />

      {/* Floating coins */}
      {[
        { size:40, top:'12%', right:'44%', dur:'5s', delay:'0s' },
        { size:52, top:'8%',  right:'30%', dur:'6s', delay:'-1s' },
        { size:36, top:'55%', right:'38%', dur:'4.5s', delay:'-2s' },
        { size:44, top:'20%', right:'20%', dur:'7s', delay:'-0.5s' },
        { size:30, top:'60%', right:'18%', dur:'5.5s', delay:'-3s' },
      ].map((c, i) => (
        <div key={i} className="bw-hero-coin" style={{
          width: c.size, height: c.size,
          top: c.top, right: c.right,
          fontSize: c.size * 0.35,
          '--dur': c.dur, '--delay': c.delay,
        }}>$</div>
      ))}

      <div className="bw-hero-content">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .15, duration: .5 }}
        >
          <div className="bw-hero-title">Come Join Us!</div>
          <div className="bw-hero-sub">To The Wilderness...</div>
          <Link to={createPageUrl('Authpage')} className="bw-hero-btn">
            Sign In
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── GAME CARDS ── */
const GAME_CARDS = [
  { name: 'Cases',    page: 'Cases',    img: casesImg    },
  { name: 'Battles',  page: 'Battles',  img: battlesImg  },
  { name: 'Upgrader', page: 'Upgrader', img: upgraderImg },
];

function GameCard({ g, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: .1 + i * .08, duration: .45, ease: [.22, 1, .36, 1] }}
    >
      <Link to={createPageUrl(g.page)} className="bw-game-card">
        <img src={g.img} alt={g.name} className="bw-game-card-img" />
        <div className="bw-game-card-overlay" />
        <div className="bw-game-card-name">{g.name}</div>
      </Link>
    </motion.div>
  );
}

/* ── LIVE WINS TABLE ── */
function LiveWins() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: .4 }}
    >
      <div className="bw-live-header">
        <div className="bw-section-label">
          <span className="bw-section-label-text">Live Wins</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div className="bw-tabs">
          {['all', 'high', 'lucky'].map(t => (
            <button
              key={t}
              className={`bw-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'all' ? 'All Bets' : t === 'high' ? 'High Rollers' : 'Lucky Wins'}
            </button>
          ))}
        </div>
      </div>

      <div className="bw-wins-table">
        <div className="bw-wins-thead">
          <span className="bw-wins-th">Gamemode</span>
          <span className="bw-wins-th">User</span>
          <span className="bw-wins-th">Bet Amount</span>
          <span className="bw-wins-th">Multiplier</span>
          <span className="bw-wins-th">Profit</span>
        </div>
        {LIVE_WINS.map((row, i) => {
          const isHot = row.mult >= 2;
          return (
            <div key={i} className="bw-wins-row">
              <div className="bw-wins-mode">
                <ModeIcon mode={row.mode} />
                {row.mode}
              </div>
              <div className="bw-wins-user">
                <div className="bw-wins-avatar" style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: row.color + '33',
                  border: `1px solid ${row.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: row.color,
                }}>
                  {row.user[0]}
                </div>
                <span className="bw-wins-lvl">{row.level}</span>
                <span className="bw-wins-name">{row.user}</span>
              </div>
              <div className="bw-coin-val">
                <Coin />
                {row.bet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`bw-mult ${isHot ? 'hot' : 'normal'}`}>
                {row.mult === 0 ? '0.00X' : `${row.mult.toFixed(2)}X`}
              </div>
              <div className={`bw-coin-val ${isHot ? 'hot' : ''}`}>
                <Coin />
                {row.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

/* ── FOOTER ── */
function Footer() {
  return (
    <footer className="bw-footer">
      <div className="bw-footer-inner">
        <div>
          <div className="bw-footer-logo">
            BLADE<span style={{ color: '#f5a623', fontStyle: 'italic' }}>X</span>WIN
          </div>
          <p className="bw-footer-desc">
            BladeWin is not affiliated with or endorsed by Roblox Corporation.
            All trademarks belong to their respective owners. This platform is
            intended for entertainment purposes only.
          </p>
        </div>
        <div>
          <div className="bw-footer-col-title">Gamemodes</div>
          {['Cases', 'Battles', 'Upgrader'].map(g => (
            <Link key={g} to={createPageUrl(g)} className="bw-footer-link">
              <ModeIcon mode={g} />
              {g}
            </Link>
          ))}
        </div>
        <div>
          <div className="bw-footer-col-title">Links</div>
          {['Terms of Service', 'Privacy Policy', 'Responsible Gambling'].map(l => (
            <a key={l} href="#" className="bw-footer-link">{l}</a>
          ))}
        </div>
      </div>
      <div className="bw-footer-bottom">© 2026 BladeWin. All rights reserved.</div>
    </footer>
  );
}

/* ── TOP NAV ── */
function TopNav({ currentPage }) {
  return (
    <nav className="bw-nav">
      <a href="#" className="bw-logo">
        BLADE<span className="bw-logo-x">X</span>WIN
      </a>
      <div className="bw-nav-links">
        {[
          { name: 'Cases',    page: 'Cases',    icon: 'cases'    },
          { name: 'Battles',  page: 'Battles',  icon: 'battles'  },
          { name: 'Upgrader', page: 'Upgrader', icon: 'upgrader' },
        ].map(item => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`bw-nav-link ${currentPage === item.page ? 'active' : ''}`}
          >
            <NavIcon type={item.icon} />
            {item.name}
          </Link>
        ))}
      </div>
      <Link to={createPageUrl('Authpage')} className="bw-signin-btn">
        Sign In
      </Link>
    </nav>
  );
}

/* ── ROOT ── */
export default function Home() {
  return (
    <div className="bw-root">
      <style>{CSS}</style>
      <TopNav currentPage="Home" />
      <div className="bw-body">
        <ChatPanel />
        <div className="bw-main">
          <Hero />

          {/* Our Games label */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="bw-section-label">
              <span className="bw-section-label-text">Our Games</span>
            </div>
          </div>

          {/* Game cards */}
          <div className="bw-games-grid">
            {GAME_CARDS.map((g, i) => <GameCard key={g.name} g={g} i={i} />)}
          </div>

          <LiveWins />
        </div>
      </div>
      <Footer />
    </div>
  );
}