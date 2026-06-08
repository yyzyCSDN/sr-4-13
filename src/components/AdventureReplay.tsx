import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BattleLog } from '../types/game';

interface ReplayStats {
  steps: number;
  monstersKilled: number;
  treasuresFound: number;
  trapsTriggered: number;
  levelUps: number;
  hp: number;
  maxHp: number;
}

interface AdventureReplayProps {
  logs: BattleLog[];
}

function computeStats(logs: BattleLog[], upToIndex: number): ReplayStats {
  const stats: ReplayStats = {
    steps: 0,
    monstersKilled: 0,
    treasuresFound: 0,
    trapsTriggered: 0,
    levelUps: 0,
    hp: 0,
    maxHp: 0,
  };

  for (let i = 0; i <= upToIndex && i < logs.length; i++) {
    const log = logs[i];
    switch (log.type) {
      case 'move':
        stats.steps++;
        break;
      case 'battle':
        if (log.message.includes('被击败了')) {
          stats.monstersKilled++;
        }
        break;
      case 'trap':
        stats.trapsTriggered++;
        break;
      case 'treasure':
        if (log.message.includes('发现了')) {
          stats.treasuresFound++;
        }
        break;
      case 'levelup':
        stats.levelUps++;
        break;
    }
    if (log.heroHp !== undefined) {
      stats.hp = log.heroHp;
    }
    if (log.heroMaxHp !== undefined) {
      stats.maxHp = log.heroMaxHp;
    }
  }

  return stats;
}

const REPLAY_SPEEDS = [
  { label: '0.5x', ms: 1000 },
  { label: '1x', ms: 500 },
  { label: '2x', ms: 250 },
  { label: '4x', ms: 125 },
];

