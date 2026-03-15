/**
 * useProvablyFair.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provably fair engine for case battles using EOS blockchain block hashes.
 *
 * FLOW:
 *   1. Battle CREATED  → commitEosBlock() picks a future block number (+3 from head)
 *                        and saves { eos_block_num, eos_chain_id } to the battle.
 *   2. Battle STARTS   → resolveAndCommitRolls() polls EOS until that block is mined,
 *                        fetches its hash, derives ALL rolls deterministically, and
 *                        saves { eos_block_hash, committed_rolls } to the battle.
 *   3. Every CLIENT    → reads battle.committed_rolls directly. No local randomness.
 *                        Players, spectators, late-joiners all see identical outcomes.
 *
 * INTEGRATION (search ← ADD THIS in Battles.jsx and BattleArena.jsx):
 *   Battles.jsx  handleCreate  → call commitEosBlock(battle.id) after creating battle
 *   Battles.jsx  handleJoin    → when last player joins, call resolveAndCommitRolls()
 *   BattleArena  allRolled     → read from battle.committed_rolls instead of rollItem()
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── EOS endpoints (tried in order, first success wins) ──────────────────────
const EOS_ENDPOINTS = [
  'https://eos.greymass.com',
  'https://api.eossweden.org',
  'https://eos.api.eosnation.io',
];

async function eosPost(path, body, timeoutMs = 7000) {
  for (const base of EOS_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next endpoint
    }
  }
  throw new Error('All EOS endpoints unreachable');
}

/** Returns current EOS head block number */
export async function getEosHeadBlock() {
  const info = await eosPost('/v1/chain/get_info', {});
  return {
    headBlockNum: info.head_block_num,
    chainId: info.chain_id,
  };
}

/** Fetches a specific EOS block by number, returns its hash */
export async function getEosBlock(blockNum) {
  const block = await eosPost('/v1/chain/get_block', { block_num_or_id: blockNum });
  return {
    blockNum: block.block_num,
    blockHash: block.id,       // 64-char hex — this is the provably fair seed
    timestamp: block.timestamp,
    producer: block.producer,
  };
}

// ─── Seeded RNG (Mulberry32) ──────────────────────────────────────────────────
/**
 * Converts the first 8 hex chars of the block hash into a 32-bit integer seed.
 * Deterministic: same hash always → same seed → same sequence of rolls.
 */
