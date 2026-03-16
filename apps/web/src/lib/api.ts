import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8006/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──
export const authAPI = {
  signup: (data: { email: string; password: string; full_name: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  oauth: (data: { provider: string; access_token: string }) =>
    api.post("/auth/oauth", data),
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
};

// ── Resume ──
export const resumeAPI = {
  upload: (file: File, label?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (label) form.append("label", label);
    return api.post("/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/resume"),
  getParsed: (id: string) => api.get(`/resume/${id}/parsed`),
  setPrimary: (id: string) => api.post(`/resume/${id}/set-primary`),
};

// ── Jobs ──
export const jobsAPI = {
  search: (params: Record<string, any>) => api.get("/jobs/search", { params }),
  matches: (params?: { page?: number }) => api.get("/jobs/matches", { params }),
  feed: (limit?: number) => api.get("/jobs/feed", { params: { limit } }),
  saved: () => api.get("/jobs/saved"),
  detail: (id: string) => api.get(`/jobs/${id}`),
  swipe: (data: { job_id: string; action: string }) =>
    api.post("/jobs/swipe", data),
};

// ── Applications ──
export const applicationsAPI = {
  list: (params?: { status?: string; page?: number }) =>
    api.get("/applications", { params }),
  detail: (id: string) => api.get(`/applications/${id}`),
  create: (data: { job_id: string; auto_generate_materials?: boolean }) =>
    api.post("/applications", data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/applications/${id}/status`, data),
  updateNotes: (id: string, notes: string) =>
    api.patch(`/applications/${id}/notes`, { notes }),
  autoApply: (data: { job_ids: string[]; cover_letter_tone?: string }) =>
    api.post("/applications/auto-apply", data),
  dashboard: () => api.get("/applications/dashboard"),
  analytics: () => api.get("/applications/analytics"),
};

// ── Users ──
export const usersAPI = {
  me: () => api.get("/users/me"),
  updateMe: (data: { full_name?: string; avatar_url?: string }) =>
    api.put("/users/me", data),
  updateProfile: (data: Record<string, any>) =>
    api.put("/users/me/profile", data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put("/users/me/password", null, { params: data }),
};

// ── Notifications ──
export const notificationsAPI = {
  list: (params?: { unread_only?: boolean; page?: number }) =>
    api.get("/notifications", { params }),
  count: () => api.get("/notifications/count"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// ── AI ──
export const aiAPI = {
  generateCoverLetter: (data: {
    job_id: string;
    tone?: string;
    custom_instructions?: string;
  }) => api.post("/ai/cover-letter", data),
  tailorResume: (job_id: string) =>
    api.post(`/ai/tailor-resume?job_id=${job_id}`),
  resumeFeedback: () => api.post("/ai/resume-feedback"),
  chat: (data: {
    message: string;
    conversation_id?: string;
    context_type?: string;
  }) => api.post("/ai/chat", null, { params: data }),
  interviewPrep: (job_id: string) =>
    api.post(`/ai/interview-prep?job_id=${job_id}`),
  conversations: () => api.get("/ai/chat/conversations"),
};
