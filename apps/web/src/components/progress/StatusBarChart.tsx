import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

type VisibleStatus = "building" | "shortlisted" | "idea" | "paused" | "shipped";

interface StatusBarChartProps {
  data: Record<VisibleStatus, number>;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const statusColors: Record<VisibleStatus, string> = {
  building: "hsl(142, 71%, 45%)",
  shortlisted: "hsl(45, 93%, 47%)",
  idea: "hsl(263, 70%, 58%)",
  paused: "hsl(215, 16%, 47%)",
  shipped: "hsl(199, 89%, 48%)",
};

const statusLabels: Record<VisibleStatus, string> = {
  building: "Building",
  shortlisted: "Shortlisted",
  idea: "Idea",
  paused: "Paused",
  shipped: "Shipped",
};

const statusOrder: VisibleStatus[] = ["idea", "shortlisted", "building", "shipped", "paused"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: VisibleStatus; value: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground">{statusLabels[item.name]}</p>
      <p className="text-xs text-muted-foreground">
        {item.value} {item.value === 1 ? "idea" : "ideas"}
      </p>
    </div>
  );
}

export function StatusBarChart({
  data,
  className,
  orientation = "horizontal",
}: StatusBarChartProps) {
  // Transform data for Recharts
  const chartData = statusOrder.map((status) => ({
    name: status,
    label: statusLabels[status],
    value: data[status] || 0,
    fill: statusColors[status],
  }));

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center h-[150px]", className)}>
        <p className="text-sm text-muted-foreground">No ideas to display</p>
      </div>
    );
  }

  if (orientation === "vertical") {
    return (
      <div className={cn("h-[200px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={cn("h-[150px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, bottom: 24 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={40}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