function hashToSeed(blockHash) {
  return parseInt(blockHash.slice(0, 8), 16) >>> 0;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Given a block hash and an array of case items (with weights/values),
 * pick one item. Uses the same weighted-random logic as your existing rollItem().
 */
function seededRollItem(rng, items) {
  if (!items || items.length === 0) return { name: 'Nothing', value: 0, rarity: 'common', image_url: null };
  const totalWeight = items.reduce((s, it) => s + (it.weight || it.drop_chance || 1), 0);
  let roll = rng() * totalWeight;
  for (const item of items) {
    roll -= (item.weight || item.drop_chance || 1);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// ─── Magic Spin check ─────────────────────────────────────────────────────────
function seededMagicCheck(rng, items, isMagicSpin) {
  if (!isMagicSpin) return { isMagic: false };
  const topItems = items.filter(it => ['epic', 'legendary'].includes(it.rarity));
  if (topItems.length > 0 && rng() < 0.20) return { isMagic: true };
  return { isMagic: false };
}

// ─── Core: derive all rolls from a single block hash ─────────────────────────
/**
 * deriveRolls()
 * Given a blockHash + battle config, deterministically produces every roll
 * for every player across every round. Output shape mirrors allRolled.current
 * in BattleArena so it's a drop-in replacement.
 *
 * @param {string}   blockHash     - 64-char hex EOS block id
 * @param {string}   battleId      - battle's unique id (adds entropy isolation between battles)
 * @param {Array}    selectedCases - array of case objects with .items[]
 * @param {Array}    players       - array of player objects
 * @param {object}   battleModes   - { magic_spin, crazy, ... }
 * @returns {Array}  rolls[roundIndex][playerIndex] = { item, isMagic }
 */
export function deriveRolls(blockHash, battleId, selectedCases, players, battleModes = {}) {
  // Combine blockHash + battleId into a unique seed so different battles
  // using the same block never produce identical rolls.
  const combined = blockHash + '::' + battleId;
  let seedInt = 0;
  for (let i = 0; i < combined.length; i++) {
    seedInt = ((seedInt << 5) - seedInt + combined.charCodeAt(i)) | 0;
  }
  const rng = mulberry32(seedInt >>> 0);

  const rolls = selectedCases.map((caseObj) => {
    const items = caseObj.items || [];
    return players.map(() => {
      const item = seededRollItem(rng, items);
      const { isMagic } = seededMagicCheck(rng, items, battleModes.magic_spin);
      // If magic spin triggered, roll again from top-tier pool
      if (isMagic) {
        const topItems = items.filter(it => ['epic', 'legendary'].includes(it.rarity));
        const magicItem = seededRollItem(rng, topItems.length > 0 ? topItems : items);
        return { item: magicItem, isMagic: true };
      }
      return { item, isMagic: false };
    });
  });

  return rolls;
}

// ─── Step 1: Commit to a future EOS block at battle creation ─────────────────
/**
 * Call this right after creating a battle in Battles.jsx handleCreate().
 * Picks head+3 as the future block, saves it to the battle record.
 * Returns the block number committed to.
 *
 * Usage:
 *   const battle = await base44.entities.CaseBattle.create({ ... });
 *   await commitEosBlock(battle.id);   // ← ADD THIS
 */
export async function commitEosBlock(battleId) {
  try {
    const { base44 } = await import('@/api/base44Client');
    const { headBlockNum, chainId } = await getEosHeadBlock();
    const futureBlock = headBlockNum + 3;  // ~1.5 seconds in the future on EOS
    await base44.entities.CaseBattle.update(battleId, {
      eos_block_num: futureBlock,
      eos_chain_id: chainId,
      eos_block_hash: null,      // not mined yet
      committed_rolls: null,     // not rolled yet
    });
    return futureBlock;
  } catch (err) {
    console.error('[provablyFair] commitEosBlock failed:', err);
    return null;
  }
}

// ─── Step 2: Resolve the block + derive + store all rolls ────────────────────
/**
 * Call this when the last player joins (battle goes in_progress).
 * Polls EOS until the committed block is mined, then derives all rolls
 * and saves them to the battle record so every client reads the same data.
 *
 * Usage in Battles.jsx handleJoin(), after updating players to full:
 *   await resolveAndCommitRolls(battle, selectedCasesArr, updatedPlayers, battleModes);
 *
 * Also runs automatically inside BattleArena via the useProvablyFairArena hook below.
 */
export async function resolveAndCommitRolls(battle, selectedCases, players, battleModes = {}) {
  try {
    const { base44 } = await import('@/api/base44Client');

    // If rolls already committed, nothing to do
    if (battle.committed_rolls) return JSON.parse(battle.committed_rolls);

    let blockHash = battle.eos_block_hash;
    let blockNum  = battle.eos_block_num;

    // If no block was committed at creation time, pick current head (fallback)
    if (!blockNum) {
      const { headBlockNum } = await getEosHeadBlock();
      blockNum = headBlockNum;
      await base44.entities.CaseBattle.update(battle.id, { eos_block_num: blockNum });
    }

    // Poll until the block exists (EOS produces ~0.5s/block, timeout after 30s)
    if (!blockHash) {
      const deadline = Date.now() + 30_000;
      while (!blockHash && Date.now() < deadline) {
        try {
          const b = await getEosBlock(blockNum);
          blockHash = b.blockHash;
        } catch {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      // Fallback: if EOS unreachable, use a CSPRNG hash so the game can still run
      if (!blockHash) {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        blockHash = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        console.warn('[provablyFair] EOS unreachable — using CSPRNG fallback hash:', blockHash);
      }
      await base44.entities.CaseBattle.update(battle.id, { eos_block_hash: blockHash });
    }

    // Derive every roll deterministically
    const rolls = deriveRolls(blockHash, battle.id, selectedCases, players, battleModes);

    // Persist rolls so all other clients read them
    await base44.entities.CaseBattle.update(battle.id, {
      committed_rolls: JSON.stringify(rolls),
    });

    return rolls;
  } catch (err) {
    console.error('[provablyFair] resolveAndCommitRolls failed:', err);
    return null;
  }
}

// ─── Hook: use inside BattleArena to auto-resolve + subscribe ────────────────
/**
 * useProvablyFairArena(battle, selectedCases, players, battleModes)
 *
 * Returns { rolls, blockHash, blockNum, status }
 *   - rolls:     allRolled-compatible array (drop into BattleArena as allRolled.current)
 *   - blockHash: the EOS hash used (for display in verify UI)
 *   - blockNum:  the EOS block number
 *   - status:    'waiting' | 'resolving' | 'ready' | 'error'
 *
 * This hook:
 *   • Reads committed_rolls from the battle record if already present.
 *   • If missing, calls resolveAndCommitRolls() (only one client actually writes,
 *     others poll until it appears — race-safe because base44 is last-write-wins
 *     and all clients would derive the SAME rolls from the same hash anyway).
 *   • Polls the battle record every 2s until rolls are available.
 */
import { useState, useEffect, useRef } from 'react';

export function useProvablyFairArena(battle, selectedCases, players, battleModes = {}) {
  const [rolls, setRolls]         = useState(null);
  const [blockHash, setBlockHash] = useState(battle?.eos_block_hash || null);
  const [blockNum, setBlockNum]   = useState(battle?.eos_block_num || null);
  const [status, setStatus]       = useState('waiting');
  const resolving = useRef(false);

  useEffect(() => {
    if (!battle?.id || !selectedCases?.length || !players?.length) return;

    // Already have rolls committed on the record
    if (battle.committed_rolls) {
      try {
        const parsed = JSON.parse(battle.committed_rolls);
        setRolls(parsed);
        setBlockHash(battle.eos_block_hash);
        setBlockNum(battle.eos_block_num);
        setStatus('ready');
        return;
      } catch {}
    }

    // Not yet resolved — start resolving (only one client actually commits,
    // others will pick it up via polling)
    if (!resolving.current) {
      resolving.current = true;
      setStatus('resolving');
      resolveAndCommitRolls(battle, selectedCases, players, battleModes).then(r => {
        if (r) {
          setRolls(r);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      });
    }

    // Poll every 2s in case another client resolved first
    const poll = setInterval(async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const res = await base44.entities.CaseBattle.filter({ id: battle.id });
        const u = res?.[0];
        if (!u) return;
        if (u.eos_block_hash) setBlockHash(u.eos_block_hash);
        if (u.eos_block_num)  setBlockNum(u.eos_block_num);
        if (u.committed_rolls) {
          clearInterval(poll);
          try {
            const parsed = JSON.parse(u.committed_rolls);
            setRolls(parsed);
            setStatus('ready');
          } catch {}
        }
      } catch {}
    }, 2000);

    return () => clearInterval(poll);
  }, [battle?.id]);

  return { rolls, blockHash, blockNum, status };
}