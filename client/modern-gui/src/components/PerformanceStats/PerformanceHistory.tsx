
interface PerformanceHistoryProps {
    maxDataPoints: number;
    setMaxDataPoints: (maxDataPoints: number) => void;
}

function PerformanceHistory({ maxDataPoints, setMaxDataPoints }: PerformanceHistoryProps) {
    // ---------------- Render ----------------
    return (
        <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-gray-400 self-center">History:</span>
            {/* Display the last 20, 50, or 100 data points */}
            {[20, 50, 100].map(num => (
                <button
                    key={num}
                    onClick={() => setMaxDataPoints(num)}
                    className={`px-2 py-0.5 text-xs rounded ${maxDataPoints === num ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500 text-slate-700 dark:text-gray-200'}`}
                >
                    {num}
                </button>
            ))}
        </div>
    );
}

export default PerformanceHistory;