export const AdventureReplay: React.FC<AdventureReplayProps> = ({ logs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const totalLogs = logs.length;
  const currentLog = logs[currentIndex] ?? null;
  const stats = computeStats(logs, currentIndex);

  const tick = useCallback(
    (timestamp: number) => {
      if (!isPlaying) return;
      if (timestamp - lastTickRef.current >= REPLAY_SPEEDS[speedIndex].ms) {
        lastTickRef.current = timestamp;
        setCurrentIndex((prev) => {
          if (prev >= totalLogs - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
      animationRef.current = requestAnimationFrame(tick);
    },
    [isPlaying, speedIndex, totalLogs],
  );

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      animationRef.current = requestAnimationFrame(tick);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, tick]);

  useEffect(() => {
    if (currentIndex >= totalLogs - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, totalLogs, isPlaying]);

  const handlePlayPause = () => {
    if (currentIndex >= totalLogs - 1 && !isPlaying) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || totalLogs === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newIndex = Math.round(ratio * (totalLogs - 1));
    setCurrentIndex(newIndex);
    setIsPlaying(false);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || totalLogs === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const newIndex = Math.round(ratio * (totalLogs - 1));
      setCurrentIndex(newIndex);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, totalLogs]);

  const getLogColor = (type: BattleLog['type']): string => {
    switch (type) {
      case 'move': return 'bg-gray-400';
      case 'battle': return 'bg-red-500';
      case 'trap': return 'bg-orange-500';
      case 'treasure': return 'bg-yellow-400';
      case 'levelup': return 'bg-purple-500';
      case 'death': return 'bg-red-700';
      case 'victory': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getLogIcon = (type: BattleLog['type']): string => {
    switch (type) {
      case 'move': return '👣';
      case 'battle': return '⚔️';
      case 'trap': return '💥';
      case 'treasure': return '✨';
      case 'levelup': return '⬆️';
      case 'death': return '💀';
      case 'victory': return '🎉';
      default: return '📝';
    }
  };

  const getLogTextColor = (type: BattleLog['type']): string => {
    switch (type) {
      case 'move': return 'text-gray-300';
      case 'battle': return 'text-red-400';
      case 'trap': return 'text-orange-400';
      case 'treasure': return 'text-yellow-400';
      case 'levelup': return 'text-purple-400';
      case 'death': return 'text-red-500';
      case 'victory': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  const getLogBorderColor = (type: BattleLog['type']): string => {
    switch (type) {
      case 'move': return 'border-gray-600';
      case 'battle': return 'border-red-700';
      case 'trap': return 'border-orange-700';
      case 'treasure': return 'border-yellow-700';
      case 'levelup': return 'border-purple-700';
      case 'death': return 'border-red-800';
      case 'victory': return 'border-green-700';
      default: return 'border-gray-600';
    }
  };

  const progress = totalLogs > 1 ? (currentIndex / (totalLogs - 1)) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">👣 步数</div>
            <div className="text-blue-400 font-bold text-lg">{stats.steps}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">⚔️ 击杀</div>
            <div className="text-red-400 font-bold text-lg">{stats.monstersKilled}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">💥 陷阱</div>
            <div className="text-orange-400 font-bold text-lg">{stats.trapsTriggered}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">✨ 宝箱</div>
            <div className="text-yellow-400 font-bold text-lg">{stats.treasuresFound}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">⬆️ 升级</div>
            <div className="text-purple-400 font-bold text-lg">{stats.levelUps}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">❤️ 生命</div>
            <div className="text-green-400 font-bold text-lg">
              {stats.hp}/{stats.maxHp}
            </div>
          </div>
        </div>
      </div>

      {currentLog && (
        <div
          className={`mb-4 p-3 rounded-lg border-l-4 ${getLogBorderColor(currentLog.type)} ${getLogTextColor(currentLog.type)} bg-gray-700/30`}
        >
          <div className="flex items-center gap-2 text-lg font-bold">
            <span>{getLogIcon(currentLog.type)}</span>
            <span>{currentLog.message}</span>
          </div>
          {currentLog.heroHp !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>HP</span>
                <span>{currentLog.heroHp}/{currentLog.heroMaxHp}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                  style={{
                    width: `${currentLog.heroMaxHp ? (currentLog.heroHp / currentLog.heroMaxHp) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={timelineRef}
        className="relative h-10 bg-gray-700/50 rounded-lg cursor-pointer mb-3 select-none"
        onMouseDown={handleTimelineMouseDown}
        onClick={handleTimelineClick}
      >
        <div
          className="absolute top-0 left-0 h-full bg-blue-600/20 rounded-l-lg"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-blue-400 z-10"
          style={{ left: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white z-20 -ml-2 shadow-lg"
          style={{ left: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center">
          {logs.map((log, i) => {
            const pos = totalLogs > 1 ? (i / (totalLogs - 1)) * 100 : 50;
            return (
              <div
                key={log.id}
                className={`absolute w-2 h-2 rounded-full -ml-1 ${getLogColor(log.type)} ${i <= currentIndex ? 'opacity-100' : 'opacity-40'} transition-opacity`}
                style={{ left: `${pos}%` }}
                title={log.message}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full transition-colors text-lg"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsPlaying(false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-sm"
          >
            ⏮
          </button>
          <button
            onClick={() => {
              setCurrentIndex(Math.max(0, currentIndex - 1));
              setIsPlaying(false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-sm"
          >
            ◀
          </button>
          <button
            onClick={() => {
              setCurrentIndex(Math.min(totalLogs - 1, currentIndex + 1));
              setIsPlaying(false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-sm"
          >
            ▶
          </button>
          <button
            onClick={() => {
              setCurrentIndex(totalLogs - 1);
              setIsPlaying(false);
            }}
            className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-sm"
          >
            ⏭
          </button>
        </div>

        <div className="flex items-center gap-1">
          {REPLAY_SPEEDS.map((speed, i) => (
            <button
              key={speed.label}
              onClick={() => setSpeedIndex(i)}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                speedIndex === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {speed.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500">
          {currentIndex + 1} / {totalLogs}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
        {logs.map((log, i) => (
          <div
            key={log.id}
            className={`text-sm flex items-start gap-2 p-1.5 rounded transition-all ${
              i === currentIndex
                ? `${getLogTextColor(log.type)} bg-gray-700/70 ring-1 ring-gray-500`
                : i < currentIndex
                  ? `${getLogTextColor(log.type)} opacity-60`
                  : 'text-gray-600 opacity-30'
            }`}
            onClick={() => {
              setCurrentIndex(i);
              setIsPlaying(false);
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
            <span className="flex-1">{log.message}</span>
            {log.heroHp !== undefined && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                HP:{log.heroHp}/{log.heroMaxHp}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
