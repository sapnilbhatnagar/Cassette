"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import type { Region } from "@/constants/regions";

interface UKMapProps {
  selectedRegionIds: string[];
  regions: Region[];
  onFlipToDashboard?: () => void;
}

const CX = 250;
const CY = 330;

const REGION_FILLS: Record<string, string> = {
  scotland:
    "M 155,20 L 185,12 L 230,15 L 268,25 L 285,45 L 278,70 L 255,90 L 230,100 L 205,98 L 178,88 L 158,68 L 148,48 Z",
  "northern-ireland":
    "M 88,130 L 120,118 L 145,125 L 152,148 L 138,165 L 110,170 L 88,158 L 80,143 Z",
  "north-west":
    "M 185,200 L 230,192 L 268,200 L 275,228 L 265,255 L 240,262 L 210,258 L 188,242 L 178,220 Z",
  "north-east":
    "M 270,192 L 308,188 L 325,200 L 320,225 L 305,242 L 275,245 L 265,228 Z",
  yorkshire:
    "M 255,255 L 305,248 L 322,268 L 318,295 L 298,310 L 268,308 L 248,292 L 242,270 Z",
  midlands:
    "M 218,290 L 268,285 L 308,295 L 318,325 L 308,355 L 280,368 L 248,365 L 220,350 L 208,325 L 210,302 Z",
  wales:
    "M 148,288 L 188,282 L 215,295 L 218,325 L 205,358 L 180,372 L 152,365 L 132,345 L 128,315 L 138,298 Z",
  "east-england":
    "M 318,295 L 368,285 L 395,310 L 390,348 L 365,368 L 332,368 L 312,350 L 308,325 Z",
  "london-se":
    "M 288,380 L 340,370 L 388,378 L 415,400 L 410,430 L 385,448 L 348,452 L 312,442 L 288,422 L 280,402 Z",
  "south-west":
    "M 145,368 L 205,362 L 245,380 L 250,412 L 238,445 L 205,458 L 165,452 L 135,432 L 120,402 L 128,378 Z",
  "south-east":
    "M 250,392 L 290,382 L 320,395 L 325,420 L 310,445 L 278,455 L 248,445 L 235,422 Z",
};

const UK_OUTLINE =
  "M 165,18 L 195,10 L 235,14 L 275,24 L 295,42 L 290,65 L 268,88 L 275,110 L 290,128 L 308,148 L 318,172 L 325,192 L 332,218 L 335,245 L 330,270 L 320,295 L 325,325 L 338,355 L 368,375 L 400,395 L 418,422 L 412,452 L 388,470 L 348,478 L 305,472 L 268,458 L 235,448 L 198,455 L 162,452 L 128,438 L 105,415 L 100,385 L 118,362 L 132,338 L 128,310 L 120,282 L 138,262 L 148,238 L 158,215 L 162,188 L 168,162 L 158,140 L 148,118 L 150,92 L 155,65 L 155,42 Z";

const IRELAND_OUTLINE =
  "M 50,120 L 88,108 L 118,112 L 140,130 L 148,155 L 140,178 L 118,192 L 88,195 L 62,182 L 45,160 L 42,138 Z";

const RIVERS = [
  "M 415,415 Q 380,418 348,422 Q 318,428 295,432",
  "M 182,348 Q 172,365 162,382 Q 148,405 138,428",
  "M 278,295 Q 298,305 318,312",
];

const CITIES: { id: string; label: string; x: number; y: number; size: "major" | "minor" }[] = [
  { id: "london-se",        label: "London",     x: 325, y: 415, size: "major" },
  { id: "north-west",       label: "Manchester", x: 218, y: 232, size: "major" },
  { id: "scotland",         label: "Glasgow",    x: 172, y: 75,  size: "major" },
  { id: "scotland",         label: "Edinburgh",  x: 228, y: 82,  size: "minor" },
  { id: "midlands",         label: "Birmingham", x: 255, y: 330, size: "major" },
  { id: "northern-ireland", label: "Belfast",    x: 108, y: 145, size: "major" },
  { id: "north-east",       label: "Newcastle",  x: 295, y: 205, size: "minor" },
  { id: "yorkshire",        label: "Leeds",      x: 278, y: 270, size: "minor" },
  { id: "east-england",     label: "Norwich",    x: 360, y: 328, size: "minor" },
  { id: "south-west",       label: "Bristol",    x: 185, y: 408, size: "minor" },
  { id: "south-west",       label: "Plymouth",   x: 148, y: 450, size: "minor" },
  { id: "london-se",        label: "Brighton",   x: 318, y: 460, size: "minor" },
];

