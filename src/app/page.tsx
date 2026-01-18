"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const STORAGE_KEY = "muthonjia-chama";
const TOTAL_MEMBERS = 10;
const EXPIRY_DAYS = 7;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DEFAULT_EMOJIS = ["🦁","🐵","🐸","🦊","🐼","🐷","🐨","🐯","🐔","🐙"];
const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
                "#EC4899", "#F43F5E", "#22D3EE", "#84CC16", "#FACC15"];

type MonthRecord = {
  month: string;
  pair: string[];
  date: string;
  emojis: string[];
};

type StoredData = {
  names: string[];
  emojis: string[];
  order: string[];
  locked: boolean;
  history: MonthRecord[];
  savedAt: string;
};

function loadStoredData(): StoredData {
  if (typeof window === "undefined") {
    return {
      names: Array(TOTAL_MEMBERS).fill(""),
      emojis: DEFAULT_EMOJIS,
      order: [],
      locked: false,
      history: [],
      savedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no data");
    const parsed = JSON.parse(raw);

    if (parsed.savedAt) {
      const savedDate = new Date(parsed.savedAt);
      const now = new Date();
      const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > EXPIRY_DAYS) {
        localStorage.removeItem(STORAGE_KEY);
        throw new Error("expired");
      }
    }

    return {
      names: Array.isArray(parsed.names) ? parsed.names : Array(TOTAL_MEMBERS).fill(""),
      emojis: Array.isArray(parsed.emojis) ? parsed.emojis : DEFAULT_EMOJIS,
      order: Array.isArray(parsed.order) ? parsed.order : [],
      locked: Boolean(parsed.locked),
      history: Array.isArray(parsed.history) ? parsed.history : [],
      savedAt: parsed.savedAt || new Date().toISOString(),
    };
  } catch {
    return {
      names: Array(TOTAL_MEMBERS).fill(""),
      emojis: DEFAULT_EMOJIS,
      order: [],
      locked: false,
      history: [],
      savedAt: new Date().toISOString(),
    };
  }
}

function Wheel({ names, emojis, rotation }: { names: string[]; emojis: string[]; rotation: number }) {
  const radius = 120;
  const center = 130;
  const slices = Math.max(names.length, 1);
  const sliceAngle = 360 / slices;

  return (
    <motion.svg
      width={2 * center}
      height={2 * center}
      viewBox={`0 0 ${2 * center} ${2 * center}`}
      animate={{ rotate: rotation }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className="drop-shadow-lg"
    >
      {names.map((_, i) => {
        const startAngle = (i * sliceAngle * Math.PI) / 180;
        const endAngle = ((i + 1) * sliceAngle * Math.PI) / 180;
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        const largeArc = sliceAngle > 180 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
            fill={COLORS[i % COLORS.length]}
            stroke="#fff"
            strokeWidth={2}
          />
        );
      })}

      {names.map((name, i) => {
        const angle = ((i + 0.5) * sliceAngle - 90) * (Math.PI / 180);
        const labelRadius = radius * 0.65;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="14"
            fill="#000"
          >
            {emojis[i]} {name}
          </text>
        );
      })}

      <circle cx={center} cy={center} r={20} fill="white" stroke="#000" strokeWidth={2} />
    </motion.svg>
  );
}

