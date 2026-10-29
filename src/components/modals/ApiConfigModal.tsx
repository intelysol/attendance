import React, { useState } from 'react';
import { X, Settings2, Server, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';

export const ApiConfigModal: React.FC = () => {
  const { closeModal, apiConfig, updateApiConfig, showToast } = useApp();

  const [baseUrl, setBaseUrl] = useState(apiConfig.baseUrl);
  const [useMock, setUseMock] = useState(apiConfig.useMockAdapter);
  const [timeoutSec, setTimeoutSec] = useState(apiConfig.timeoutMs / 1000);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    reachable: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await apiClient.pingBackend();
      setPingResult(res);
      if (res.reachable) {
        showToast('success', 'Backend Connected', res.message);
      } else {
        showToast('error', 'Backend Unreachable', res.message);
      }
    } finally {
      setPinging(false);
    }
  };

  const handleSave = () => {
    updateApiConfig({
      baseUrl: baseUrl.trim(),
      useMockAdapter: useMock,
      timeoutMs: timeoutSec * 1000,
    });
    showToast('success', 'Settings Saved', 'API connection configuration updated.');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">API Integration &amp; Server</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Adapter Switcher */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Backend Source Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUseMock(true)}
              className={`p-3 rounded-xl border text-left transition-all ${
                useMock
                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Mock Adapter</span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal leading-tight">
                Self-contained in-memory controller simulating Laravel /api/v1/
              </p>
            </button>

            <button
              type="button"
              onClick={() => setUseMock(false)}
              className={`p-3 rounded-xl border text-left transition-all ${
                !useMock
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Laravel API</span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal leading-tight">
                Connects directly to your deployed Laravel HCM SaaS REST API
              </p>
            </button>
          </div>
        </div>

        {/* Base URL Configuration */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            API Base URL (<span className="font-mono text-amber-700">API_BASE_URL</span>)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://hcm-api.example.com/api/v1"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-600"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Expected versioned endpoints: <code className="text-slate-600 font-mono">/api/v1/attendance/punch</code>, <code className="text-slate-600 font-mono">/api/v1/auth/login</code>
          </p>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Request Timeout (seconds)
          </label>
          <input
            type="number"
            min={3}
            max={60}
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
            className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Ping Test Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={pinging}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {pinging ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin" />
                Pinging Backend...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Radio size={13} />
                Test Connection Prober
              </span>
            )}
          </button>

          {pingResult && (
            <div
              className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                pingResult.reachable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {pingResult.reachable ? (
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-tight">
                <span className="font-bold">
                  {pingResult.reachable ? 'Connection OK' : 'Probe Failed'} ({pingResult.latencyMs}ms):
                </span>{' '}
                {pingResult.message}
              </div>
            </div>
          )}
        </div>

        {/* Save & Reset */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Save Configuration
          </button>
          <button
            type="button"
            onClick={() => {
              setBaseUrl('https://hcm-api.example.com/api/v1');
              setUseMock(true);
            }}
            className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
