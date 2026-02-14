import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, getProjects, projectKeys, updateProject } from '../api/projects';
import type { CreateProjectRequest, Project, ProjectFilters, UpdateProjectRequest } from '../types/project';

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation<Project, Error, CreateProjectRequest>({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation<Project, Error, { id: string; payload: UpdateProjectRequest }>({
    mutationFn: ({ id, payload }) => updateProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
