/**
 * Authentication Service with Admin Seeding Logic
 * Manages registration, login, session persistence, and RBAC admin role assignment.
 */

import { UserAdminProfile } from '../types/admin';

// Admin Seeding Array: Any email matching this list will be granted isAdmin: true and role: 'admin'
export const ADMIN_EMAILS: string[] = [
  'scrf@tsadinaledi.co.za',
];

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  institutionName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const STORAGE_USERS_KEY = 'dinaledi360_users';
const STORAGE_CURRENT_USER_KEY = 'dinaledi360_current_user';

/**
 * Checks if an email is seeded as an admin account
 */
export function isSeededAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

/**
 * Get all registered users from localStorage (plus defaults)
 */
function getStoredUsers(): Record<string, { profile: UserAdminProfile; passwordHash: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load users from localStorage:', err);
  }

  // Initial Seeded Users
  const defaultUsers: Record<string, { profile: UserAdminProfile; passwordHash: string }> = {
    'scrf@tsadinaledi.co.za': {
      profile: {
        id: 'usr_admin_tsadinaledi',
        name: 'TSA Dinaledi Master Admin',
        email: 'scrf@tsadinaledi.co.za',
        institutionId: 'inst_tsa_01',
        institutionName: 'TSA Dinaledi Headquarters',
        cohortId: 'cohort_2026_master',
        cohortName: '2026 National Executive Cohort',
        role: 'admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        attemptsCount: 0,
        isMinorCohort: false,
      },
      passwordHash: 'password123',
    },
    'evaluator.sithole@dinaledi360.gov.za': {
      profile: {
        id: 'usr_sithole',
        name: 'Dr. A. Sithole (Evaluator)',
        email: 'evaluator.sithole@dinaledi360.gov.za',
        institutionId: 'inst_seta_01',
        institutionName: 'INSETA Entrepreneurship Development Programme',
        cohortId: 'cohort_2026_q1',
        cohortName: '2026 Q1 Youth Founders Cohort A',
        role: 'student',
        isAdmin: false,
        createdAt: '2025-11-01',
        attemptsCount: 2,
        isMinorCohort: false,
      },
      passwordHash: 'password123',
    },
    'sibusiso.d@example.co.za': {
      profile: {
        id: 'usr_101',
        name: 'Sibusiso Dlamini',
        email: 'sibusiso.d@example.co.za',
        institutionId: 'inst_seta_01',
        institutionName: 'INSETA Entrepreneurship Development Programme',
        cohortId: 'cohort_2026_q1',
        cohortName: '2026 Q1 Youth Founders Cohort A',
        role: 'student',
        isAdmin: false,
        createdAt: '2026-01-15',
        attemptsCount: 2,
        isMinorCohort: false,
      },
      passwordHash: 'password123',
    },
  };

  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultUsers));
  } catch (err) {
    console.error('Failed to save default seeded users:', err);
  }

  return defaultUsers;
}

/**
 * Register a new user with automatic Admin Seeding verification
 */
export async function registerUser(payload: RegisterPayload): Promise<UserAdminProfile> {
  // Simulate network latency for auth request
  await new Promise((res) => setTimeout(res, 600));

  const emailNorm = payload.email.trim().toLowerCase();
  const users = getStoredUsers();

  if (users[emailNorm]) {
    throw new Error('An account with this email address already exists. Please login instead.');
  }

  const isAdmin = isSeededAdminEmail(emailNorm);

  const newProfile: UserAdminProfile = {
    id: `usr_${Date.now().toString(36)}`,
    name: payload.fullName.trim(),
    email: emailNorm,
    institutionId: isAdmin ? 'inst_seta_01' : 'inst_user_custom',
    institutionName: payload.institutionName?.trim() || (isAdmin ? 'INSETA Entrepreneurship Development' : 'INSETA Incubator Program'),
    cohortId: 'cohort_2026_q1',
    cohortName: '2026 Youth Enterprise Acceleration',
    role: isAdmin ? 'admin' : 'student',
    isAdmin: isAdmin,
    createdAt: new Date().toISOString(),
    attemptsCount: 0,
    isMinorCohort: false,
  };

  users[emailNorm] = {
    profile: newProfile,
    passwordHash: payload.password, // Simple local hashed simulation
  };

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(newProfile));

  return newProfile;
}

/**
 * Login existing user
 */
export async function loginUser(payload: LoginPayload): Promise<UserAdminProfile> {
  await new Promise((res) => setTimeout(res, 500));

  const emailNorm = payload.email.trim().toLowerCase();
  const users = getStoredUsers();
  const userRecord = users[emailNorm];

  if (!userRecord) {
    throw new Error('No account found with this email address. Please check your credentials or register.');
  }

  if (userRecord.passwordHash !== payload.password) {
    throw new Error('Invalid password. Please check your password and try again.');
  }

  // Re-verify if email is in ADMIN_EMAILS in case seeding list updated
  const isAdmin = isSeededAdminEmail(emailNorm) || userRecord.profile.isAdmin;
  const updatedProfile: UserAdminProfile = {
    ...userRecord.profile,
    isAdmin,
    role: isAdmin ? 'admin' : userRecord.profile.role,
  };

  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedProfile));
  return updatedProfile;
}

/**
 * Retrieve currently logged in user session
 */
export function getCurrentSessionUser(): UserAdminProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading session user:', err);
  }
  return null;
}

/**
 * Logout current user
 */
export function logoutUser(): void {
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
}
