import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type VisibleStatus = "building" | "shortlisted" | "idea" | "paused" | "shipped";

interface StatusDonutChartProps {
  data: Record<VisibleStatus, number>;
  className?: string;
  size?: "sm" | "md";
}

const statusColors: Record<VisibleStatus, string> = {
  building: "hsl(142, 71%, 45%)",    // emerald
  shortlisted: "hsl(45, 93%, 47%)",  // amber
  idea: "hsl(263, 70%, 58%)",        // purple (primary)
  paused: "hsl(215, 16%, 47%)",      // slate
  shipped: "hsl(199, 89%, 48%)",     // blue
};

const statusOrder: VisibleStatus[] = ["building", "shortlisted", "idea", "paused", "shipped"];

const sizeConfig = {
  sm: { height: 120, innerRadius: 30, outerRadius: 48 },
  md: { height: 160, innerRadius: 40, outerRadius: 60 },
};

export function StatusDonutChart({ data, className, size = "md" }: StatusDonutChartProps) {
  const { height, innerRadius, outerRadius } = sizeConfig[size];

  // Transform data for Recharts
  const chartData = statusOrder
    .filter((status) => data[status] > 0)
    .map((status) => ({
      name: status,
      value: data[status],
      fill: statusColors[status],
    }));

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">No ideas yet</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">
          {total === 1 ? "idea" : "ideas"}
        </span>
      </div>
    </div>
  );
}
