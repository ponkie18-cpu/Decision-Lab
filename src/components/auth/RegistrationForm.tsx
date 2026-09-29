/**
 * RegistrationForm Component
 * Full user registration UI with inline validation, dark SaaS styling,
 * and live notification for seeded admin emails.
 */

import React, { useState } from 'react';
import { registerUser, isSeededAdminEmail, RegisterPayload } from '../../services/authService';
import { UserAdminProfile } from '../../types/admin';
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

interface RegistrationFormProps {
  onSuccess: (user: UserAdminProfile) => void;
  onSwitchToLogin: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<RegisterPayload>({
    fullName: '',
    email: '',
    password: '',
    institutionName: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDetectedAdmin = isSeededAdminEmail(formData.email);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser(formData);
      onSuccess(user);
    } catch (err: any) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#0B0F19] font-sans">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Sparkles size={12} /> Dinaledi360 Account Portal
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Your Account</h1>
          <p className="text-xs text-slate-400">
            Join the Entrepreneurial Forensic & Decision Game Engine
          </p>
        </div>

        {/* Seeded Admin Detection Banner */}
        {isDetectedAdmin && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-mono">
            <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
            <div>
              <strong className="block text-emerald-200">Admin Email Detected!</strong>
              <span><code className="text-emerald-300">{formData.email}</code> will be granted full Evaluator & Admin Portal access upon registration.</span>
            </div>
          </div>
        )}

        {/* Global Submit Error Banner */}
        {submitError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-xs font-mono">
            <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Full Name *</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. Sibusiso Dlamini"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  errors.fullName ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                } rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-mono`}
              />
            </div>
            {errors.fullName && <p className="text-[10px] text-red-400 font-mono mt-0.5">{errors.fullName}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Email Address *</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, email: 'scrf@tsadinaledi.co.za' })}
                className="text-[9px] font-mono text-indigo-400 hover:underline cursor-pointer"
              >
                Use Admin Email
              </button>
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="e.g. scrf@tsadinaledi.co.za"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  errors.email ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                } rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-mono`}
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-400 font-mono mt-0.5">{errors.email}</p>}
          </div>

          {/* Institution / Organization Name (Optional) */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Institution / Incubator (Optional)</label>
            <div className="relative">
              <Building size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. INSETA / UJ Business Incubator"
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Password *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  errors.password ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                } rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-mono`}
              />
            </div>
            {errors.password && <p className="text-[10px] text-red-400 font-mono mt-0.5">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Confirm Password *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-900 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                } rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors font-mono`}
              />
            </div>
            {errors.confirmPassword && <p className="text-[10px] text-red-400 font-mono mt-0.5">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 pt-3"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                Creating Account...
              </>
            ) : (
              <>
                Complete Registration
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo-400 hover:text-indigo-300 font-mono font-bold hover:underline cursor-pointer"
            >
              Sign In Here
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
