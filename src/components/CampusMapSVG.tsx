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
            aria-label="復興校園平面示意圖，含藍色跑道、鐘樓、勤學樓、成賢樓、慎思樓、校史館、小花園、操場與行政處室"
          >
            <defs>
              <pattern id="mapDots" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="#B9C9E4" opacity=".42" />
              </pattern>
              <linearGradient id="bldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B5C9E" />
                <stop offset="1" stopColor="#24406F" />
              </linearGradient>
              <linearGradient id="bldAlt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2F4A7C" />
                <stop offset="1" stopColor="#1D3057" />
              </linearGradient>
              <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3C79E4" />
                <stop offset="1" stopColor="#2456B8" />
              </linearGradient>
              <linearGradient id="gardenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#52B07B" />
                <stop offset="1" stopColor="#2F8557" />
              </linearGradient>
              <linearGradient id="courtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5080D2" />
                <stop offset="1" stopColor="#3A62B4" />
              </linearGradient>
              <filter id="pinGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#213155" floodOpacity=".22" />
              </filter>
            </defs>

            {/* Paper field + campus ground */}
            <rect width="640" height="990" fill="#F2F6FD" />
            <rect width="640" height="990" fill="url(#mapDots)" />
            <rect x="22" y="36" width="596" height="922" rx="26" fill="#E9EFFA" stroke="#C9D6EC" strokeWidth="2" filter="url(#mapShadow)" />

            {/* West column: Chengxian Building (vertical) */}
            <rect x="28" y="108" width="110" height="316" rx="10" fill="url(#bldGrad)" />
            <g fill="#93ACD9" opacity=".85">
              {[0, 1, 2, 3, 4].map((row) =>
                [0, 1].map((col) => (
                  <rect key={`c-${row}-${col}`} x={76 + col * 28} y={132 + row * 52} width="22" height="26" rx="3" />
                ))
              )}
            </g>
            <text x="52" y="148" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="700" writingMode="tb" letterSpacing="3">成賢樓</text>

            {/* West lawn strip */}
            <rect x="28" y="446" width="110" height="252" rx="44" fill="url(#gardenGrad)" opacity=".9" />
            <g fill="#2E7D52">
              <circle cx="54" cy="486" r="14" />
              <circle cx="98" cy="502" r="17" />
            </g>
            <g fill="#E5879B">
              <circle cx="46" cy="548" r="3" />
              <circle cx="72" cy="566" r="3" />
              <circle cx="102" cy="552" r="3" />
              <circle cx="58" cy="606" r="3" />
              <circle cx="90" cy="622" r="3" />
              <circle cx="116" cy="600" r="3" />
            </g>
            <rect x="79" y="698" width="12" height="26" rx="5" fill="#DDE5F2" />

            {/* Bell tower plaza (west column, south) */}
            <rect x="28" y="722" width="114" height="226" rx="18" fill="#E3E9F5" />
            <rect x="58" y="798" width="52" height="120" rx="6" fill="#B4553F" />
            <rect x="52" y="794" width="64" height="12" rx="5" fill="#8E3E2E" />
            <path d="M64 794 L84 766 L104 794 Z" fill="#8E3E2E" />
            <rect x="70" y="804" width="28" height="26" rx="11" fill="#8E3E2E" />
            <circle cx="84" cy="817" r="7" fill="#E3B505" />
            <circle cx="84" cy="856" r="10" fill="#F7E9C8" stroke="#8E3E2E" strokeWidth="2.5" />
            <path d="M84 850 V856 L89 859" stroke="#213155" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="38" y="900" width="32" height="12" rx="5" fill="#D9A500" opacity=".85" />
            <text x="85" y="940" textAnchor="middle" fill="#213155" fontSize="20" fontWeight="700" letterSpacing="3">鐘樓</text>

            {/* Blue running track through the middle, west of the main campus */}
            <rect x="152" y="100" width="110" height="780" rx="55" fill="url(#trackGrad)" />
            <rect x="161" y="109" width="92" height="762" rx="46" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".5" />
            <rect x="167" y="115" width="80" height="750" rx="40" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".5" />
            <rect x="173" y="121" width="68" height="738" rx="34" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".5" />
            <rect x="178" y="126" width="58" height="728" rx="29" fill="#5FA268" stroke="#FFFFFF" strokeWidth="2" opacity=".95" />
            <path d="M152 856 V872 M152 108 V124" stroke="#FFFFFF" strokeWidth="3" opacity=".7" />
            <text x="207" y="452" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="700" writingMode="tb" letterSpacing="6" opacity=".95">藍色跑道</text>

            {/* Qinxue Building (top of the main campus) */}
            <rect x="268" y="52" width="262" height="16" rx="8" fill="#1B2F5C" />
            <rect x="276" y="62" width="246" height="128" rx="12" fill="url(#bldGrad)" />
            <g fill="#93ACD9" opacity=".85">
              {[0, 1].map((row) =>
                [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <rect key={`q-${row}-${col}`} x={290 + col * 28} y={88 + row * 32} width="20" height="22" rx="3" />
                ))
              )}
            </g>
            <text x="399" y="176" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="700" letterSpacing="3">勤學樓</text>

            {/* Small garden courtyard */}
            <rect x="276" y="216" width="246" height="130" rx="44" fill="url(#gardenGrad)" />
            <g fill="#2E7D52">
              <circle cx="318" cy="288" r="14" />
              <circle cx="352" cy="278" r="18" />
              <circle cx="386" cy="290" r="15" />
              <circle cx="420" cy="280" r="18" />
              <circle cx="454" cy="288" r="14" />
            </g>
            <g fill="#E5879B">
              <circle cx="300" cy="318" r="3" />
              <circle cx="368" cy="322" r="3" />
              <circle cx="436" cy="314" r="3" />
              <circle cx="486" cy="320" r="3" />
            </g>
            <text x="360" y="252" textAnchor="middle" fill="#FFFFFF" fontSize="21" fontWeight="600" letterSpacing="2">小花園</text>

            {/* School playgrounds */}
            <rect x="276" y="372" width="246" height="140" rx="28" fill="url(#courtGrad)" />
            <path d="M399 384 V500" stroke="#FFFFFF" strokeWidth="2" opacity=".45" />
            <circle cx="399" cy="442" r="24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".45" />
            <text x="347" y="412" textAnchor="middle" fill="#FFFFFF" fontSize="21" fontWeight="600" letterSpacing="2">小學操場</text>
            <rect x="276" y="538" width="246" height="140" rx="28" fill="url(#courtGrad)" />
            <path d="M399 550 V666" stroke="#FFFFFF" strokeWidth="2" opacity=".45" />
            <circle cx="399" cy="608" r="24" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity=".45" />
            <text x="347" y="578" textAnchor="middle" fill="#FFFFFF" fontSize="21" fontWeight="600" letterSpacing="2">中學操場</text>

            {/* Quiet courtyard with a bench (finish point) */}
            <rect x="276" y="704" width="246" height="146" rx="36" fill="#B7D8BE" opacity=".55" />
            <rect x="330" y="762" width="60" height="20" rx="4" fill="#C08552" />
            <rect x="330" y="782" width="60" height="8" rx="3" fill="#A9713F" />
            <rect x="338" y="790" width="6" height="16" rx="2" fill="#A9713F" />
            <rect x="376" y="790" width="6" height="16" rx="2" fill="#A9713F" />
            <g fill="#2E7D52">
              <circle cx="430" cy="768" r="14" />
              <circle cx="462" cy="792" r="17" />
              <circle cx="494" cy="768" r="13" />
            </g>

            {/* East wing: Shensi Building, History Museum, Administration */}
            <rect x="534" y="62" width="84" height="336" rx="10" fill="url(#bldGrad)" />
            <g fill="#93ACD9" opacity=".85">
              {[0, 1, 2, 3, 4].map((row) => (
                <rect key={`s-${row}`} x={572} y={92 + row * 56} width="34" height="26" rx="3" />
              ))}
            </g>
            <text x="549" y="130" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="700" writingMode="tb" letterSpacing="3">慎思樓</text>
            <rect x="534" y="424" width="84" height="120" rx="10" fill="url(#bldAlt)" />
            <rect x="534" y="424" width="84" height="12" rx="6" fill="#E3B505" />
            <circle cx="576" cy="458" r="10" fill="none" stroke="#E3B505" strokeWidth="2.5" />
            <text x="576" y="532" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="700" letterSpacing="1">校史館</text>
            <rect x="534" y="570" width="84" height="280" rx="10" fill="url(#bldGrad)" />
            <g fill="#93ACD9" opacity=".85">
              {[0, 1, 2, 3].map((row) => (
                <rect key={`a-${row}`} x={572} y={616 + row * 52} width="34" height="24" rx="3" />
              ))}
            </g>
            <text x="549" y="612" textAnchor="middle" fill="#FFFFFF" fontSize="17" fontWeight="700" writingMode="tb" letterSpacing="3">行政處室</text>

            {/* Path from the bell plaza toward the south gate */}
            <rect x="142" y="896" width="202" height="8" rx="4" fill="#DDE5F2" />

            {/* South gate, guard post and the golden front road */}
            <rect x="348" y="882" width="84" height="12" rx="4" fill="#223B6E" />
            <rect x="352" y="894" width="14" height="48" rx="4" fill="#223B6E" />
            <rect x="414" y="894" width="14" height="48" rx="4" fill="#223B6E" />
            <rect x="446" y="902" width="42" height="40" rx="5" fill="url(#bldAlt)" />
            <rect x="454" y="912" width="10" height="10" rx="2" fill="#93ACD9" />
            <rect x="470" y="912" width="10" height="10" rx="2" fill="#93ACD9" />
            <rect x="306" y="912" width="34" height="12" rx="5" fill="#D9A500" opacity=".85" />
            <g fill="#2E7D52">
              <circle cx="176" cy="912" r="13" />
              <circle cx="232" cy="918" r="15" />
              <circle cx="546" cy="908" r="13" />
            </g>
            <path d="M30 952 H610" fill="none" stroke="#D9A500" strokeWidth="6" strokeLinecap="round" />

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
            ※ 依參考位置繪製之校園示意圖，建築配置為大概位置，非精確平面圖。
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
