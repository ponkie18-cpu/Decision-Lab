/**
 * AdminRoute Component / Route Guard
 * Enforces Role-Based Access Control (RBAC).
 * Verifies if user.isAdmin is true. If not, blocks access and provides a clean
 * unauthorized warning with a redirect / fallback to the standard user dashboard.
 */

import React from 'react';
import { UserAdminProfile } from '../../types/admin';
import { ShieldAlert, Lock, ArrowLeft, KeyRound } from 'lucide-react';

interface AdminRouteProps {
  user: UserAdminProfile | null;
  children: React.ReactNode;
  onRedirectToDashboard?: () => void;
  onGrantDemoAdminAccess?: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  user,
  children,
  onRedirectToDashboard,
  onGrantDemoAdminAccess,
}) => {
  // Check if user exists and has explicit isAdmin permission
  const hasAdminAccess = Boolean(user && user.isAdmin);

  if (!hasAdminAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#0B0F19] font-mono">
        <div className="max-w-lg w-full bg-[#0F172A] border border-red-500/30 rounded-xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <ShieldAlert size={28} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                SECURITY ALERT // ACCESS DENIED
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Restricted Admin Territory
              </h2>
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Current User ID:</span>
              <span className="font-bold text-slate-200">{user?.id || 'ANONYMOUS_GUEST'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="font-bold text-amber-400 uppercase">{user?.role || 'standard_user'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Admin Permission Flag:</span>
              <span className="font-bold text-red-400">isAdmin: false</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            You are attempting to access institutional analytics (Behavioral Radar & Cohort Evidence Reports). 
            Access is strictly restricted to certified SETA/University evaluators and platform administrators.
          </p>

          <div className="pt-2 flex flex-col gap-3">
            {onGrantDemoAdminAccess && (
              <button
                onClick={onGrantDemoAdminAccess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
              >
                <KeyRound size={16} />
                Switch to Demo Admin Evaluator Role
              </button>
            )}

            {onRedirectToDashboard && (
              <button
                onClick={onRedirectToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Return to Standard User Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Access Granted -> Render Admin Views
  return <>{children}</>;
};
