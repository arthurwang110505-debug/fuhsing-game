"use client";

import React from "react";

interface InteractiveEmblemProps {
  activeSymbol: string | null;
  onSelectSymbol?: (symbolId: string) => void;
}

export default function InteractiveEmblem({
  activeSymbol,
  onSelectSymbol,
}: InteractiveEmblemProps) {
  const isHighlighted = (id: string) => activeSymbol === id;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center rounded-2xl border border-[#D9B978]/25 bg-[#101827] p-5 shadow-inner">
        <svg
          viewBox="0 0 260 260"
          className="h-52 w-52 sm:h-60 sm:w-60 select-none"
          role="img"
          aria-label="復興校徽互動拆解圖"
        >
          <defs>
            <radialGradient id="emblemGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#D9B978" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#101827" stopOpacity="0" />
            </radialGradient>
            <filter id="goldHalo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="130" cy="130" r="118" fill="url(#emblemGlow)" />

          {/* 1. Outer Circle */}
          <g
            onClick={() => onSelectSymbol?.("circle")}
            className="cursor-pointer transition-all duration-300"
            filter={isHighlighted("circle") ? "url(#goldHalo)" : undefined}
          >
            <circle
              cx="130"
              cy="130"
              r="108"
              fill="none"
              stroke={isHighlighted("circle") ? "#65C99A" : "#D9B978"}
              strokeWidth={isHighlighted("circle") ? "8" : "5"}
              strokeOpacity={activeSymbol && !isHighlighted("circle") ? 0.35 : 0.95}
            />
            <circle
              cx="130"
              cy="130"
              r="97"
              fill="none"
              stroke={isHighlighted("circle") ? "#65C99A" : "#D9B978"}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity={activeSymbol && !isHighlighted("circle") ? 0.25 : 0.65}
            />
          </g>

          {/* 2. Triangle */}
          <g
            onClick={() => onSelectSymbol?.("triangle")}
            className="cursor-pointer transition-all duration-300"
            filter={isHighlighted("triangle") ? "url(#goldHalo)" : undefined}
          >
            <polygon
              points="130,36 46,184 214,184"
              fill={isHighlighted("triangle") ? "rgba(217,185,120,0.16)" : "rgba(27,42,64,0.65)"}
              stroke={isHighlighted("triangle") ? "#D9B978" : "#C5A86E"}
              strokeWidth={isHighlighted("triangle") ? "5" : "3.5"}
              strokeLinejoin="round"
              opacity={activeSymbol && !isHighlighted("triangle") ? 0.35 : 1}
            />
          </g>

          {/* 3. Five-Petal Plum Flower */}
          <g
            onClick={() => onSelectSymbol?.("plum")}
            className="cursor-pointer transition-all duration-300"
            filter={isHighlighted("plum") ? "url(#goldHalo)" : undefined}
            opacity={activeSymbol && !isHighlighted("plum") ? 0.35 : 1}
          >
            {[0, 72, 144, 216, 288].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 130 134)`}>
                <path
                  d="M130,134 C112,118 108,92 130,84 C152,92 148,118 130,134 Z"
                  fill={isHighlighted("plum") ? "rgba(243,241,234,0.34)" : "rgba(243,241,234,0.16)"}
                  stroke="#F3F1EA"
                  strokeWidth={isHighlighted("plum") ? "2.6" : "1.8"}
                />
              </g>
            ))}
          </g>

          {/* 4. Torch + Dove-shaped Flame */}
          <g
            onClick={() => onSelectSymbol?.("torch")}
            className="cursor-pointer transition-all duration-300"
            filter={isHighlighted("torch") ? "url(#goldHalo)" : undefined}
            opacity={activeSymbol && !isHighlighted("torch") ? 0.35 : 1}
          >
            {/* Torch handle */}
            <path
              d="M123,126 L137,126 L133,174 L127,174 Z"
              fill={isHighlighted("torch") ? "#D9B978" : "#B89552"}
              stroke="#F3F1EA"
              strokeWidth="1.2"
            />
            <rect
              x="118"
              y="120"
              width="24"
              height="7"
              rx="2.5"
              fill="#D9B978"
              stroke="#F3F1EA"
              strokeWidth="1"
            />
            {/* Dove-shaped Flame */}
            <path
              d="M130,118 C116,112 108,97 116,85 C120,92 125,95 129,92 C128,83 132,73 141,70 C138,77 140,83 145,86 C152,90 151,105 138,113 C135,116 132,117 130,118 Z"
              fill={isHighlighted("torch") ? "#E88B5A" : "#D9794A"}
              stroke="#F3F1EA"
              strokeWidth="1.4"
            />
            {/* Subtle wing contour */}
            <path
              d="M120,97 C125,99 131,96 136,89"
              fill="none"
              stroke="#FFF6E5"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Quick element selector pills */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {[
          { id: "triangle", label: "① 三角形" },
          { id: "plum", label: "② 五瓣梅花" },
          { id: "torch", label: "③ 火炬與鴿形火焰" },
          { id: "circle", label: "④ 外圍圓形" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSymbol?.(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeSymbol === item.id
                ? "bg-[#D9B978] text-[#101827] shadow"
                : "border border-[#D9B978]/30 bg-[#101827] text-[#F3F1EA]/85 hover:border-[#D9B978]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
