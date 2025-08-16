import { JSX, useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DragHandle from './../Helpers/DragHandle';
import { useAppState } from '../../context/AppContext';
import PerformanceRecording from './PerformanceRecording';
import PerformanceStats from './PerformanceStats';
import PerformanceHistory from './PerformanceHistory';
import PerformanceGraph from './PerformanceGraph';
import { CSS_CLASSES } from '../../styles/constants';

// Define types for the performance data
interface PerformanceMetrics {
  vol: number;
  responseTime: number;
  mainprocessTime: number;
}

interface PerformanceStatsCardProps {
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
}

export interface ChartDataPoint {
  timestamp: number;
  perfTimeValue: number;
  chunkTime: number;
  greenTime?: number;
  yellowTime?: number;
  redTime?: number;
}

export type PerfStatus = 'good' | 'warning' | 'critical';

export interface CalculatedMetricValues {
  volumeDb: number;
  ping: number;
  totalLatencyTime: number;
  perfTime: number;
  chunkTime: number;
  perfStatus: PerfStatus;
}

interface RecordedDataEntry extends CalculatedMetricValues {
  timestamp: number;
  perfValueString: string;
}

// Default max data points for the chart
const DEFAULT_MAX_CHART_DATA_POINTS = 50;

function PerformanceStatsCard({ dndAttributes, dndListeners }: PerformanceStatsCardProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [maxDataPoints, setMaxDataPoints] = useState(DEFAULT_MAX_CHART_DATA_POINTS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<RecordedDataEntry[]>([]);

  // ---------------- Hooks ----------------

  //Calculate the next DataPoint using appState performance values
  const calculatedMetrics = useMemo((): CalculatedMetricValues => {
    const volumeDb = Math.max(Math.round(20 * Math.log10(appState.performance.vol || 0.00001)), -90);
    const chunkTime = ((appState.serverSetting.serverSetting.serverReadChunkSize * 128 * 1000) / 48000); // Assuming 48kHz sample rate, 128 samples per frame for chunk size unit
    const totalLatencyTime = Math.ceil(chunkTime + appState.performance.responseTime + appState.serverSetting.serverSetting.crossFadeOverlapSize * 1000);

    let perfStatus: PerfStatus = 'good';
    const eightyPercentChunkTime = 0.8 * chunkTime;
    if (appState.performance.mainprocessTime > chunkTime) {
      perfStatus = 'critical';
    } else if (appState.performance.mainprocessTime > eightyPercentChunkTime) { // totalLatencyTime <= chunkTime is implicit
      perfStatus = 'warning';
    }

    return {
      volumeDb,
      ping: appState.performance.responseTime,
      totalLatencyTime,
      perfTime: appState.performance.mainprocessTime,
      chunkTime,
      perfStatus,
    };
  }, [appState.performance, appState.serverSetting.serverSetting.serverReadChunkSize, appState.serverSetting.serverSetting.crossFadeOverlapSize]);

  //Format DataPoint into ChartDataPoint and add to ChartData
  useEffect(() => {
    const { perfStatus, perfTime } = calculatedMetrics;

    const roundedPerfTime = Math.round(perfTime);
    let gt = 0, yt = 0, rt = 0;

    if (perfStatus === 'good') gt = roundedPerfTime;
    else if (perfStatus === 'warning') yt = roundedPerfTime;
    else if (perfStatus === 'critical') rt = roundedPerfTime;

    const newDataPoint: ChartDataPoint = {
      timestamp: Date.now(),
      perfTimeValue: roundedPerfTime,
      chunkTime: Math.round(calculatedMetrics.chunkTime),
      greenTime: gt, yellowTime: yt, redTime: rt,
    };

    //Add DataPoint to ChartData
    setChartData(prevData => {
      const newChartData = [...prevData, newDataPoint];
      return newChartData.length > maxDataPoints ? newChartData.slice(newChartData.length - maxDataPoints) : newChartData;
    });

    //Add DataPoint to RecordedData
    if (isRecording) {
      setRecordedData(prev => [...prev, {
        timestamp: newDataPoint.timestamp,
        ...calculatedMetrics,
        perfValueString: `${Math.round(calculatedMetrics.totalLatencyTime)}ms of ${Math.round(calculatedMetrics.chunkTime)}ms`
      }]);
    }
  }, [calculatedMetrics, maxDataPoints, isRecording]);

  // ---------------- Render ----------------

  return (
    <div className={`p-4 border border-slate-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 flex-1 min-h-0 flex flex-col ${isCollapsed ? 'h-auto' : ''}`}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-gray-700">
        <h5 className="text-lg font-semibold text-slate-700 dark:text-gray-200">Performance Stats</h5>
        <div className="flex space-x-1 items-center">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={CSS_CLASSES.iconButton} title={isCollapsed ? "Expand" : "Collapse"}>
            <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} className="h-5 w-5" />
          </button>
          <DragHandle attributes={dndAttributes} listeners={dndListeners} title="Drag" />
        </div>
      </div>
      {!isCollapsed && (
        <div className="flex-grow flex flex-col items-center">
          <PerformanceStats
            calculatedMetrics={calculatedMetrics}
          />

          <div className="flex justify-between items-center mb-2 w-full px-1">
            <PerformanceRecording
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              recordedData={recordedData}
              setRecordedData={setRecordedData}
            />

            <PerformanceHistory
              maxDataPoints={maxDataPoints}
              setMaxDataPoints={setMaxDataPoints}
            />
          </div>

          <div className="w-full h-48 bg-slate-100 dark:bg-gray-700 border border-slate-300 dark:border-gray-500 rounded-md flex-grow">
            <PerformanceGraph
              chartData={chartData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceStatsCard;