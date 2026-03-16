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
 */

import { useState, useEffect, useRef } from 'react';

// ─── EOS endpoints ────────────────────────────────────────────────────────────
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

export async function getEosHeadBlock() {
  const info = await eosPost('/v1/chain/get_info', {});
  return { headBlockNum: info.head_block_num, chainId: info.chain_id };
}

export async function getEosBlock(blockNum) {
  const block = await eosPost('/v1/chain/get_block', { block_num_or_id: blockNum });
  return {
    blockNum: block.block_num,
    blockHash: block.id,
    timestamp: block.timestamp,
    producer: block.producer,
  };
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRollItem(rng, items) {
  if (!items || items.length === 0)
    return { name: 'Nothing', value: 0, rarity: 'common', image_url: null };
  const getWeight = (it) =>
    typeof it.drop_rate === 'number' && it.drop_rate > 0 ? it.drop_rate : 1;
  const totalWeight = items.reduce((s, it) => s + getWeight(it), 0);
  let roll = rng() * totalWeight;
  for (const item of items) {
    roll -= getWeight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function seededMagicCheck(rng, items, isMagicSpin) {
  if (!isMagicSpin) return { isMagic: false };
  const topItems = items.filter(it => ['epic', 'legendary'].includes(it.rarity));
  if (topItems.length > 0 && rng() < 0.20) return { isMagic: true };
  return { isMagic: false };
}

// ─── Core roll derivation ─────────────────────────────────────────────────────
/**
 * deriveRolls()
 *
 * BUG FIX: The previous version used selectedCases.map() which iterates
 * correctly, but if selectedCases was stale/partial when called (e.g. only
 * 1 case instead of 4), rolls[1..3] would be undefined — and BattleArena
 * would fall back to selectedCases[0] every round.
 *
 * We now validate each case has items before rolling, and log a clear warning
 * if cases are missing so it's obvious during debugging.
 *
 * @param {string}   blockHash
 * @param {string}   battleId
 * @param {Array}    selectedCases  — must be the FULL array, all rounds
 * @param {Array}    players
 * @param {object}   battleModes
 * @returns {Array}  rolls[roundIndex][playerIndex] = { item, isMagic }
 */
export function deriveRolls(blockHash, battleId, selectedCases, players, battleModes = {}) {
  // ── Guard: if cases or players are empty, bail out cleanly ──
  if (!selectedCases?.length || !players?.length) {
    console.warn('[provablyFair] deriveRolls called with empty cases or players — aborting');
    return [];
  }

  // ── Log so it's easy to spot case-count mismatches during debugging ──
  console.log(
    `[provablyFair] deriveRolls: ${selectedCases.length} case(s) × ${players.length} player(s)`,
    selectedCases.map((c, i) => `[${i}] "${c?.name}" (${c?.items?.length ?? 0} items)`)
  );

  // ── Build a unique seed from blockHash + battleId ──
  const combined = blockHash + '::' + battleId;
  let seedInt = 0;
  for (let i = 0; i < combined.length; i++) {
    seedInt = ((seedInt << 5) - seedInt + combined.charCodeAt(i)) | 0;
  }
  const rng = mulberry32(seedInt >>> 0);

  // ── Roll each round using THAT round's case — not case[0] ──
  // selectedCases[roundIndex] is the case for that specific round.
  // The RNG advances continuously so every roll is unique even if two
  // rounds happen to use the same case.
  const rolls = selectedCases.map((caseObj, roundIndex) => {
    const items = caseObj?.items;

    // Defensive: if this case has no items, warn and return empty rolls
    if (!items || items.length === 0) {
      console.warn(`[provablyFair] case[${roundIndex}] "${caseObj?.name}" has no items — returning zero-value roll`);
      return players.map(() => ({
        item: { name: 'Empty', value: 0, rarity: 'common', image_url: null },
        isMagic: false,
      }));
    }

    return players.map((_player, playerIndex) => {
      const item = seededRollItem(rng, items);
      const { isMagic } = seededMagicCheck(rng, items, battleModes.magic_spin);

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
export async function commitEosBlock(battleId) {
  try {
    const { base44 } = await import('@/api/base44Client');
    const { headBlockNum, chainId } = await getEosHeadBlock();
    const futureBlock = headBlockNum + 3;
    await base44.entities.CaseBattle.update(battleId, {
      eos_block_num: futureBlock,
      eos_chain_id: chainId,
      eos_block_hash: null,
      committed_rolls: null,
    });
    return futureBlock;
  } catch (err) {
    console.error('[provablyFair] commitEosBlock failed:', err);
    return null;
  }
}

// ─── Step 2: Resolve block + derive + store all rolls ────────────────────────
export async function resolveAndCommitRolls(battle, selectedCases, players, battleModes = {}) {
  try {
    const { base44 } = await import('@/api/base44Client');

    // ── Guard: don't run with incomplete data ──
    if (!selectedCases?.length || !players?.length) {
      console.warn('[provablyFair] resolveAndCommitRolls called with empty cases/players');
      return null;
    }

    // Already have rolls? Parse and return — but validate the round count first.
    if (battle.committed_rolls) {
      try {
        const parsed = JSON.parse(battle.committed_rolls);
        // If the stored rolls were generated with fewer cases (stale data),
        // wipe them and re-derive with the correct full set.
        if (Array.isArray(parsed) && parsed.length === selectedCases.length) {
          return parsed;
        }
        console.warn(
          `[provablyFair] stored rolls have ${parsed.length} rounds but battle has ${selectedCases.length} — re-deriving`
        );
      } catch {}
    }

    let blockHash = battle.eos_block_hash;
    let blockNum  = battle.eos_block_num;

    if (!blockNum) {
      const { headBlockNum } = await getEosHeadBlock();
      blockNum = headBlockNum;
      await base44.entities.CaseBattle.update(battle.id, { eos_block_num: blockNum });
    }

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
      // CSPRNG fallback if EOS is unreachable
      if (!blockHash) {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        blockHash = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        console.warn('[provablyFair] EOS unreachable — using CSPRNG fallback hash:', blockHash);
      }
      await base44.entities.CaseBattle.update(battle.id, { eos_block_hash: blockHash });
    }

    const rolls = deriveRolls(blockHash, battle.id, selectedCases, players, battleModes);

    await base44.entities.CaseBattle.update(battle.id, {
      committed_rolls: JSON.stringify(rolls),
    });

    return rolls;
  } catch (err) {
    console.error('[provablyFair] resolveAndCommitRolls failed:', err);
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useProvablyFairArena(battle, selectedCases, players, battleModes)
 *
 * BUG FIX: The dependency array previously only listed [battle?.id].
 * This meant if selectedCases arrived after mount (common — they're passed
 * from parent state that loads async), the effect ran once with an empty/
 * partial array, derived rolls for 0-1 cases, and never re-ran.
 *
 * Fix: depend on selectedCases.length and players.length so the effect
 * re-runs the moment all cases are present.
 *
 * Additional fix: validate that stored committed_rolls has the correct number
 * of rounds before trusting them. If stale/wrong-length rolls are found on the
 * battle record, we re-derive and overwrite.
 */
export function useProvablyFairArena(battle, selectedCases, players, battleModes = {}) {
  const [rolls,     setRolls]     = useState(null);
  const [blockHash, setBlockHash] = useState(battle?.eos_block_hash || null);
  const [blockNum,  setBlockNum]  = useState(battle?.eos_block_num  || null);
  const [status,    setStatus]    = useState('waiting');
  const resolving = useRef(false);

  const casesLen   = selectedCases?.length  ?? 0;
  const playersLen = players?.length        ?? 0;

  useEffect(() => {
    // Don't start until we have all the data we need
    if (!battle?.id || casesLen === 0 || playersLen === 0) return;

    // Reset resolving flag so a re-run (e.g. cases changed) triggers a fresh resolve
    resolving.current = false;

    // ── Check for already-committed rolls ──
    if (battle.committed_rolls) {
      try {
        const parsed = JSON.parse(battle.committed_rolls);
        // Validate round count matches the actual selected cases
        if (Array.isArray(parsed) && parsed.length === casesLen) {
          setRolls(parsed);
          setBlockHash(battle.eos_block_hash);
          setBlockNum(battle.eos_block_num);
          setStatus('ready');
          return;
        }
        // Round count mismatch — fall through to re-derive below
        console.warn(
          `[provablyFair] committed_rolls has ${parsed.length} rounds, need ${casesLen} — re-deriving`
        );
      } catch {}
    }

    // ── Resolve (derive + commit) ──
    if (!resolving.current) {
      resolving.current = true;
      setStatus('resolving');

      resolveAndCommitRolls(battle, selectedCases, players, battleModes).then(r => {
        if (r && r.length === casesLen) {
          setRolls(r);
          setStatus('ready');
        } else if (r) {
          // Got rolls but wrong count — shouldn't happen after the fixes above, but guard anyway
          console.error(`[provablyFair] resolved ${r.length} rounds, expected ${casesLen}`);
          setStatus('error');
        } else {
          setStatus('error');
        }
      });
    }

    // ── Poll every 2s in case another client committed the rolls first ──
    const poll = setInterval(async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const res = await base44.entities.CaseBattle.filter({ id: battle.id });
        const u = res?.[0];
        if (!u) return;
        if (u.eos_block_hash) setBlockHash(u.eos_block_hash);
        if (u.eos_block_num)  setBlockNum(u.eos_block_num);
        if (u.committed_rolls) {
          try {
            const parsed = JSON.parse(u.committed_rolls);
            // Only accept if round count matches
            if (Array.isArray(parsed) && parsed.length === casesLen) {
              clearInterval(poll);
              setRolls(parsed);
              setStatus('ready');
            }
          } catch {}
        }
      } catch {}
    }, 2000);

    return () => clearInterval(poll);

  // ── KEY FIX: depend on casesLen and playersLen, not just battle.id ──
  // Without this, the effect fires once at mount when selectedCases is still
  // empty ([]), derives 0 rounds, and never re-runs when the real cases arrive.
  }, [battle?.id, casesLen, playersLen]);

  return { rolls, blockHash, blockNum, status };
}