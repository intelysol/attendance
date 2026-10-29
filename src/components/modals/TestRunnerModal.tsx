import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Play, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { runAllTests, TestCaseResult, TEST_SUITE_DEFINITIONS } from '../../services/testRunner';

export const TestRunnerModal: React.FC = () => {
  const { closeModal } = useApp();

  const [tests, setTests] = useState<TestCaseResult[]>(
    TEST_SUITE_DEFINITIONS.map((t) => ({ ...t, status: 'pending' }))
  );
  const [isRunning, setIsRunning] = useState(false);

  const startTestExecution = async () => {
    setIsRunning(true);
    try {
      const results = await runAllTests((currentProgress) => {
        setTests(currentProgress);
      });
      setTests(results);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Auto-run once on open
    startTestExecution();
  }, []);

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Production Test Suite
              </h3>
              <p className="text-[11px] text-slate-500">
                16 Verification Specifications (Section 16 Requirements)
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress & Summary Bar */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Status: {isRunning ? 'Running Suites...' : 'Execution Completed'}
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                {passedCount}/{tests.length} Passed
              </span>
              {failedCount > 0 && (
                <span className="text-xs font-bold text-red-600 tabular-nums">
                  ({failedCount} Failed)
                </span>
              )}
            </div>
            <div className="w-48 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(passedCount / tests.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={startTestExecution}
            disabled={isRunning}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Play size={13} />
            )}
            <span>{isRunning ? 'Testing...' : 'Rerun All'}</span>
          </button>
        </div>

        {/* Test List */}
        <div className="space-y-2">
          {tests.map((test) => (
            <div
              key={test.id}
              className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                test.status === 'passed'
                  ? 'bg-emerald-50/30 border-emerald-200/80'
                  : test.status === 'failed'
                  ? 'bg-red-50/50 border-red-300'
                  : test.status === 'running'
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {test.status === 'passed' && (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    )}
                    {test.status === 'failed' && (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    {test.status === 'running' && (
                      <RefreshCw size={16} className="text-amber-600 animate-spin" />
                    )}
                    {test.status === 'pending' && (
                      <span className="w-4 h-4 rounded-full border-2 border-slate-300 block" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {test.category}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {test.id}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-0.5">
                      {test.name}
                    </h4>
                  </div>
                </div>

                {test.durationMs !== undefined && (
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                    {test.durationMs}ms
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                {test.description}
              </p>

              {test.details && (
                <div className="ml-6 p-2 bg-white/80 rounded-xl border border-slate-100 text-[11px] text-slate-700 font-mono">
                  {test.details}
                </div>
              )}

              {test.error && (
                <div className="ml-6 p-2 bg-red-100/70 rounded-xl border border-red-200 text-[11px] text-red-800 font-mono">
                  Error: {test.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
