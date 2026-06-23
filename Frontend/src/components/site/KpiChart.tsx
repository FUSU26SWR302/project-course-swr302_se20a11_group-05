import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

/** Map CSS color class names to hex values used in the app's palette. */
export function textClassToHex(textClass: string): string {
  const map: Record<string, string> = {
    "text-gov-blue": "#00387B",
    "text-gov-gold": "#D4AF37",
    "text-[var(--status-success)]": "#1B5E20",
    "text-[var(--status-pending)]": "#E65100",
    "text-[var(--status-danger)]": "#B00020",
    "text-ink": "#0F172A",
    "text-ink-soft": "#475569",
  };
  return map[textClass] || "#00387B";
}

/* ------------------------------------------------------------------ */
/*  DonutChart — resolved vs pending ratio                            */
/* ------------------------------------------------------------------ */

interface DonutChartProps {
  resolved: number;
  pending: number;
}

const DONUT_COLORS = {
  resolved: "#22c55e", // green-500
  pending: "#f59e0b", // amber-500
};

export function DonutChart({ resolved, pending }: DonutChartProps) {
  const data = [
    { name: "Đã xử lý", value: resolved, color: DONUT_COLORS.resolved },
    { name: "Chờ xử lý", value: pending, color: DONUT_COLORS.pending },
  ];

  const total = resolved + pending || 1;

  return (
    <div className="card-civic p-6">
      <h3 className="text-lg font-bold text-ink mb-4">Tỷ lệ xử lý</h3>
      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
                formatter={(value: number, name: string) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS.resolved }}
            />
            <span className="text-ink-soft">Đã xử lý</span>
            <span className="font-bold text-ink ml-auto tabular-nums">
              {resolved.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS.pending }}
            />
            <span className="text-ink-soft">Chờ xử lý</span>
            <span className="font-bold text-ink ml-auto tabular-nums">
              {pending.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="mt-1 pt-3 border-t border-slate-100">
            <span className="text-ink-soft">Tỷ lệ hoàn thành</span>
            <span className="font-bold text-[var(--status-success)] ml-2">
              {((resolved / total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HorizontalBarChart — ward / category comparison                   */
/* ------------------------------------------------------------------ */

interface BarItem {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: BarItem[];
  title?: string;
  color?: string;
  unit?: string;
}

export function HorizontalBarChart({
  data,
  title,
  color = "#2563eb",
  unit = "",
}: HorizontalBarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="card-civic p-6">
      {title && <h3 className="text-lg font-bold text-ink mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 200)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <XAxis type="number" hide domain={[0, maxVal]} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 13, fontWeight: 600 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 13,
            }}
            formatter={(value: number) => [`${value.toLocaleString("vi-VN")}${unit}`, "Đã xử lý"]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline — tiny inline area chart for KPI cards                  */
/* ------------------------------------------------------------------ */

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "#2563eb", height = 48 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className="w-full mt-2">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-grad-${color.replace("#", "")})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
