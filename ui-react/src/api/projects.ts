import { apiGet, apiPatch, apiPost } from './client';
import type {
  CreateProjectRequest,
  Project,
  ProjectFilters,
  ProjectsResponse,
  ProjectStats,
  UpdateProjectRequest,
} from '../types/project';

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters?: ProjectFilters) => ['projects', 'list', filters ?? {}] as const,
  detail: (id: string) => ['projects', id] as const,
};

function normalizeProjectsResponse(payload: ProjectsResponse): { projects: Project[]; stats?: ProjectStats } {
  if (Array.isArray(payload)) return { projects: payload };
  return {
    projects: payload.projects ?? [],
    stats: payload.stats,
  };
}

export async function getProjects(filters?: ProjectFilters): Promise<{ projects: Project[]; stats?: ProjectStats }> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.status) params.set('status', filters.status);
  const query = params.toString();
  const response = await apiGet<ProjectsResponse>(`/projects${query ? `?${query}` : ''}`);
  return normalizeProjectsResponse(response);
}

export async function getProject(id: string): Promise<Project> {
  return apiGet<Project>(`/projects/${id}`);
}

export async function createProject(payload: CreateProjectRequest): Promise<Project> {
  return apiPost<Project>('/projects', payload);
}

export async function updateProject(id: string, payload: UpdateProjectRequest): Promise<Project> {
  return apiPatch<Project>(`/projects/${id}`, payload);
}
