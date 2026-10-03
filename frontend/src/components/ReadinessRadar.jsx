import { useMemo } from "react";

export default function ReadinessRadar({
  dimensions = [
    { label: "Algorithms & DSA", value: 82 },
    { label: "System Design", value: 74 },
    { label: "STAR Behavioral", value: 78 },
    { label: "Code Optimization", value: 85 },
    { label: "Resume ATS Match", value: 88 },
  ],
  size = 280
}) {
  const center = size / 2;
  const radius = center - 42;
  const count = dimensions.length;

  // Calculate coordinates for a given index and normalized value (0 to 1)
  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = radius * (value / 100);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Concentric grid circles / polygons
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPath = useMemo(() => {
    return dimensions
      .map((d, i) => {
        const pt = getPoint(i, d.value);
        return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }, [dimensions, size]);

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
          fill="rgba(99, 102, 241, 0.18)"
          stroke="#6366f1"
          strokeWidth="2"
          className="transition-all duration-700"
        />

        {/* Data Points */}
        {dimensions.map((d, i) => {
          const pt = getPoint(i, d.value);
          return (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                className="fill-indigo-500 stroke-zinc-950 stroke-2 transition-transform duration-200 group-hover:scale-125"
              />
            </g>
          );
        })}

        {/* Labels */}
        {dimensions.map((d, i) => {
          const pt = getPoint(i, 118);
          const isRight = pt.x > center + 10;
          const isLeft = pt.x < center - 10;
          const anchor = isRight ? "start" : isLeft ? "end" : "middle";

          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y + 4}
              textAnchor={anchor}
              className="fill-zinc-400 text-[10px] font-mono tracking-tight"
            >
              {d.label} ({d.value}%)
            </text>
          );
        })}
      </svg>
    </div>
  );
}
