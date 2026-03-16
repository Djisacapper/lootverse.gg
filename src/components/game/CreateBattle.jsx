import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  Bot,
  Swords
} from "lucide-react";

import CasePickerModal from "./CasePickerModal";

const BOT_NAMES = [
  "CrateBot",
  "LootBot",
  "RNG_Pro",
  "ShadowBot",
  "CryptoBot",
  "NightBot"
];

const MODES = [
  { label: "1v1" },
  { label: "1v1v1" },
  { label: "1v1v1v1" },
  { label: "2v2" },
  { label: "3v3" },
  { label: "2v2v2" }
];

const TEAM_PALETTE = [
  "#fbbf24",
  "#a855f7",
  "#60a5fa",
  "#34d399"
];

function parseMode(label) {
  return label.split("v").map(Number);
}

export default function CreateBattle({
  cases,
  balance,
  user,
  onBack,
  onCreate
}) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [modeLabel, setModeLabel] = useState("1v1");

  const teamSizes = parseMode(modeLabel);
  const totalPlayers = teamSizes.reduce((a, b) => a + b, 0);

  const [slots, setSlots] = useState(() => {
    const s = Array(totalPlayers).fill(null);
    if (user) s[0] = user;
    return s;
  });

  const totalCost = useMemo(
    () => selectedCases.reduce((sum, c) => sum + c.price, 0),
    [selectedCases]
  );

  const overBudget = totalCost > balance;

  const canCreate =
    selectedCases.length > 0 &&
    !overBudget &&
    slots.every(Boolean);

  function addCase(c) {
    setSelectedCases(prev => [
      ...prev,
      { ...c, uid: crypto.randomUUID() }
    ]);
  }

  function removeCase(uid) {
    setSelectedCases(prev =>
      prev.filter(c => c.uid !== uid)
    );
  }

  function fillWithBots() {
    setSlots(prev =>
      prev.map((slot, i) => {
        if (slot) return slot;

        const name =
          BOT_NAMES[
            Math.floor(Math.random() * BOT_NAMES.length)
          ] +
          "_" +
          Math.floor(Math.random() * 1000);

        return {
          name,
          isBot: true
        };
      })
    );
  }

  function addBot(slotIndex) {
    const name =
      BOT_NAMES[
        Math.floor(Math.random() * BOT_NAMES.length)
      ] +
      "_" +
      Math.floor(Math.random() * 1000);

    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = { name, isBot: true };
      return next;
    });
  }

  function removeSlot(i) {
    if (i === 0) return;

    setSlots(prev => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
  }

  function handleCreate() {
    if (!canCreate) return;

    onCreate({
      selectedCases,
      modeLabel,
      players: slots
    });
  }

  return (
    <div
      style={{
        background: "#04000a",
        minHeight: "100vh",
        padding: 24
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <button onClick={onBack}>
            <ArrowLeft size={20} />
          </button>

          <Swords color="#fbbf24" />

          <h2
            style={{
              fontWeight: 900,
              color: "white"
            }}
          >
            Create Battle
          </h2>
        </div>

        {/* COST BAR */}

        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background:
              "linear-gradient(145deg,#080012,#120025)"
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#aaa",
              marginBottom: 6
            }}
          >
            Battle Cost
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: overBudget ? "#f87171" : "#fbbf24"
            }}
          >
            {totalCost.toLocaleString()} coins
          </div>

          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 4,
              background: "#111"
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(
                  100,
                  (totalCost / balance) * 100
                )}%`,
                background:
                  "linear-gradient(90deg,#fbbf24,#a855f7)",
                boxShadow:
                  "0 0 10px rgba(251,191,36,.5)"
              }}
            />
          </div>
        </div>

        {/* MODE SELECT */}

        <div>
          <select
            value={modeLabel}
            onChange={e =>
              setModeLabel(e.target.value)
            }
          >
            {MODES.map(m => (
              <option
                key={m.label}
                value={m.label}
              >
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* CASES */}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          {selectedCases.map((c, i) => (
            <div
              key={c.uid}
              style={{
                width: 110,
                background:
                  "linear-gradient(160deg,#080012,#120025)",
                border:
                  "1px solid rgba(255,255,255,.07)",
                borderRadius: 12,
                padding: 8,
                position: "relative",
                cursor: "pointer"
              }}
            >
              {/* ORDER NUMBER */}

              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  fontSize: 10,
                  color: "#fbbf24",
                  fontWeight: 900
                }}
              >
                #{i + 1}
              </div>

              {/* REMOVE */}

              <button
                onClick={() =>
                  removeCase(c.uid)
                }
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <X
                  size={14}
                  color="#f87171"
                />
              </button>

              {/* IMAGE */}

              <div
                style={{
                  width: "100%",
                  height: 60,
                  marginBottom: 6
                }}
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  "📦"
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#bbb"
                }}
              >
                {c.name}
              </div>

              <div
                style={{
                  fontWeight: 900,
                  color: "#fbbf24"
                }}
              >
                {c.price}
              </div>
            </div>
          ))}

          {/* ADD CASE */}

          <div
            onClick={() =>
              setShowPicker(true)
            }
            style={{
              width: 110,
              height: 120,
              borderRadius: 12,
              border:
                "2px dashed rgba(168,85,247,.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <Plus color="#a855f7" />
          </div>
        </div>

        {/* PLAYERS */}

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          {slots.map((slot, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 10,
                border:
                  "1px solid rgba(255,255,255,.08)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {slot ? (
                <>
                  <span>
                    {slot.name ||
                      user?.username ||
                      "You"}
                  </span>

                  {i !== 0 && (
                    <button
                      onClick={() =>
                        removeSlot(i)
                      }
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() =>
                    addBot(i)
                  }
                >
                  <Bot size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={fillWithBots}>
          Fill With Bots
        </button>

        {/* CREATE */}

        <button
          disabled={!canCreate}
          onClick={handleCreate}
          style={{
            padding: 14,
            borderRadius: 12,
            fontWeight: 900,
            background: canCreate
              ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
              : "#222",
            color: canCreate
              ? "#000"
              : "#555"
          }}
        >
          Create Battle
        </button>
      </div>

      <CasePickerModal
        open={showPicker}
        onOpenChange={setShowPicker}
        cases={cases}
        onAddCase={addCase}
      />
    </div>
  );
}