import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Building2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { secureStorage } from '../../services/storage';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { showToast, openModal } = useApp();

  const [identifier, setIdentifier] = useState(secureStorage.getSavedIdentifier() || 'intelysol@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantDomain, setTenantDomain] = useState('intelysol.com');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your work email or employee code.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({
        identifier: identifier.trim(),
        password,
        tenantDomain,
      });
      showToast('success', 'Authenticated Successfully', 'Welcome to Intelysol HCM Mobile.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setErrorMessage(msg);
      showToast('error', 'Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = () => {
    setIdentifier('intelysol@gmail.com');
    setPassword('password123');
    setTenantDomain('intelysol.com');
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-50 via-white to-amber-50/20">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-4">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-600/20 mb-3.5">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Intelysol HCM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Employee Self-Service &amp; Attendance Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold">Authentication Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Organization Domain
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 size={16} />
              </div>
              <input
                type="text"
                value={tenantDomain}
                onChange={(e) => setTenantDomain(e.target.value)}
                placeholder="company.intelysol.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
            </div>
          </div>

          {/* Identifier: Email / Emp Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email or Employee ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@company.com or EMP-XXXX"
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() =>
                  showToast(
                    'info',
                    'Password Reset',
                    'Self-service password recovery is managed by your company HCM administrator.'
                  )
                }
                className="text-[11px] text-amber-700 hover:text-amber-800 font-medium"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[46px] mt-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-amber-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Sign In to Self-Service
                <ArrowRight size={15} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Pill */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg px-3 py-1.5 transition-colors font-medium inline-flex items-center gap-1.5"
          >
            <span>Autofill Employee Demo Credentials</span>
          </button>
          <p className="text-[11px] text-slate-500 mt-2">
            Default credentials: <span className="font-mono text-slate-700">intelysol@gmail.com</span> / <span className="font-mono text-slate-700">password123</span>
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 pt-3">
        <span>Powered by Intelysol Multi-Tenant SaaS Engine</span>
        <span className="mx-1.5">·</span>
        <button
          onClick={() => openModal('api-config')}
          className="hover:underline text-slate-500"
        >
          API Settings
        </button>
      </div>
    </div>
  );
};