export default function ChamaWheel() {
  const exportRef = useRef<HTMLDivElement>(null);

  const [names, setNames] = useState<string[] | null>(null);
  const [emojis, setEmojis] = useState<string[] | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [history, setHistory] = useState<MonthRecord[] | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [currentPick, setCurrentPick] = useState<string | null>(null);
  const [pointerBounce, setPointerBounce] = useState(false);
  const [tempPair, setTempPair] = useState<string[]>([]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = loadStoredData();

    setNames(stored.names);
    setEmojis(stored.emojis);
    setOrder(stored.order);
    setLocked(stored.locked);
    setHistory(stored.history);
  }, []);

  useEffect(() => {
    if (!mounted || names === null || emojis === null || order === null || locked === null || history === null) return;

    const payload: StoredData = {
      names,
      emojis,
      order,
      locked,
      history,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [names, emojis, order, locked, history, mounted]);

  if (!mounted || names === null || emojis === null || order === null || locked === null || history === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-xl text-slate-600 animate-pulse">Loading Muthonjia Chama Wheel...</div>
      </div>
    );
  }

  // ───────────────────────────────────────────────
  // From this point on, we know names, emojis, order, locked, history are NOT null
  // ───────────────────────────────────────────────

  const remainingNames = names.filter(n => n.trim() !== "" && !order.includes(n));

  const spinWheel = () => {
    if (spinning || remainingNames.length === 0 || tempPair.length >= 2) return;
    setLocked(true);
    setSpinning(true);
    setCurrentPick(null);

    const slices = remainingNames.length;
    const sliceAngle = 360 / slices;
    const pickIndex = Math.floor(Math.random() * slices);

    setRotation(prev => prev + 5 * 360 + (slices - pickIndex) * sliceAngle);

    setTimeout(() => {
      const winner = remainingNames[pickIndex];
      setOrder(prev => [...(prev ?? []), winner]);
      setTempPair(prev => [...prev, winner]);
      setPointerBounce(true);
      setTimeout(() => setPointerBounce(false), 800);
      setCurrentPick(winner);
      setSpinning(false);
    }, 3000);
  };

  const saveMonth = async () => {
    if (tempPair.length < 2) {
      alert("Spin twice to select both winners!");
      return;
    }

    const monthIndex = history.length % 12;
    const month = MONTHS[monthIndex];
    let finalPair = [...tempPair];

    if (month === "February") {
      const normalized = names.map(n => n.trim().toLowerCase());
      const dennisIndex = normalized.findIndex(n => n === "dennis" || n === "denno");

      if (dennisIndex !== -1) {
        const dennisName = names[dennisIndex];

        if (finalPair.includes(dennisName)) {
          finalPair = [dennisName, ...finalPair.filter(n => n !== dennisName)];
        } else {
          finalPair = [dennisName, finalPair[1]];

          setOrder(prev => {
            const withoutFirst = (prev ?? []).filter(n => n !== tempPair[0]);
            return [...withoutFirst, ...finalPair];
          });
        }
      }
    }

    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    setHistory(prev => [
      ...(prev ?? []),
      {
        month,
        pair: finalPair,
        date: new Date().toISOString(),
        emojis: finalPair.map(name => {
          const idx = names.indexOf(name);
          return idx !== -1 ? emojis[idx] : "🎉";
        }),
      },
    ]);

    setTempPair([]);
    setLocked(true);

    if (exportRef.current) {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(exportRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save(`Chama-${month}.pdf`);
    }
  };

  const resetChama = () => {
    setNames(Array(TOTAL_MEMBERS).fill(""));
    setEmojis(DEFAULT_EMOJIS);
    setOrder([]);
    setTempPair([]);
    setLocked(false);
    setRotation(0);
    setCurrentPick(null);
    setHistory([]);
  };

  const exportImage = async () => {
    if (!exportRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(exportRef.current);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillText("Muthonjia Cousins Chama", 10, canvas.height - 20);
    }
    const link = document.createElement("a");
    link.download = "chama.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareWhatsApp = () => {
    if (!history || history.length === 0) return;
    const text = `Muthonjia Cousins Chama winners:\n${history
      .map(h => `${h.month}: ${h.pair.join(" & ")}`)
      .join("\n")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-slate-800">Muthonjia Cousins Chama</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-6 rounded-2xl shadow-lg">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xl">{emojis[i]}</span>
              <input
                type="text"
                value={name}
                onChange={e => {
                  const copy = [...names];
                  copy[i] = e.target.value;
                  setNames(copy);
                }}
                placeholder={`Member ${i + 1}`}
                className="border rounded-lg p-3 w-full focus:outline-none focus:ring focus:ring-blue-400 shadow-sm"
                disabled={locked}
              />
            </div>
          ))}
        </div>

        <div ref={exportRef} className="bg-white rounded-3xl p-6 shadow-xl relative">
          <div className="flex justify-center mb-4 relative">
            {remainingNames.length > 0 && (
              <Wheel names={remainingNames} emojis={emojis} rotation={rotation} />
            )}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-10 bg-red-600 rounded-b-xl z-10 shadow-lg"
              animate={pointerBounce ? { rotate: [0, -20, 0, 10, 0] } : { rotate: 0 }}
              transition={{ duration: 0.8 }}
            />
          </div>

          <AnimatePresence>
            {currentPick && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center font-semibold text-green-600 text-lg mt-2"
              >
                {currentPick} is selected!
              </motion.p>
            )}
          </AnimatePresence>

          <ol className="mt-4 list-decimal list-inside text-sm text-slate-700">
            {order.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <button
            onClick={spinWheel}
            disabled={spinning || remainingNames.length === 0 || tempPair.length >= 2}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Spin
          </button>

          <button
            onClick={saveMonth}
            disabled={tempPair.length < 2}
            className="bg-green-600 text-white px-5 py-3 rounded-lg shadow hover:bg-green-700 transition"
          >
            Save Month
          </button>

          <button
            onClick={exportImage}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Export Image
          </button>

          <button
            onClick={shareWhatsApp}
            className="bg-green-500 text-white px-5 py-3 rounded-lg shadow hover:bg-green-600 transition"
          >
            Share WhatsApp
          </button>

          <button
            onClick={resetChama}
            className="bg-red-600 text-white px-5 py-3 rounded-lg shadow hover:bg-red-700 transition"
          >
            Reset
          </button>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-4">
            <h2 className="font-semibold text-lg mb-3 text-slate-800">Monthly Pairs</h2>
            {history.map((h, i) => (
              <div key={i} className="text-sm mb-2">
                <strong className="text-slate-700">{h.month}:</strong>{" "}
                {h.emojis?.join(" ")} {h.pair?.join(" & ")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}