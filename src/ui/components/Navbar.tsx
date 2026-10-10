import React from 'react';
import {
  Layers,
  Cpu,
  BookOpen,
  FileText,
  Share2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'learn' | 'simulators' | 'practice' | 'belady' | 'cheatsheet' | 'pyq';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeSimulator: string;
  onSimulatorChange: (sim: string) => void;
  onShareScenario?: () => void;
  copiedShare?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  activeSimulator,
  onSimulatorChange,
  onShareScenario,
  copiedShare,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onTabChange('learn')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition">
              ⚡
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                PageWise
                <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  GATE-OS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Visual & Infographic Numerical Tutor
              </div>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('learn')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'learn'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Topic Map</span>
          </button>

          <button
            onClick={() => onTabChange('simulators')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'simulators'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Simulators</span>
          </button>

          <button
            onClick={() => onTabChange('practice')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => onTabChange('belady')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'belady'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Belady Lab</span>
          </button>

          <button
            onClick={() => onTabChange('cheatsheet')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'cheatsheet'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Cheat-sheets</span>
          </button>

          <button
            onClick={() => onTabChange('pyq')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              activeTab === 'pyq'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden lg:inline">PYQs</span>
          </button>
        </nav>

        {/* Share Scenario button */}
        <div className="flex items-center gap-2">
          {onShareScenario && (
            <button
              onClick={onShareScenario}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700"
              title="Copy current simulation link with URL state"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedShare ? 'Copied!' : 'Share URL'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Submenu Bar when in 'simulators' tab */}
      {activeTab === 'simulators' && (
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 font-mono pl-2 pr-1">MODULE:</span>
          {[
            { id: 'page-replacement', label: '5. Page Replacement ⭐' },
            { id: 'banker', label: "3. Banker's Algorithm" },
            { id: 'rag', label: '2. RAG & Deadlock' },
            { id: 'paging', label: '4. Paging & Segmentation' },
            { id: 'sync', label: '1. Concurrency & Races' },
            { id: 'vm', label: '6. Virtual Memory' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSimulatorChange(item.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                activeSimulator === item.id
                  ? 'bg-indigo-600 text-white font-semibold shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