const REGION_MAP_IDS: Record<string, string[]> = {
  "london-se":        ["london-se", "south-east"],
  "north-west":       ["north-west"],
  scotland:           ["scotland"],
  midlands:           ["midlands", "east-england"],
  "northern-ireland": ["northern-ireland"],
};

interface MapTransform { scale: number; x: number; y: number }

export default function UKMap({
  selectedRegionIds,
  regions,
  onFlipToDashboard,
}: UKMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [tf, setTf] = useState<MapTransform>({ scale: 1, x: 0, y: 0 });

  /* Stats */
  const totalReach    = regions.filter(r => selectedRegionIds.includes(r.id)).reduce((s, r) => s + r.reachNumber, 0);
  const totalStations = regions.filter(r => selectedRegionIds.includes(r.id)).reduce((s, r) => s + r.stationBrands.length, 0);
  const reachFmt = totalReach >= 1_000_000 ? `${(totalReach / 1_000_000).toFixed(1)}M`
                 : totalReach > 0           ? `${(totalReach / 1_000).toFixed(0)}k`
                 : "—";
  const reachPct = Math.min((totalReach / 30_000_000) * 100, 100);

  /* SVG coordinate helpers */
  const toSVG = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const zoomAt = useCallback((factor: number, vx: number, vy: number) => {
    setTf(prev => {
      const s = Math.max(0.7, Math.min(6, prev.scale * factor));
      const r = s / prev.scale;
      return { scale: s, x: (vx - CX) * (1 - r) + prev.x * r, y: (vy - CY) * (1 - r) + prev.y * r };
    });
  }, []);

  /* Wheel zoom — preventDefault stops page scroll */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = toSVG(e.clientX, e.clientY);
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, x, y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [toSVG, zoomAt]);

  /* Drag to pan */
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const { x, y } = toSVG(e.clientX, e.clientY);
    dragRef.current = { startX: x, startY: y, panX: tf.x, panY: tf.y };
    setIsDragging(true);
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  }, [toSVG, tf.x, tf.y]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const { x, y } = toSVG(e.clientX, e.clientY);
    setTf(prev => ({
      ...prev,
      x: dragRef.current.panX + (x - dragRef.current.startX),
      y: dragRef.current.panY + (y - dragRef.current.startY),
    }));
  }, [isDragging, toSVG]);

  const onPointerUp = useCallback(() => setIsDragging(false), []);

  /* Connection lines */
  const selCities = CITIES.filter((c, i, arr) =>
    selectedRegionIds.includes(c.id) && arr.findIndex(cc => cc.label === c.label) === i
  );
  const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < selCities.length; i++)
    for (let j = i + 1; j < selCities.length; j++)
      connections.push({ x1: selCities[i].x, y1: selCities[i].y, x2: selCities[j].x, y2: selCities[j].y });

  const groupTransform = `translate(${CX + tf.x} ${CY + tf.y}) scale(${tf.scale}) translate(${-CX} ${-CY})`;

  return (
    <div className="flex flex-col h-full bg-[#18181b]">

      {/* ── Stats bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[#27272a] bg-[#18181b]">
        <div className="flex-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">{reachFmt}</span>
          {totalReach > 0 && <span className="text-xs text-gray-500">estimated listeners</span>}
          {totalReach === 0 && <span className="text-xs text-gray-600">Select regions to see reach</span>}
          <div className="flex-1 h-1 bg-[#27272a] rounded-full overflow-hidden max-w-[80px] ml-2">
            <div className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500" style={{ width: `${reachPct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {[
            { label: "Stations", value: String(totalStations) },
            { label: "Regions",  value: String(selectedRegionIds.length) },
            { label: "Est. CPM", value: `£${totalReach > 0 ? Math.round(totalReach / 1000 / 2.5) : 0}k` },
          ].map(s => (
            <div key={s.label} className="text-center px-3 py-1.5 bg-[#1f1f22] rounded-lg border border-[#2e2e32]">
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map area ── */}
      <div className="flex-1 relative overflow-hidden bg-[#18181b]">

        {/* Zoom + flip controls */}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-1">
          {[
            { icon: "add",                  label: "Zoom in",   action: () => zoomAt(1.35, CX, CY) },
            { icon: "center_focus_strong",  label: "Reset view",action: () => setTf({ scale: 1, x: 0, y: 0 }) },
            { icon: "remove",               label: "Zoom out",  action: () => zoomAt(1 / 1.35, CX, CY) },
          ].map(btn => (
            <button key={btn.icon} type="button" onClick={btn.action}
              className="w-8 h-8 rounded-lg bg-[#1f1f22] border border-[#2e2e32] hover:border-[#8B5CF6]/50 hover:bg-[#27272a] text-gray-400 hover:text-white flex items-center justify-center transition-all"
              aria-label={btn.label} title={btn.label}>
              <Icon name={btn.icon} className="text-base" />
            </button>
          ))}
          {onFlipToDashboard && (
            <button
              type="button"
              onClick={onFlipToDashboard}
              className="w-8 h-8 rounded-lg bg-[#1f1f22] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/10 text-[#a78bfa] hover:text-white flex items-center justify-center transition-all mt-2"
              aria-label="View deployment dashboard"
              title="View deployment dashboard"
            >
              <Icon name="dashboard" className="text-base" />
            </button>
          )}
        </div>

        {/* Zoom badge */}
        {tf.scale !== 1 && (
          <div className="absolute left-4 top-4 z-20 px-2 py-1 rounded-md bg-[#1f1f22] border border-[#2e2e32] text-[10px] font-mono text-gray-500 select-none">
            {tf.scale.toFixed(1)}×
          </div>
        )}

        {/* Hint */}
        <div className="absolute left-4 bottom-4 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1f1f22]/70 border border-[#2e2e32]/60 text-[9px] text-gray-600 select-none pointer-events-none">
          <Icon name="pan_tool" className="text-xs" />
          Drag · Scroll to zoom
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 500 680"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          /* overflow hidden: clips zoom/pan content + filter effects to SVG viewport */
          style={{ cursor: isDragging ? "grabbing" : "grab", display: "block", overflow: "hidden" }}
          role="img"
          aria-label="UK regional broadcast coverage map"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            {/* Land — charcoal gradient, no blue tint */}
            <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#252528" />
              <stop offset="100%" stopColor="#1e1e21" />
            </linearGradient>

            {/* Ireland — slightly darker charcoal */}
            <linearGradient id="irelandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#202022" />
              <stop offset="100%" stopColor="#1b1b1d" />
            </linearGradient>

            {/* Region bloom glow */}
            <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            </filter>

            {/* Land shadow when regions active */}
            <filter id="landShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8B5CF6" floodOpacity="0.18" />
            </filter>

            {/* City glow */}
            <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Clip path — hard boundary so nothing renders outside the viewport */}
            <clipPath id="mapViewport">
              <rect width="500" height="680" />
            </clipPath>

            {/* Vignette */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </radialGradient>
          </defs>

          {/* Single consistent background — #18181b fills everything */}
          <rect width="500" height="680" fill="#18181b" />

          {/* All map content clipped to the viewport */}
          <g clipPath="url(#mapViewport)">

            {/* ── Zoom / pan group ── */}
            <g transform={groupTransform}>

              {/* Ireland */}
              <path d={IRELAND_OUTLINE}
                fill="url(#irelandGrad)" stroke="#2c2c30" strokeWidth="0.8" />

              {/* UK landmass */}
              <path d={UK_OUTLINE}
                fill="url(#landGrad)" stroke="#2c2c30" strokeWidth="1.2"
                filter={selectedRegionIds.length > 0 ? "url(#landShadow)" : undefined}
              />

              {/* Region boundary lines */}
              {Object.entries(REGION_FILLS).map(([key, path]) => (
                <path key={`ol-${key}`} d={path} fill="none"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
              ))}

              {/* Selected region bloom (ambient, behind) */}
              {Object.entries(REGION_MAP_IDS).map(([regionId, keys]) =>
                selectedRegionIds.includes(regionId)
                  ? keys.map(key => (
                      <path key={`bloom-${regionId}-${key}`}
                        d={REGION_FILLS[key] ?? ""}
                        fill="#8B5CF6" filter="url(#bloom)" opacity="0.55"
                      />
                    ))
                  : null
              )}

              {/* Selected region crisp fill */}
              {Object.entries(REGION_MAP_IDS).map(([regionId, keys]) =>
                selectedRegionIds.includes(regionId)
                  ? keys.map(key => (
                      <path key={`fill-${regionId}-${key}`}
                        d={REGION_FILLS[key] ?? ""}
                        fill="#8B5CF6" fillOpacity="0.22"
                        stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.8"
                        className="transition-all duration-500"
                      />
                    ))
                  : null
              )}

              {/* Rivers */}
              {RIVERS.map((d, i) => (
                <path key={i} d={d} fill="none"
                  stroke="#3b82f6" strokeWidth="1.4"
                  strokeLinecap="round" opacity="0.45"
                />
              ))}

              {/* Connection lines */}
              {connections.map((c, i) => (
                <line key={i}
                  x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                  stroke="#a78bfa" strokeWidth={0.8 / tf.scale}
                  strokeOpacity="0.3" strokeDasharray="4 3"
                />
              ))}

              {/* City markers */}
              {CITIES.map((city, idx) => {
                const sel   = selectedRegionIds.includes(city.id);
                const major = city.size === "major";
                const r = major ? (sel ? 4 : 2.5) : (sel ? 2.5 : 1.5);
                const scaledR = r / Math.max(1, tf.scale * 0.6);

                return (
                  <g key={`${city.id}-${idx}`}>
                    {sel && (
                      <circle cx={city.x} cy={city.y} r={scaledR + 3}
                        fill="none" stroke="#8B5CF6" strokeWidth={1 / tf.scale} opacity="0">
                        <animate attributeName="r"
                          values={`${scaledR + 1};${scaledR + 9};${scaledR + 1}`}
                          dur="2.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity"
                          values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {sel && (
                      <circle cx={city.x} cy={city.y} r={scaledR + 2}
                        fill="#8B5CF6" opacity="0.3" filter="url(#cityGlow)" />
                    )}
                    <circle cx={city.x} cy={city.y} r={scaledR}
                      fill={sel ? "#c4b5fd" : major ? "#3a3a3e" : "#2a2a2e"}
                      stroke={sel ? "#ede9fe" : "none"}
                      strokeWidth={sel ? 0.8 / tf.scale : 0}
                    />
                    {(major || sel) && (
                      <text
                        x={city.x + scaledR + 3} y={city.y + 3}
                        fontSize={major ? 7.5 / tf.scale : 6 / tf.scale}
                        fontWeight={sel ? "700" : "400"}
                        fill={sel ? "#ede9fe" : "rgba(255,255,255,0.3)"}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing={sel ? "0.3" : "0"}
                        className="select-none"
                      >
                        {city.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Compass rose */}
              <g transform={`translate(452, 46) scale(${1 / tf.scale})`}>
                <circle cx="0" cy="0" r="13"
                  fill="#1f1f22" stroke="#2e2e32" strokeWidth="1" />
                <polygon points="0,-9 2,-3 -2,-3"  fill="#c4b5fd" opacity="0.9" />
                <polygon points="0,9 2,3 -2,3"    fill="#3a3a3e" />
                <polygon points="-9,0 -3,2 -3,-2" fill="#3a3a3e" />
                <polygon points="9,0 3,2 3,-2"    fill="#3a3a3e" />
                <text x="0" y="-11" fontSize="5.5" textAnchor="middle"
                  fill="#c4b5fd" fontWeight="700" fontFamily="system-ui">N</text>
              </g>

            </g>{/* end zoom group */}

            {/* Vignette — fixed overlay inside clip, outside zoom */}
            <rect width="500" height="680" fill="url(#vignette)" pointerEvents="none" />

          </g>{/* end clipPath group */}
        </svg>
      </div>
    </div>
  );
}
