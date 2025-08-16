
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CustomTooltip from './PerformanceGraphTooltip';
import { ChartDataPoint, PerfStatus } from './PerformanceStatsCard';
import { useThemeContext } from '../../context/ThemeContext';

const LATENCY_STATUS_FILL_HEX: Record<PerfStatus, string> = {
  good: '#10B981',     // emerald-500
  warning: '#F59E0B',  // amber-500
  critical: '#EF4444', // red-500
};

const CHART_LINE_COLOR_LIGHT_HEX = '#475569'; // slate-600
const CHART_LINE_COLOR_DARK_HEX = '#cbd5e1'; // slate-300

interface PerformanceGraphProps {
  chartData: ChartDataPoint[];
}

function PerformanceGraph({ chartData }: PerformanceGraphProps) {
  // ---------------- State ----------------
  const theme = useThemeContext();

  // ---------------- Render ----------------

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(unixTime: number) => new Date(unixTime).toLocaleTimeString()}
          stroke="#94a3b8"
          tick={{ fontSize: 10 }}
        />
        <YAxis
          label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
          stroke="#94a3b8"
          tick={{ fontSize: 10 }}
          tickFormatter={(value: number) => String(Math.round(value))}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />

        {/* Area Charts for different chart-colors */}
        <Area
          type="monotone"
          dataKey="greenTime"
          stroke="none"
          fill={LATENCY_STATUS_FILL_HEX.good}
          stackId="perfArea"
          fillOpacity={0.4}
          name=""
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="yellowTime"
          stroke="none"
          fill={LATENCY_STATUS_FILL_HEX.warning}
          stackId="perfArea"
          fillOpacity={0.4}
          name=""
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="redTime"
          stroke="none"
          fill={LATENCY_STATUS_FILL_HEX.critical}
          stackId="perfArea"
          fillOpacity={0.4}
          name=""
          legendType="none"
        />

        {/* Chunk Time Reference Line */}
        <Line
          type="monotone"
          dataKey="chunkTime"
          stroke="#8B5CF6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Chunk Size"
        />

        {/* Main Process Time Line */}
        <Line
          type="monotone"
          dataKey="perfTimeValue"
          stroke={theme.theme === 'dark' ? CHART_LINE_COLOR_DARK_HEX : CHART_LINE_COLOR_LIGHT_HEX}
          strokeWidth={2}
          dot={false}
          name="Main Process Time"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default PerformanceGraph;
