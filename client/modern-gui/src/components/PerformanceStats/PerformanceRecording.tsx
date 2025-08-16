import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle, faStopCircle } from "@fortawesome/free-solid-svg-icons";

interface PerformanceRecordingProps {
    isRecording: boolean;
    setIsRecording: (isRecording: boolean) => void;
    recordedData: any[];
    setRecordedData: (recordedData: any[]) => void;
}

function PerformanceRecording({ isRecording, setIsRecording, recordedData, setRecordedData }: PerformanceRecordingProps) {
    // ---------------- Functions ----------------

    // Download log file
    const downloadLogFile = useCallback(() => {
        if (recordedData.length === 0) return;

        // Structure and content of the CSV-File
        const header = "Timestamp,DateTime,Volume_dB,Ping_ms,TotalLatency_ms,PerfValue_ms,PerfChunk_ms,PerfStatus\n";
        const logContent = recordedData.map(entry =>
            `${entry.timestamp},${new Date(entry.timestamp).toISOString()},${entry.volumeDb},${Math.round(entry.ping)},${Math.round(entry.totalLatencyTime)},${Math.round(entry.perfTime)},${Math.round(entry.chunkTime)},${entry.perfStatus}`
        ).join("\n");

        // Create and download file
        const blob = new Blob([header + logContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `performance_log_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setRecordedData([]); // Clear data after download
    }, [recordedData]);

    // Handle record toggle (start / stop recording)
    const handleRecordToggle = () => {
        if (isRecording) {
            downloadLogFile();
        }
        setIsRecording(!isRecording);
    };

    // ---------------- Render ----------------
    return (
        <button
            onClick={handleRecordToggle}
            className={`px-2 py-1 text-xs rounded flex items-center space-x-1.5 transition-colors duration-150 ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700'
                }`}
            title={isRecording ? "Stop Recording & Download CSV" : "Start Recording Performance Log"}
        >
            <FontAwesomeIcon icon={isRecording ? faStopCircle : faPlayCircle} className="h-3 w-3" />
            <span>{isRecording ? 'Stop' : 'Record'}</span>
        </button>
    );
}

export default PerformanceRecording;