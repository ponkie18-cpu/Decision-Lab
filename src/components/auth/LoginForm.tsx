/**
 * LoginForm Component
 * Simplified dark enterprise SaaS login screen with preset demo account buttons.
 */

import React, { useState } from 'react';
import { loginUser, LoginPayload } from '../../services/authService';
import { UserAdminProfile } from '../../types/admin';
import { Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onSuccess: (user: UserAdminProfile) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const [formData, setFormData] = useState<LoginPayload>({
    email: 'scrf@tsadinaledi.co.za',
    password: 'password123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(formData);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (email: string) => {
    setFormData({
      email,
      password: 'password123',
    });
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#0B0F19] font-sans">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles size={12} /> Dinaledi360 Authentication
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In to Dashboard</h1>
          <p className="text-xs text-slate-400">
            Access simulations or institutional evaluator reports
          </p>
        </div>

        {/* Quick Preset Buttons */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
            Quick Fill Demo Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('scrf@tsadinaledi.co.za')}
              className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck size={14} className="text-indigo-400" />
              Seeded Admin (scrf@)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('sibusiso.d@example.co.za')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserCheck size={14} className="text-slate-400" />
              Standard Student
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-xs font-mono">
            <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="scrf@tsadinaledi.co.za"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Platform
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-emerald-400 hover:text-emerald-300 font-mono font-bold hover:underline cursor-pointer"
            >
              Register Here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
