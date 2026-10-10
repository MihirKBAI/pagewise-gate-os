import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TimelineProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number; // in seconds per step e.g. 1.0, 0.5
  onStepChange: (step: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  predictMode?: boolean;
  onTogglePredictMode?: () => void;
  isPredictPending?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onStepChange,
  onTogglePlay,
  onSpeedChange,
  predictMode,
  onTogglePredictMode,
  isPredictPending,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) onStepChange(currentStep - 1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < totalSteps - 1 && !isPredictPending) {
          onStepChange(currentStep + 1);
        }
      } else if (e.code === 'Home') {
        e.preventDefault();
        onStepChange(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        onStepChange(totalSteps - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, isPlaying, isPredictPending, onStepChange, onTogglePlay]);

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col gap-2 select-none"
    >
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Step {currentStep} of {Math.max(0, totalSteps - 1)}
        </span>

        <div className="flex items-center gap-2">
          {onTogglePredictMode && (
            <button
              onClick={onTogglePredictMode}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                predictMode
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Predict before each step reveals"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {predictMode ? 'Predict Mode Active' : 'Predict Mode'}
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            <span>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="bg-transparent text-indigo-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="2.0">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="0.5">2.0x</option>
              <option value="0.25">4.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrub range slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
        />
      </div>

      {/* VCR Playback Controls */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          onClick={() => onStepChange(0)}
          disabled={currentStep === 0}
          title="Jump to Start (Home)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          title="Previous Step (Left Arrow)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          className={`p-2.5 rounded-full transition shadow-md flex items-center justify-center ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep >= totalSteps - 1 || isPredictPending}
          title="Next Step (Right Arrow)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onStepChange(totalSteps - 1)}
          disabled={currentStep >= totalSteps - 1}
          title="Jump to End (End)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
