import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: string;
}

interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMember[];
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Current Project
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  // Projects list
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  fetchProjects: () => Promise<void>;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
  })),
  removeProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
  })),
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/v1/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const result = await response.json();
      if (result.success) {
        set({ projects: result.data });
      } else {
        throw new Error(result.error?.message || "Failed to fetch projects");
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      set({ isLoading: false });
    }
  },

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
