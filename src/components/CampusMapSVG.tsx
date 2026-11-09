"use client";

import React, { useRef, useState } from "react";
import type { PublicMission } from "@/types/game";
import {
  CheckCircle2,
  Compass,
  Lock,
  MapPin,
  Maximize2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ArrowRight,
} from "lucide-react";

interface CampusMapSVGProps {
  missions: PublicMission[];
  completedMissions: number[];
  unlockedIds: number[];
  onSelectMission: (mission: PublicMission) => void;
}

export default function CampusMapSVG({
  missions,
  completedMissions,
  unlockedIds,
  onSelectMission,
}: CampusMapSVGProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<number>(
    missions.find((m) => !completedMissions.includes(m.id) && unlockedIds.includes(m.id))?.id ??
      missions[0]?.id ??
      1
  );

  const draggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const completedSet = new Set(completedMissions);
  const unlockedSet = new Set(unlockedIds);

  const selectedMission = missions.find((m) => m.id === selectedId) ?? missions[0];

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.2, Number((prev + 0.3).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.3).toFixed(2)));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const clampOffset = (nx: number, ny: number, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 };
    const maxPanX = 240 * (currentScale - 1);
    const maxPanY = 170 * (currentScale - 1);
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, nx)),
      y: Math.max(-maxPanY, Math.min(maxPanY, ny)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-map-pin='true']")) return;
    if (scale <= 1) return;
    draggingRef.current = true;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    setOffset(clampOffset(pointerStartRef.current.ox + dx, pointerStartRef.current.oy + dy, scale));
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const focusOnMission = (mission: PublicMission) => {
    setSelectedId(mission.id);
  };

  return (
    <div className="space-y-4">
      {/* Map Controls & Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9B978]/20 bg-[#1B2A40] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#F3F1EA]/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D9B978] shadow-[0_0_8px_#D9B978]" />
            可探索任務
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#65C99A] shadow-[0_0_8px_#65C99A]" />
            已完成任務
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#64748B]" />
            尚未解鎖
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            aria-label="縮小地圖"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9B978]/30 bg-[#101827] text-[#F3F1EA] transition hover:border-[#D9B978] disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[48px] text-center font-mono text-xs text-[#D9B978]">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.2}
            aria-label="放大地圖"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9B978]/30 bg-[#101827] text-[#F3F1EA] transition hover:border-[#D9B978] disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#D9B978]/30 bg-[#101827] px-3 text-xs font-medium text-[#D9B978] transition hover:bg-[#D9B978]/10"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            返回完整地圖
          </button>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative w-full overflow-hidden rounded-3xl border border-[#D9B978]/30 bg-[#0D1422] shadow-[0_24px_60px_rgba(6,10,18,0.65)] ${
          scale > 1 ? "cursor-grab active:cursor-grabbing touch-none" : "touch-pan-y"
        }`}
      >
        <div
          className="w-full origin-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <svg
            viewBox="0 0 1000 650"
            className="block h-auto w-full select-none"
            role="img"
            aria-label="復興實中校園探索互動示意地圖"
          >
            <defs>
              {/* Atmospheric Twilight Sky & Ground */}
              <linearGradient id="campusSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#121E32" />
                <stop offset="65%" stopColor="#17263D" />
                <stop offset="100%" stopColor="#101827" />
              </linearGradient>
              {/* Red Brick Facade */}
              <linearGradient id="redBrick" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8F4339" />
                <stop offset="100%" stopColor="#6B2F28" />
              </linearGradient>
              <linearGradient id="redBrickLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A24E42" />
                <stop offset="100%" stopColor="#7C382F" />
              </linearGradient>
              {/* Architectural Grey Stone Trim */}
              <linearGradient id="greyStone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              {/* Courtyard Greenery */}
              <radialGradient id="courtyardGreen" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#264E43" />
                <stop offset="100%" stopColor="#17322E" />
              </radialGradient>
              {/* Soft Pin Glow */}
              <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Subtle Architectural Grid */}
              <pattern id="draftGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(217,185,120,0.06)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Base Canvas */}
            <rect width="1000" height="650" fill="url(#campusSky)" />
            <rect width="1000" height="650" fill="url(#draftGrid)" />

            {/* Compass Rose (Top Left) */}
            <g transform="translate(65, 62)" opacity="0.72">
              <circle cx="0" cy="0" r="24" fill="none" stroke="#D9B978" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M0,-18 L4,-4 L0,-7 L-4,-4 Z" fill="#D9B978" />
              <path d="M0,18 L4,4 L0,7 L-4,4 Z" fill="#64748B" />
              <text x="0" y="-27" textAnchor="middle" fill="#D9B978" fontSize="10" fontWeight="600">
                N 北側高樓採光區
              </text>
            </g>

            {/* Dunhua South Road Boulevard (Bottom Edge) */}
            <g>
              <rect x="0" y="565" width="1000" height="85" fill="#0B111C" />
              <line x1="0" y1="565" x2="1000" y2="565" stroke="#D9B978" strokeOpacity="0.35" strokeWidth="2" />
              {/* Road lane dashes */}
              <line
                x1="30"
                y1="612"
                x2="970"
                y2="612"
                stroke="#D9B978"
                strokeOpacity="0.22"
                strokeWidth="2"
                strokeDasharray="18 16"
              />
              {/* Boulevard Street Trees */}
              {[75, 165, 345, 445, 575, 695, 815, 920].map((tx) => (
                <g key={tx} transform={`translate(${tx}, 556)`}>
                  <circle cx="0" cy="0" r="18" fill="#1F4A3F" stroke="#65C99A" strokeOpacity="0.35" strokeWidth="1" />
                  <circle cx="-5" cy="-4" r="9" fill="#2A6352" opacity="0.8" />
                </g>
              ))}
              <text x="500" y="596" textAnchor="middle" fill="#D9B978" fontSize="13" letterSpacing="3" opacity="0.85">
                敦化南路一段林蔭大道意象・南側校園入口
              </text>
            </g>

            {/* Campus Boundary Ground Pad */}
            <rect
              x="70"
              y="88"
              width="860"
              height="455"
              rx="22"
              fill="#152236"
              stroke="rgba(217,185,120,0.22)"
              strokeWidth="1.5"
            />

            {/* Main Courtyard Garden & Walkways */}
            <rect
              x="295"
              y="265"
              width="350"
              height="245"
              rx="24"
              fill="url(#courtyardGreen)"
              stroke="rgba(101,201,154,0.35)"
              strokeWidth="1.5"
            />

            {/* Courtyard Stepping Pathways & Fountain */}
            <path
              d="M250,545 L250,480 L470,480 L470,385 M270,365 L650,365 M470,275 L470,200"
              fill="none"
              stroke="#C9B07C"
              strokeOpacity="0.32"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M250,545 L250,480 L470,480 L470,385 M270,365 L650,365 M470,275 L470,200"
              fill="none"
              stroke="#F3F1EA"
              strokeOpacity="0.14"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* Small Garden Trees & Aquaponics Feature */}
            {[
              [345, 325],
              [335, 455],
              [575, 455],
              [595, 330],
            ].map(([gx, gy], idx) => (
              <g key={idx} transform={`translate(${gx}, ${gy})`}>
                <circle cx="0" cy="0" r="21" fill="#235747" stroke="#65C99A" strokeOpacity="0.45" />
                <circle cx="-4" cy="-5" r="11" fill="#327A62" opacity="0.7" />
              </g>
            ))}
            {/* Aquaponics & Fountain Ring */}
            <g transform="translate(475, 430)">
              <ellipse cx="0" cy="0" rx="44" ry="24" fill="#173D4A" stroke="#65C99A" strokeOpacity="0.55" strokeWidth="1.5" />
              <ellipse cx="0" cy="0" rx="22" ry="11" fill="#215B6B" opacity="0.8" />
              <text x="0" y="39" textAnchor="middle" fill="#A5E5C7" fontSize="11" fontWeight="500">
                小花園・魚菜共生生態區
              </text>
            </g>

            {/* Campus Entrance Gate (South-West) */}
            <g transform="translate(212, 515)">
              <rect x="0" y="0" width="76" height="36" rx="6" fill="url(#redBrick)" stroke="#D9B978" strokeWidth="1.5" />
              <rect x="14" y="10" width="48" height="26" rx="3" fill="#101827" />
              <text x="38" y="-8" textAnchor="middle" fill="#F3F1EA" fontSize="11" fontWeight="600">
                校園正門意象
              </text>
            </g>

            {/* Iconic Left Bell Tower (鐘樓 / 鐘塔) */}
            <g transform="translate(115, 290)">
              {/* Tower shadow */}
              <rect x="10" y="12" width="110" height="142" rx="10" fill="rgba(0,0,0,0.35)" />
              {/* Tower Brick Body */}
              <rect x="0" y="0" width="110" height="142" rx="8" fill="url(#redBrickLight)" stroke="#94A3B8" strokeWidth="2" />
              {/* Grey Stone Belts */}
              <rect x="-4" y="28" width="118" height="10" rx="2" fill="url(#greyStone)" />
              <rect x="-4" y="92" width="118" height="10" rx="2" fill="url(#greyStone)" />
              {/* Bell Arches & Clock Face */}
              <circle cx="55" cy="60" r="18" fill="#101827" stroke="#D9B978" strokeWidth="2.5" />
              <line x1="55" y1="60" x2="55" y2="48" stroke="#D9B978" strokeWidth="2" strokeLinecap="round" />
              <line x1="55" y1="60" x2="64" y2="63" stroke="#D9B978" strokeWidth="2" strokeLinecap="round" />
              {/* Copper spire roof top */}
              <polygon points="10,0 55,-28 100,0" fill="#8D5A44" stroke="#D9B978" strokeWidth="1.5" />
              <text x="55" y="162" textAnchor="middle" fill="#F3F1EA" fontSize="12" fontWeight="600">
                左側鐘樓（鐘塔）
              </text>
            </g>

            {/* Flagpole & Campus Flags Zone (North Courtyard) */}
            <g transform="translate(385, 210)">
              <rect x="0" y="0" width="90" height="44" rx="10" fill="#1A293F" stroke="#D9B978" strokeOpacity="0.4" />
              {/* 3 Flagpoles */}
              {[22, 45, 68].map((fx, i) => (
                <g key={fx}>
                  <line x1={fx} y1="34" x2={fx} y2="6" stroke="#F3F1EA" strokeWidth="1.8" />
                  <path
                    d={`M${fx},7 Q${fx + 10},4 ${fx + 17},9 Q${fx + 10},14 ${fx},15 Z`}
                    fill={i === 1 ? "#D9B978" : "#B64D40"}
                  />
                </g>
              ))}
              <text x="45" y="58" textAnchor="middle" fill="#E8D8B0" fontSize="11">
                升旗台與旗幟步道
              </text>
            </g>

            {/* North Stepped Academic Buildings (Red Brick & Grey Framing) */}
            {/* Left-North Archive Wing (校史館意象) */}
            <g transform="translate(495, 112)">
              <rect x="0" y="0" width="185" height="92" rx="8" fill="url(#redBrick)" stroke="#64748B" strokeWidth="2" />
              <rect x="10" y="12" width="165" height="18" rx="3" fill="#1E293B" opacity="0.85" />
              <rect x="10" y="40" width="165" height="18" rx="3" fill="#1E293B" opacity="0.85" />
              <text x="92" y="80" textAnchor="middle" fill="#F3F1EA" fontSize="12" fontWeight="600">
                校史館・典藏空間意象
              </text>
            </g>

            {/* Right-North Tall Wing (成賢・勤學・慎思樓・國學館・圖書館群意象) */}
            <g transform="translate(698, 112)">
              <rect x="0" y="0" width="195" height="180" rx="10" fill="url(#redBrickLight)" stroke="#94A3B8" strokeWidth="2" />
              {/* Grey structural ribs & windows */}
              {[20, 56, 92, 128].map((wy) => (
                <rect key={wy} x="16" y={wy} width="162" height="20" rx="3" fill="#172438" stroke="#64748B" strokeOpacity="0.6" />
              ))}
              <text x="98" y="168" textAnchor="middle" fill="#F3F1EA" fontSize="12" fontWeight="600">
                主要教學樓群（成賢/勤學/慎思）
              </text>
            </g>

            {/* Elevated Connecting Skybridge & Outdoor Staircases */}
            <g>
              {/* Connecting Bridge between Bell Tower Wing and Courtyard */}
              <rect
                x="222"
                y="348"
                width="102"
                height="24"
                rx="4"
                fill="url(#greyStone)"
                stroke="#D9B978"
                strokeOpacity="0.45"
              />
              {/* Connecting Bridge between North Wing and East Building */}
              <rect
                x="672"
                y="148"
                width="34"
                height="32"
                rx="3"
                fill="url(#greyStone)"
                stroke="#D9B978"
                strokeOpacity="0.45"
              />
              {/* Outdoor Staircase Illustration */}
              <g transform="translate(662, 260)">
                <rect x="0" y="0" width="48" height="72" rx="6" fill="#2C3E57" stroke="#94A3B8" strokeWidth="1.5" />
                {[10, 20, 30, 40, 50, 60].map((sy) => (
                  <line key={sy} x1="6" y1={sy} x2="42" y2={sy} stroke="#D9B978" strokeOpacity="0.6" strokeWidth="2" />
                ))}
                <text x="24" y="88" textAnchor="middle" fill="#CBD5E1" fontSize="10">
                  戶外連結階梯
                </text>
              </g>
            </g>

            {/* East Administration Arcade Wing */}
            <g transform="translate(675, 368)">
              <rect x="0" y="0" width="215" height="128" rx="10" fill="url(#redBrick)" stroke="#64748B" strokeWidth="2" />
              <rect x="14" y="16" width="187" height="36" rx="4" fill="#131F31" />
              <rect x="14" y="64" width="187" height="28" rx="4" fill="#131F31" />
              <text x="108" y="114" textAnchor="middle" fill="#F3F1EA" fontSize="12" fontWeight="600">
                行政服務穿堂意象區
              </text>
            </g>

            {/* Connecting Trail Lines Between Sequential Nodes */}
            <path
              d={missions.map((m, idx) => `${idx === 0 ? "M" : "L"}${m.mapX},${m.mapY}`).join(" ")}
              fill="none"
              stroke="#D9B978"
              strokeOpacity="0.22"
              strokeWidth="2"
              strokeDasharray="5 7"
            />

            {/* Interactive 8 Mission Nodes */}
            {missions.map((mission) => {
              const isCompleted = completedSet.has(mission.id);
              const isUnlocked = unlockedSet.has(mission.id);
              const isSelected = selectedMission?.id === mission.id;

              const pinFill = isCompleted
                ? "#65C99A"
                : isUnlocked
                ? "#D9B978"
                : "#475569";

              return (
                <g
                  key={mission.id}
                  data-map-pin="true"
                  transform={`translate(${mission.mapX}, ${mission.mapY})`}
                  onClick={() => focusOnMission(mission)}
                  className="cursor-pointer"
                >
                  {/* Soft ambient halo for unlocked/active pins */}
                  {isUnlocked && (
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? "30" : "24"}
                      fill={isCompleted ? "rgba(101, 201, 154, 0.22)" : "rgba(217, 185, 120, 0.26)"}
                      className="animate-pulse-ring"
                    />
                  )}

                  {/* Selected Outer Ring */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="27"
                      fill="none"
                      stroke="#F3F1EA"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Core Pin Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="19"
                    fill="#101827"
                    stroke={pinFill}
                    strokeWidth="3.5"
                    filter={isUnlocked ? "url(#pinGlow)" : undefined}
                  />

                  <text
                    x="0"
                    y="4.5"
                    textAnchor="middle"
                    fill={pinFill}
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {mission.id.toString().padStart(2, "0")}
                  </text>

                  {/* Completed miniature badge */}
                  {isCompleted && (
                    <circle cx="14" cy="-14" r="7" fill="#65C99A" stroke="#101827" strokeWidth="2" />
                  )}

                  {/* Pill Label below pin */}
                  <g transform="translate(0, 31)">
                    <rect
                      x="-54"
                      y="-11"
                      width="108"
                      height="21"
                      rx="10.5"
                      fill="#101827"
                      fillOpacity="0.92"
                      stroke={isSelected ? "#F3F1EA" : pinFill}
                      strokeOpacity={isSelected ? 0.9 : 0.45}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isUnlocked ? "#F3F1EA" : "#94A3B8"}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {mission.title}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Schematic Map Disclaimer Overlay */}
        <div className="border-t border-[#D9B978]/15 bg-[#101827]/95 px-4 py-2 text-[11px] text-[#F3F1EA]/65 flex flex-wrap items-center justify-between gap-2">
          <span>
            ※ 本圖為「校園探索示意地圖」（依校園紅磚鐘樓、中庭綠意等視覺特色與公開資料繪製，非精確建築平面圖）
          </span>
          <span className="text-[#D9B978]">點擊任一發光編號節點查看任務</span>
        </div>
      </div>

      {/* Selected Mission Preview Card (directly actionable on Mobile & Desktop) */}
      {selectedMission && (
        <div className="archive-card rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#D9B978]/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#D9B978]">
                  MISSION {selectedMission.id.toString().padStart(2, "0")}
                </span>
                {completedSet.has(selectedMission.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#65C99A]/15 px-2.5 py-0.5 text-xs font-medium text-[#65C99A]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 已完成・已取得碎片「{selectedMission.fragmentName}」
                  </span>
                ) : unlockedSet.has(selectedMission.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D9B978]/15 px-2.5 py-0.5 text-xs font-medium text-[#D9B978]">
                    <Sparkles className="h-3.5 w-3.5" /> 可進行探索
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                    <Lock className="h-3.5 w-3.5" /> 需先完成 Mission 01～07 解鎖
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold text-[#F3F1EA]">
                {selectedMission.title} — {selectedMission.subtitle}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#F3F1EA]/75">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#D9B978]" />
                  探索地點：{selectedMission.locationName}
                </span>
                <span className="inline-flex items-center gap-1 text-[#F3F1EA]/55">
                  <Compass className="h-3.5 w-3.5" />
                  {selectedMission.locationNote}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!unlockedSet.has(selectedMission.id)}
              onClick={() => onSelectMission(selectedMission)}
              className={`inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                unlockedSet.has(selectedMission.id)
                  ? "bg-[#D9B978] text-[#101827] hover:bg-[#E4C98F] shadow-[0_8px_24px_rgba(217,185,120,0.28)]"
                  : "cursor-not-allowed border border-slate-600/50 bg-slate-800/70 text-slate-400"
              }`}
            >
              {completedSet.has(selectedMission.id)
                ? "重溫關卡與解答"
                : unlockedSet.has(selectedMission.id)
                ? "開始探索此關卡"
                : "尚未解鎖"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
