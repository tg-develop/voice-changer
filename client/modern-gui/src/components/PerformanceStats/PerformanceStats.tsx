import { CalculatedMetricValues, PerfStatus } from "./PerformanceStatsCard";

interface PerformanceStatsProps {
    calculatedMetrics: CalculatedMetricValues;
}

// Define text color classes for different performance statuses
const PERF_TEXT_CLASSES: Record<PerfStatus, string> = {
    good: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    critical: 'text-red-600 dark:text-red-400',
};

function PerformanceStats({ calculatedMetrics }: PerformanceStatsProps) {
    // ---------------- States ----------------
    const performanceMetricKeys: string[] = ["Vol", "Ping", "Total", "Perf"];

    // Calculate display values from metrics
    const displayValues: Record<string, { value: string | number; unit?: string; className?: string }> = {
        Vol: { value: calculatedMetrics.volumeDb, unit: 'dB' },
        Ping: { value: Math.round(calculatedMetrics.ping), unit: 'ms' },
        Total: { value: Math.round(calculatedMetrics.totalLatencyTime), unit: 'ms' },
        Perf: {
            value: `${Math.round(calculatedMetrics.perfTime)}ms of ${Math.round(calculatedMetrics.chunkTime)}ms`,
            className: PERF_TEXT_CLASSES[calculatedMetrics.perfStatus]
        },
    };

    // ---------------- Render ----------------
    return (
        <div className="flex justify-around w-full mb-3">
            {performanceMetricKeys.map(metricKey => {
                const metricInfo = displayValues[metricKey];
                return (
                    <span key={metricKey} className="text-xs font-medium text-slate-600 dark:text-gray-400">
                        {metricKey}:{' '}
                        <span className={`text-slate-800 dark:text-gray-200 ${metricInfo.className || ''}`}>
                            {metricInfo.value}
                            {metricInfo.unit || ''}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

export default PerformanceStats;