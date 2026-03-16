import { create } from "zustand";
import { usersAPI } from "./api";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  tier: string;
  onboarding_completed: boolean;
}

interface Profile {
  id: string;
  headline: string | null;
  summary: string | null;
  years_of_experience: number | null;
  current_location: string | null;
  preferred_locations: string[] | null;
  open_to_remote: boolean;
  desired_job_titles: string[] | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  requires_visa_sponsorship: boolean;
  skills: any[];
  work_experiences: any[];
  education: any[];
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setProfile: (profile: Profile) => void;
  login: (tokens: { access_token: string; refresh_token: string }, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: (() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("access_token");
    // Sync cookie with localStorage on initialization
    if (token) {
      document.cookie = "access_token=" + token + "; path=/; max-age=86400; SameSite=Lax";
    }
    return !!token;
  })(),

  setUser: (user) => set({ user, isAuthenticated: true }),

  setProfile: (profile) => set({ profile }),

  login: (tokens, user) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    document.cookie = "access_token=" + tokens.access_token + "; path=/; max-age=86400; SameSite=Lax";
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    set({ user: null, profile: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data } = await usersAPI.me();
      const { profile, ...userData } = data;
      set({
        user: userData,
        profile: profile || null,
        isAuthenticated: true,
      });
    } catch {
      // If fetch fails (e.g. token expired), don't crash — the interceptor handles 401
    }
  },
}));

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
