import React, { useState } from 'react';
import { TOPICS } from '../../content/topics';
import { Layers, Cpu, ArrowRight, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';

interface LearnViewProps {
  onSelectSimulator: (simId: string) => void;
  onSelectPracticeTopic?: (topicId: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  onSelectSimulator,
  onSelectPracticeTopic,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('page-replacement');

  const selectedTopic = TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            GATE CS/IT Operating Systems Visual Tutor
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Turn Abstract OS Numericals into Watchable, Steppable Animations.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            Textbook solutions to page-faults, banker&apos;s algorithms, address translations, and concurrency races are dry rows of symbols. PageWise lets you watch frames fill, queues rotate, safe sequences prove freedom, and hardware address lines split in real time.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectSimulator('page-replacement')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Layers className="w-4 h-4" /> Launch Flagship Simulator (Page Replacement)
            </button>
            {onSelectPracticeTopic && (
              <button
                onClick={() => onSelectPracticeTopic('all')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition"
              >
                <Cpu className="w-4 h-4" /> Start Practice Engine
              </button>
            )}
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* Main Content Layout: Sidebar Topics List + Selected Topic Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Topic List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Curriculum Modules (6 Core Topics)
          </span>

          {TOPICS.sort((a, b) => a.number - b.number).map((topic) => {
            const isSelected = topic.id === selectedTopicId;
            return (
              <div
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    Module {topic.number}
                  </span>
                  {topic.flagship && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      FLAGSHIP ⭐
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{topic.title}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {topic.shortDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Topic Expanded Guide (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          {/* Header of selected topic */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                  Module {selectedTopic.number}
                </span>
                <h2 className="text-xl font-bold text-white">
                  {selectedTopic.title}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {selectedTopic.shortDesc}
              </p>
            </div>

            <button
              onClick={() => onSelectSimulator(selectedTopic.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow transition flex-shrink-0"
            >
              Open Interactive Simulator <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hook story callout */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0">
              💡
            </span>
            <div className="text-xs">
              <span className="font-bold text-indigo-300 text-sm block mb-0.5">
                The Conceptual Hook
              </span>
              <p className="text-slate-300 leading-relaxed font-sans">
                {selectedTopic.hook}
              </p>
            </div>
          </div>

          {/* Method Checklist */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exam Method Checklist (Step-by-Step)
            </span>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              {selectedTopic.methodChecklist.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-indigo-400 flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed pt-0.5 font-sans">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Exam Misconceptions (The Distractor Catalog) */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" /> Common Misconceptions & Traps
            </span>
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
              {selectedTopic.misconceptions.map((misc, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-200">
                  <span className="text-amber-400 font-bold flex-shrink-0">⚠️</span>
                  <p className="leading-relaxed font-sans">{misc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Formulas */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Key Numerical Formulas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedTopic.formulas.map((form, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 font-mono text-xs">
                  <span className="text-slate-400 font-sans font-semibold text-[11px]">{form.label}</span>
                  <span className="text-indigo-300 font-bold text-sm bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {form.formula}
                  </span>
                  {form.note && <span className="text-[10px] text-slate-500 font-sans">{form.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
