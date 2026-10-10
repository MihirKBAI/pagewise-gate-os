import React from 'react';
import { QUESTION_BANK } from '../../core/questions/questionBank';
import { TOPICS } from '../../content/topics';
import { CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

interface PYQDashboardViewProps {
  onSelectPracticeQuestion: (questionId: string) => void;
}

export const PYQDashboardView: React.FC<PYQDashboardViewProps> = ({
  onSelectPracticeQuestion,
}) => {
  // Aggregate statistics
  const totalQuestions = QUESTION_BANK.length;
  const verifiedCount = QUESTION_BANK.filter((q) => q.pyq.some((p) => p.verified)).length;
  const unverifiedCount = totalQuestions - verifiedCount;

  // Topic breakdown
  const topicStats = TOPICS.map((topic) => {
    const qList = QUESTION_BANK.filter((q) => q.topicId === topic.id);
    const verified = qList.filter((q) => q.pyq.some((p) => p.verified)).length;
    return {
      topic,
      total: qList.length,
      verified,
      questions: qList,
    };
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">GATE PYQ Coverage Dashboard & Verification Tracker</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Section 13 PYQ Mapping: Track official GATE previous-year question archetypes, verification against official keys (FLAG-1 & FLAG-5), and practice twin links.
          </p>
        </div>

        {/* Verification Counter Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Verified: <strong className="text-white">{verifiedCount}</strong></span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Unverified Twins: <strong className="text-amber-300">{unverifiedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* FLAG-1 & FLAG-5 Protocol Box */}
      <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs font-sans text-slate-300 space-y-1">
          <span className="font-bold text-amber-300 uppercase tracking-wider block">
            Protocol Notice (FLAG-1 & FLAG-5):
          </span>
          <p>
            To avoid disseminating inaccurate citations or disputed answers, all previous-year questions are authored as <strong>paraphrased numerical twins</strong> linked to algorithmic solvers. References remain flagged with an <strong className="text-amber-300">Unverified Reference</strong> badge until explicitly audited and confirmed against official GATE answer keys.
          </p>
        </div>
      </div>

      {/* Topic Coverage Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topicStats.map(({ topic, total, verified }) => (
          <div
            key={topic.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-400">
                Module {topic.number}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {total} Drills
              </span>
            </div>

            <h3 className="font-bold text-sm text-white">
              {topic.title}
            </h3>

            {/* Coverage Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Coverage & Verified:</span>
                <span className="text-teal-400 font-bold">{verified} of {total} Verified</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-2 rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 line-clamp-2">
              Archetypes: {topic.shortDesc}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed PYQ Question Bank Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-sm">
            Question Twin Registry & Reference Key Status
          </span>
          <span className="text-xs font-mono text-slate-400">
            Total {QUESTION_BANK.length} Registered Questions
          </span>
        </div>

        <table className="w-full border-collapse font-mono text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="p-2.5">ID / Type</th>
              <th className="p-2.5">Topic</th>
              <th className="p-2.5">Archetype / Title</th>
              <th className="p-2.5 text-center">Status Badge</th>
              <th className="p-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {QUESTION_BANK.map((q) => {
              const isVerified = q.pyq.some((p) => p.verified);
              return (
                <tr
                  key={q.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="p-2.5">
                    <div className="font-bold text-slate-200">{q.id}</div>
                    <div className="text-[10px] text-indigo-400">{q.type} (Diff: {q.difficulty})</div>
                  </td>

                  <td className="p-2.5 text-slate-300">
                    {q.topicName}
                  </td>

                  <td className="p-2.5">
                    <div className="font-bold text-white">{q.title}</div>
                    <div className="text-[11px] text-slate-400 font-sans line-clamp-1">{q.archetype}</div>
                  </td>

                  <td className="p-2.5 text-center">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Paraphrased twin pending official paper confirmation">
                        UNVERIFIED TWIN
                      </span>
                    )}
                  </td>

                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => onSelectPracticeQuestion(q.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition inline-flex items-center gap-1 shadow"
                    >
                      Practice Drill <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
