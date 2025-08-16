import { JSX, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faVolumeUp, faVolumeMute, faDownload } from '@fortawesome/free-solid-svg-icons';
import { CSS_CLASSES } from '../../styles/constants';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  id?: string;
  outputDeviceId?: string;
  modelName?: string;
  audioType?: 'Input' | 'Output';
}

function AudioPlayer({ src, title, className = '', id, outputDeviceId, modelName, audioType }: AudioPlayerProps): JSX.Element {
  // ---------------- States ----------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);

  // ---------------- Hooks ----------------

  // Setup audio player
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume
    audio.volume = volume;

    // Reset states when src changes
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsLoading(true);

    // Handle loaded metadata
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    // Handle time update
    const handleTimeUpdate = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    // Handle ended
    const handleEnded = () => {
      setIsPlaying(false);
    };

    // Handle can play
    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Handle waiting
    const handleWaiting = () => {
      setIsLoading(true);
    };

    // Handle can play through
    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    // Handle load start
    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleError = () => {
      setIsLoading(false);
      setDuration(0);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);

    // Force load
    audio.load();
  }, [src]);

  // Update sink device when outputDeviceId changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !outputDeviceId) return;

    try {
      if ((audio as any).setSinkId) {
        (audio as any).setSinkId(outputDeviceId);
      }
    } catch (error) {
      console.error('Error setting audio output device:', error);
    }
  }, [outputDeviceId]);

  // Toggle play/pause
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  // ---------------- Handlers ----------------

  // Handle progress change
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isFinite(duration)) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    if (isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audio) {
      audio.volume = newVolume;
    }
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Generate filename: Input/Output-ModelName-YYYY-MM-DD_HH-MM-SS.wav
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .split('.')[0]; // Remove milliseconds and timezone

      const safeModelName = (modelName || 'Unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
      const prefix = audioType || 'Audio';
      const filename = `${prefix}-${safeModelName}-${timestamp}.wav`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  // ---------------- Functions ----------------

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Format time
  const formatTime = (time: number): string => {
    if (!isFinite(time) || isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 && isFinite(duration) && isFinite(currentTime)
    ? (currentTime / duration) * 100
    : 0;

  // ---------------- Render ----------------

  return (
    <div className={`bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md p-3 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        id={id}
        controls={false}
      />

      {title && (
        <div className="text-sm font-medium text-slate-700 dark:text-gray-200 mb-2 truncate">
          {title}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-hidden">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full transition-colors duration-150"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-sm" />
          )}
        </button>

        {/* Progress Section */}
        <div className="flex-1 min-w-0">
          {/* Time Display */}
          <div className="flex justify-between text-xs text-slate-600 dark:text-gray-400 mb-1">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={isFinite(progressPercentage) ? progressPercentage : 0}
              onChange={handleProgressChange}
              disabled={!duration || !isFinite(duration)}
              className="w-full h-2 bg-slate-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 dark:accent-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${isFinite(progressPercentage) ? progressPercentage : 0}%, rgb(226, 232, 240) ${isFinite(progressPercentage) ? progressPercentage : 0}%, rgb(226, 232, 240) 100%)`
              }}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleMute}
            className={`${CSS_CLASSES.iconButton} p-2`}
          >
            <FontAwesomeIcon
              icon={isMuted || volume === 0 ? faVolumeMute : faVolumeUp}
              className="text-sm"
            />
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-slate-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 dark:accent-blue-400"
          />
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`${CSS_CLASSES.iconButton} hover:bg-slate-100 dark:hover:bg-gray-700 p-2 rounded flex-shrink-0`}
          title="Download Audio"
        >
          <FontAwesomeIcon icon={faDownload} className="text-sm" />
        </button>
      </div>
    </div>
  );
}

export default AudioPlayer;