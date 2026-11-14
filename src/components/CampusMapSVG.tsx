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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#103FA0]/20 bg-[#EAF0FA] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#213155]/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F9CF00] shadow-[0_0_8px_#F9CF00]" />
            可探索任務
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#008250] shadow-[0_0_8px_#008250]" />
            已完成任務
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8FA0BC]" />
            尚未解鎖
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            aria-label="縮小地圖"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#103FA0]/30 bg-[#EAF0FA] text-[#213155] transition hover:border-[#103FA0] disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[48px] text-center font-mono text-xs text-[#103FA0]">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.2}
            aria-label="放大地圖"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#103FA0]/30 bg-[#EAF0FA] text-[#213155] transition hover:border-[#103FA0] disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#103FA0]/30 bg-[#EAF0FA] px-3 text-xs font-medium text-[#103FA0] transition hover:bg-[#103FA0]/10"
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
        onWheel={(event) => {
          event.preventDefault();
          setScale((current) => {
            const next = Math.max(1, Math.min(2.2, Number((current + (event.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
            return next;
          });
        }}
        className={`relative w-full overflow-hidden rounded-3xl border border-[#103FA0]/30 bg-[#EAF0FA] shadow-[0_24px_60px_rgba(33,49,85,0.16)] ${
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
            viewBox="0 0 640 990"
            className="block h-auto w-full select-none"
            role="img"
            aria-label="依照參考配置重繪的復興校園平面示意圖，含勤學樓、成賢樓、慎思樓、校史館、花園、操場與行政處室樓層"
          >
            <defs>
              <pattern id="mapDots" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="#B9C9E4" opacity=".42" />
              </pattern>
              <linearGradient id="mapFrame" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2E4E8F" />
                <stop offset="1" stopColor="#16294D" />
              </linearGradient>
              <linearGradient id="mapWing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4C79CC" />
                <stop offset="1" stopColor="#2F5CB0" />
              </linearGradient>
              <filter id="pinGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#213155" floodOpacity=".22" />
              </filter>
            </defs>

            {/* Soft drafting-paper field and the building's long outer wing */}
            <rect width="640" height="990" fill="#F2F6FD" />
            <rect width="640" height="990" fill="url(#mapDots)" />
            <rect x="76" y="18" width="501" height="814" rx="10" fill="url(#mapFrame)" filter="url(#mapShadow)" />
            <rect x="10" y="70" width="68" height="440" rx="8" fill="#2E4E8F" />
            <path d="M91 77 H181 Q193 77 193 89 V975 H29 V843 H79 V89 Q79 77 91 77Z" fill="url(#mapWing)" />
            <path d="M30 976 H544" fill="none" stroke="#D9A500" strokeWidth="6" strokeLinecap="round" />

            {/* Building names */}
            <text x="326" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="700" letterSpacing="2">勤學樓</text>
            <text x="44" y="240" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="700" writingMode="tb">成賢樓</text>
            <text x="41" y="921" textAnchor="start" fill="#FFFFFF" fontSize="14" fontWeight="600">鐘樓</text>

            {/* North passage and the small garden court */}
            <rect x="191" y="77" width="312" height="59" rx="5" fill="#46669F" />
            <rect x="186" y="135" width="314" height="212" rx="54" fill="#2E8B57" />
            <text x="343" y="239" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="600">小花園</text>

            {/* Central green passage, walls, and basement stairs */}
            <path d="M218 361 Q218 344 235 344 H449 Q466 344 466 361 V490 Q466 513 444 513 H237 Q218 513 218 494Z" fill="#2E8B57" />
            <rect x="193" y="345" width="28" height="159" rx="7" fill="#46669F" />
            <text x="207" y="388" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600" writingMode="tb">下B1的階梯</text>
            <rect x="461" y="349" width="28" height="160" rx="7" fill="#46669F" />
            <text x="475" y="392" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600" writingMode="tb">下B1的階梯</text>
            <rect x="322" y="348" width="25" height="69" rx="4" fill="#16294D" />
            <rect x="322" y="441" width="25" height="72" rx="4" fill="#16294D" />
            <text x="334.5" y="387" textAnchor="middle" fill="#FFFFFF" fontSize="14" writingMode="tb">牆</text>
            <text x="334.5" y="480" textAnchor="middle" fill="#FFFFFF" fontSize="14" writingMode="tb">牆</text>
            <rect x="217" y="510" width="247" height="25" rx="6" fill="#46669F" />
            <text x="340.5" y="528" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="600">階梯</text>

            {/* Primary and middle-school playgrounds with the connecting stair */}
            <rect x="217" y="535" width="259" height="155" rx="38" fill="#3D6DB8" />
            <text x="346" y="615" textAnchor="middle" fill="#FFFFFF" fontSize="23" fontWeight="600">小學操場</text>
            <rect x="216" y="690" width="253" height="33" rx="6" fill="#46669F" />
            <text x="342.5" y="712" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="600">階梯</text>
            <rect x="213" y="723" width="263" height="155" rx="42" fill="#3D6DB8" />
            <text x="344.5" y="811" textAnchor="middle" fill="#FFFFFF" fontSize="23" fontWeight="600">中學操場</text>
            <rect x="192" y="534" width="24" height="333" rx="7" fill="#46669F" />
            <text x="204" y="566" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600" writingMode="tb">上到藍色跑道的階梯</text>

            {/* East wing: museum, building name, and the three office floors */}
            <rect x="518" y="73" width="50" height="158" rx="8" fill="#46669F" />
            <text x="543" y="94" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="600" writingMode="tb">校史館在七樓</text>
            <text x="542" y="354" textAnchor="middle" fill="#FFFFFF" fontSize="23" fontWeight="600" writingMode="tb">慎思樓</text>
            <rect x="524" y="560" width="44" height="168" rx="8" fill="#46669F" />
            <text x="546" y="580" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="600" writingMode="tb">學務處：4樓</text>
            <rect x="518" y="741" width="52" height="39" rx="6" fill="#46669F" />
            <text x="544" y="757" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700"><tspan x="544">教務處</tspan><tspan x="544" dy="13">5樓</tspan></text>
            <rect x="518" y="786" width="52" height="39" rx="6" fill="#46669F" />
            <text x="544" y="802" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700"><tspan x="544">輔導室</tspan><tspan x="544" dy="13">6樓</tspan></text>

            {/* Southern flower bed and guard room */}
            <rect x="298" y="885" width="90" height="23" rx="4" fill="#D9A500" />
            <text x="343" y="901" textAnchor="middle" fill="#213155" fontSize="12" fontWeight="600">花圃</text>
            <rect x="388" y="925" width="30" height="50" rx="4" fill="#D9A500" />
            <text x="403" y="948" textAnchor="middle" fill="#213155" fontSize="7" fontWeight="600" writingMode="tb">警衛室</text>

            {/* Compact numbered mission markers */}
            {missions.map((mission) => {
              const isCompleted = completedSet.has(mission.id);
              const isUnlocked = unlockedSet.has(mission.id);
              const isSelected = selectedMission?.id === mission.id;
              const pinFill = isCompleted ? "#3FC08D" : isUnlocked ? "#F9CF00" : "#A9B7CE";
              return (
                <g
                  key={mission.id}
                  data-map-pin="true"
                  transform={`translate(${mission.mapX}, ${mission.mapY})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Mission ${mission.id}: ${mission.title}${isCompleted ? "，已完成" : isUnlocked ? "，可探索" : "，尚未解鎖"}`}
                  aria-pressed={isSelected}
                  onClick={() => focusOnMission(mission)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      focusOnMission(mission);
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#103FA0]"
                >
                  {isUnlocked && <circle cx="0" cy="0" r={isSelected ? "23" : "19"} fill={isCompleted ? "rgba(63,192,141,.30)" : "rgba(249,207,0,.32)"} />}
                  {isSelected && <circle cx="0" cy="0" r="22" fill="none" stroke="#103FA0" strokeWidth="2" strokeDasharray="4 3" />}
                  <circle cx="0" cy="0" r="14" fill="#213155" stroke={pinFill} strokeWidth="3" filter={isUnlocked ? "url(#pinGlow)" : undefined} />
                  <text x="0" y="4" textAnchor="middle" fill={pinFill} fontSize="9" fontWeight="700" fontFamily="monospace">{mission.id.toString().padStart(2, "0")}</text>
                  {isCompleted && <circle cx="10" cy="-10" r="5" fill="#3FC08D" stroke="#213155" strokeWidth="1.5" />}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Schematic Map Disclaimer Overlay */}
        <div className="border-t border-[#103FA0]/15 bg-white/92 px-4 py-2 text-[11px] text-[#213155]/65 flex flex-wrap items-center justify-between gap-2">
          <span>
            ※ 依參考圖以 SVG 重新繪製，未直接嵌入原圖；非比例尺導航圖，處室樓層依指定資訊標示。
          </span>
          <span className="text-[#103FA0]">點擊任一發光編號節點查看任務</span>
        </div>
      </div>

      {/* Keyboard- and touch-friendly alternative to the small SVG markers. */}
      <nav aria-label="選擇地圖任務" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {missions.map((mission) => {
          const done = completedSet.has(mission.id);
          const unlocked = unlockedSet.has(mission.id);
          const selected = selectedId === mission.id;
          return (
            <button
              key={mission.id}
              type="button"
              aria-pressed={selected}
              onClick={() => focusOnMission(mission)}
              className={`min-h-12 rounded-xl border px-3 py-2 text-left text-xs transition ${
                selected ? "border-[#103FA0] bg-[#F9CF00]/15 text-[#213155]" : "border-[#103FA0]/20 bg-[#EAF0FA] text-[#213155]/80 hover:border-[#103FA0]/60"
              }`}
            >
              <span className="mr-1.5 font-mono font-bold text-[#103FA0]">{String(mission.id).padStart(2, "0")}</span>
              <span>{mission.title}</span>
              <span className="sr-only">{done ? "，已完成" : unlocked ? "，可探索" : "，尚未解鎖"}</span>
            </button>
          );
        })}
      </nav>

      {/* Selected Mission Preview Card (directly actionable on Mobile & Desktop) */}
      {selectedMission && (
        <div className="archive-card rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F9CF00]/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#103FA0]">
                  MISSION {selectedMission.id.toString().padStart(2, "0")}
                </span>
                {completedSet.has(selectedMission.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#008250]/15 px-2.5 py-0.5 text-xs font-medium text-[#008250]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 已完成・已取得碎片「{selectedMission.fragmentName}」
                  </span>
                ) : unlockedSet.has(selectedMission.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F9CF00]/15 px-2.5 py-0.5 text-xs font-medium text-[#103FA0]">
                    <Sparkles className="h-3.5 w-3.5" /> 可進行探索
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#213155]/8 px-2.5 py-0.5 text-xs font-medium text-[#213155]/55">
                    <Lock className="h-3.5 w-3.5" /> 需先完成 Mission 01～07 解鎖
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold text-[#213155]">
                {selectedMission.title} — {selectedMission.subtitle}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#213155]/75">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#103FA0]" />
                  探索地點：{selectedMission.locationName}
                </span>
                <span className="inline-flex items-center gap-1 text-[#213155]/55">
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
                  ? "bg-[#F9CF00] text-[#213155] hover:bg-[#FFDD33] shadow-[0_8px_24px_rgba(249,207,0,0.28)]"
                  : "cursor-not-allowed border border-[#213155]/15 bg-[#213155]/6 text-[#213155]/55"
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
