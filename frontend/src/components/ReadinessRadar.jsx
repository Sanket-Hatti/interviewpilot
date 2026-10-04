import { useMemo } from "react";

export default function ReadinessRadar({
  dimensions = [
    { label: "Algorithms & DSA", value: 82 },
    { label: "System Design", value: 74 },
    { label: "Behavioral", value: 78 },
    { label: "Code Quality", value: 85 },
    { label: "Resume ATS", value: 88 },
  ],
  hasData = true,
  size = 260
}) {
  const center = size / 2;
  const radius = center - 42;
  const count = dimensions.length;

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = radius * (Math.max(10, Math.min(100, value)) / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPath = useMemo(() => {
    return dimensions
      .map((d, i) => {
        const val = hasData ? d.value : 25;
        const pt = getPoint(i, val);
        return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }, [dimensions, size, hasData]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Polygons */}
        {gridLevels.map((lvl, idx) => {
          const path = dimensions
            .map((_, i) => {
              const pt = getPoint(i, lvl * 100);
              return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
            })
            .join(" ") + " Z";
          return (
            <path
              key={idx}
              d={path}
              fill="none"
              stroke="#27272a"
              strokeWidth="1"
              strokeDasharray={lvl === 1.0 ? "none" : "2 2"}
            />
          );
        })}

        {/* Radial Axis lines */}
        {dimensions.map((_, i) => {
          const pt = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={pt.x}
              y2={pt.y}
              stroke="#27272a"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <path
          d={polygonPath}
          fill={hasData ? "rgba(99, 102, 241, 0.15)" : "rgba(63, 63, 70, 0.12)"}
          stroke={hasData ? "#6366f1" : "#52525b"}
          strokeWidth="1.5"
          className="transition-all duration-500"
        />

        {/* Data Points */}
        {dimensions.map((d, i) => {
          const val = hasData ? d.value : 25;
          const pt = getPoint(i, val);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              className={hasData ? "fill-indigo-500 stroke-zinc-950 stroke-2" : "fill-zinc-600 stroke-zinc-950 stroke-2"}
            />
          );
        })}

        {/* Axis Labels */}
        {dimensions.map((d, i) => {
          const pt = getPoint(i, 116);
          const isRight = pt.x > center + 10;
          const isLeft = pt.x < center - 10;
          const anchor = isRight ? "start" : isLeft ? "end" : "middle";

          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y + 4}
              textAnchor={anchor}
              className="fill-zinc-400 text-[11px] font-sans"
            >
              {d.label}
              {hasData ? ` (${d.value}%)` : ""}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
