import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './ui/components/Navbar';
import { LearnView } from './ui/views/LearnView';
import { PracticeView } from './ui/views/PracticeView';
import { CheatSheetsView } from './ui/views/CheatSheetsView';
import { PYQDashboardView } from './ui/views/PYQDashboardView';
import { PageReplacementSimulator } from './ui/simulators/PageReplacementSimulator';
import { BeladyLab } from './ui/simulators/BeladyLab';
import { BankersSimulator } from './ui/simulators/BankersSimulator';
import { RAGSimulator } from './ui/simulators/RAGSimulator';
import { PagingSimulator } from './ui/simulators/PagingSimulator';
import { SyncSimulator } from './ui/simulators/SyncSimulator';
import { VMSimulator } from './ui/simulators/VMSimulator';
import { ReplacementAlgorithm } from './core/replacement/types';

export const App: React.FC = () => {
  // Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('learn');
  const [activeSimulator, setActiveSimulator] = useState<string>('page-replacement');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Deep-linked simulator parameters (Section 4.2)
  const [pageReplParams, setPageReplParams] = useState<{
    refString?: number[];
    frames?: number;
    algorithm?: ReplacementAlgorithm;
    step?: number;
  }>({});

  // URL Deep Link parser on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as NavTab | null;
      const simParam = urlParams.get('sim');

      if (tabParam && ['learn', 'simulators', 'practice', 'belady', 'cheatsheet', 'pyq'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (simParam) {
        setActiveSimulator(simParam);
      }

      // Check replacement params in URL
      const algParam = urlParams.get('alg') as ReplacementAlgorithm | null;
      const framesParam = urlParams.get('frames');
      const refParam = urlParams.get('ref');
      const stepParam = urlParams.get('step');

      if (algParam || framesParam || refParam || stepParam) {
        setPageReplParams({
          algorithm: algParam || undefined,
          frames: framesParam ? parseInt(framesParam, 10) : undefined,
          refString: refParam
            ? refParam.split(/[,;]+/).map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n))
            : undefined,
          step: stepParam ? parseInt(stepParam, 10) : undefined,
        });
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  // Update URL search parameters when tab or simulator changes
  const updateUrl = useCallback((tab: NavTab, sim: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (tab === 'simulators') {
        url.searchParams.set('sim', sim);
      } else {
        url.searchParams.delete('sim');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore history errors
    }
  }, []);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    updateUrl(tab, activeSimulator);
  };

  const handleSimulatorChange = (sim: string) => {
    setActiveSimulator(sim);
    updateUrl('simulators', sim);
  };

  // Deep link handler when clicking simulator links from diagnosis or practice (Section 4.2)
  const handleOpenSimulatorLink = (link: string) => {
    try {
      setActiveTab('simulators');
      const queryIdx = link.indexOf('?');
      let params = new URLSearchParams();
      if (queryIdx !== -1) {
        params = new URLSearchParams(link.slice(queryIdx));
      }

      if (link.includes('page-replacement')) {
        setActiveSimulator('page-replacement');
        const alg = params.get('alg') as ReplacementAlgorithm | null;
        const frames = params.get('frames');
        const ref = params.get('ref');
        const step = params.get('step');
        setPageReplParams({
          algorithm: alg || 'fifo',
          frames: frames ? parseInt(frames, 10) : 3,
          refString: ref
            ? ref.split(/[,;]+/).map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n))
            : undefined,
          step: step ? parseInt(step, 10) : 0,
        });
      } else if (link.includes('banker')) {
        setActiveSimulator('banker');
      } else if (link.includes('rag')) {
        setActiveSimulator('rag');
      } else if (link.includes('paging')) {
        setActiveSimulator('paging');
      } else if (link.includes('sync')) {
        setActiveSimulator('sync');
      } else if (link.includes('virtual-memory') || link.includes('vm')) {
        setActiveSimulator('vm');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // fallback
    }
  };

  // Share scenario URL generator
  const handleShareScenario = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      if (activeTab === 'simulators') {
        url.searchParams.set('sim', activeSimulator);
      }
      navigator.clipboard.writeText(url.toString());
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeSimulator={activeSimulator}
        onSimulatorChange={handleSimulatorChange}
        onShareScenario={handleShareScenario}
        copiedShare={copiedShare}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: Topic Map / Learn */}
        {activeTab === 'learn' && (
          <LearnView
            onSelectSimulator={(simId) => {
              setActiveTab('simulators');
              setActiveSimulator(simId);
              updateUrl('simulators', simId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectPracticeTopic={() => {
              setActiveTab('practice');
              updateUrl('practice', activeSimulator);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* TAB 2: Simulators Hub */}
        {activeTab === 'simulators' && (
          <div className="flex flex-col gap-6">
            {activeSimulator === 'page-replacement' && (
              <PageReplacementSimulator
                initialRefString={pageReplParams.refString}
                initialFrames={pageReplParams.frames}
                initialAlgorithm={pageReplParams.algorithm}
                initialStep={pageReplParams.step}
              />
            )}
            {activeSimulator === 'banker' && (
              <BankersSimulator />
            )}
            {activeSimulator === 'rag' && (
              <RAGSimulator />
            )}
            {activeSimulator === 'paging' && (
              <PagingSimulator />
            )}
            {activeSimulator === 'sync' && (
              <SyncSimulator />
            )}
            {activeSimulator === 'vm' && (
              <VMSimulator />
            )}
          </div>
        )}

        {/* TAB 3: Practice Engine */}
        {activeTab === 'practice' && (
          <PracticeView
            onOpenSimulator={handleOpenSimulatorLink}
          />
        )}

        {/* TAB 4: Belady's Anomaly Lab */}
        {activeTab === 'belady' && (
          <BeladyLab />
        )}

        {/* TAB 5: Formula Cards / Cheat-sheets */}
        {activeTab === 'cheatsheet' && (
          <CheatSheetsView />
        )}

        {/* TAB 6: GATE PYQ Dashboard */}
        {activeTab === 'pyq' && (
          <PYQDashboardView
            onSelectPracticeQuestion={() => {
              setActiveTab('practice');
              updateUrl('practice', activeSimulator);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PageWise — GATE OS Visual & Infographic Tutor (Spec v0.1)</span>
          <span>Offline PWA Ready • Pure TypeScript Simulation Core • 0-Latency Interactive Traces</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
