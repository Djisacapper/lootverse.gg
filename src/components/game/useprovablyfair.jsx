/**
 * useProvablyFair.js
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

function seededMagicCheck(rng, item, isMagicSpin) {
  if (!isMagicSpin) return { isMagic: false };
  // Gem spin triggers when the rolled item itself is epic or legendary
  const isMagic = ['epic', 'legendary'].includes(item?.rarity);
  return { isMagic };
}

// ─── Validate stored rolls ────────────────────────────────────────────────────
/**
 * Check that stored rolls are valid for the current battle config.
 * Rolls are invalid if:
 *   - Wrong number of rounds
 *   - Any round has fewer player slots than expected
 *     (catches the "committed with 1 player" stale data bug)
 */
function rollsAreValid(parsed, casesLen, expectedPlayerCount) {
  if (!Array.isArray(parsed) || parsed.length !== casesLen) return false;
  for (const round of parsed) {
    if (!Array.isArray(round)) return false;
    if (round.length < expectedPlayerCount) return false;
    // Verify every expected slot has actual roll data with an item
    for (let i = 0; i < expectedPlayerCount; i++) {
      if (!round[i] || !round[i].item) return false;
    }
  }
  return true;
}

// ─── Core roll derivation ─────────────────────────────────────────────────────
export function deriveRolls(blockHash, battleId, selectedCases, players, battleModes = {}) {
  if (!selectedCases?.length || !players?.length) {
    console.warn('[provablyFair] deriveRolls called with empty cases or players — aborting');
    return [];
  }

  console.log(
    `[provablyFair] deriveRolls: ${selectedCases.length} case(s) × ${players.length} player(s), battleModes=`, battleModes
  );

  const combined = blockHash + '::' + battleId;
  let seedInt = 0;
  for (let i = 0; i < combined.length; i++) {
    seedInt = ((seedInt << 5) - seedInt + combined.charCodeAt(i)) | 0;
  }
  const rng = mulberry32(seedInt >>> 0);

  const rolls = selectedCases.map((caseObj, roundIndex) => {
    const items = caseObj?.items;

    if (!items || items.length === 0) {
      console.warn(`[provablyFair] case[${roundIndex}] "${caseObj?.name}" has no items`);
      return players.map(() => ({
        item: { name: 'Empty', value: 0, rarity: 'common', image_url: null },
        isMagic: false,
      }));
    }

    return players.map(() => {
      const item = seededRollItem(rng, items);
      const { isMagic } = seededMagicCheck(rng, item, battleModes.gem_spin);

      if (isMagic) {
        // item = normal first spin (the epic/legendary that triggered gem spin)
        // magicItem = same item, shown dramatically in the gem spin reveal
        return { item, isMagic: true, magicItem: item };
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

    if (!selectedCases?.length || !players?.length) {
      console.warn('[provablyFair] resolveAndCommitRolls called with empty cases/players');
      return null;
    }

    // ── Validate existing rolls: must match BOTH round count AND player count ──
    // Also verify isMagic fields exist when gem_spin mode is active.
    if (battle.committed_rolls) {
      try {
        const parsed = JSON.parse(battle.committed_rolls);
        if (rollsAreValid(parsed, selectedCases.length, players.length)) {
          // If gem_spin is active, verify the stored rolls actually have isMagic evaluated
          // (old rolls won't have it — force re-derive)
          const hasMagicField = parsed[0]?.[0] && 'isMagic' in parsed[0][0];
          if (!battleModes?.gem_spin || hasMagicField) {
            console.log(`[provablyFair] using stored rolls: ${parsed.length} rounds × ${players.length} players`);
            return parsed;
          }
          console.log('[provablyFair] gem_spin active but stored rolls have no isMagic — re-deriving');
        } else {
          console.warn(`[provablyFair] stored rolls invalid — re-deriving`);
        }
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
export function useProvablyFairArena(battle, selectedCases, players, battleModes = {}) {
  const [rolls,     setRolls]     = useState(null);
  const [blockHash, setBlockHash] = useState(battle?.eos_block_hash || null);
  const [blockNum,  setBlockNum]  = useState(battle?.eos_block_num  || null);
  const [status,    setStatus]    = useState('waiting');
  const resolving = useRef(false);

  const casesLen   = selectedCases?.length ?? 0;
  const playersLen = players?.length       ?? 0;

  useEffect(() => {
    if (!battle?.id || casesLen === 0 || playersLen === 0) return;

    resolving.current = false;

    // ── Validate stored rolls against BOTH round count AND player count ──
    if (battle.committed_rolls) {
      try {
        const parsed = JSON.parse(battle.committed_rolls);
        if (rollsAreValid(parsed, casesLen, playersLen)) {
          const hasMagicField = parsed[0]?.[0] && 'isMagic' in parsed[0][0];
          if (!battleModes?.gem_spin || hasMagicField) {
            setRolls(parsed);
            setBlockHash(battle.eos_block_hash);
            setBlockNum(battle.eos_block_num);
            setStatus('ready');
            return;
          }
          console.log('[provablyFair] hook: gem_spin active but rolls have no isMagic — re-deriving');
        } else {
          console.warn(`[provablyFair] hook: stored rolls invalid — re-deriving`);
        }
      } catch {}
    }

    if (!resolving.current) {
      resolving.current = true;
      setStatus('resolving');

      resolveAndCommitRolls(battle, selectedCases, players, battleModes).then(r => {
        if (r && rollsAreValid(r, casesLen, playersLen)) {
          setRolls(r);
          setStatus('ready');
        } else if (r) {
          console.error(`[provablyFair] resolved rolls still invalid after re-derive`);
          setStatus('error');
        } else {
          setStatus('error');
        }
      });
    }

    // ── Poll every 2s — picks up rolls committed by other clients ──
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
            // ── KEY FIX: validate player count too, not just round count ──
            if (rollsAreValid(parsed, casesLen, playersLen)) {
              clearInterval(poll);
              setRolls(parsed);
              setStatus('ready');
            }
          } catch {}
        }
      } catch {}
    }, 2000);

    return () => clearInterval(poll);

  }, [battle?.id, casesLen, playersLen, battleModes?.gem_spin]);

  return { rolls, blockHash, blockNum, status };
}