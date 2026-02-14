export type ProjectType = 'campaign' | 'workflow' | 'ad-hoc' | 'dsp-onboarding' | 'jbp' | 'migration' | 'rfp' | 'infrastructure';

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

export type ProjectHealth = 'on-track' | 'at-risk' | 'blocked' | 'unknown';

export type ProjectMilestone = {
  name: string;
  status?: string;
  date?: string | null;
  createdAt?: string;
};

export type Project = {
  id: string;
  type: ProjectType | string;
  name: string;
  status: ProjectStatus | string;
  owner?: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  platform?: string | null;
  campaigns?: string[];
  executions?: string[];
  associatedWorkflowIds?: string[];
  milestones?: ProjectMilestone[];
  metrics?: {
    completion?: number;
    health?: ProjectHealth | string;
    blockers?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectStats = {
  total?: number;
  byType?: Record<string, number>;
  byStatus?: Record<string, number>;
  byHealth?: Record<string, number>;
  active?: number;
  atRisk?: number;
  blocked?: number;
};

export type ProjectsResponse =
  | {
      projects: Project[];
      stats?: ProjectStats;
    }
  | Project[];

export type ProjectFilters = {
  type?: string;
  status?: string;
};

export type CreateProjectRequest = {
  name: string;
  type: ProjectType | string;
  status?: ProjectStatus | string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  platform?: string;
  campaigns?: string[];
  associatedWorkflowIds?: string[];
};

export type UpdateProjectRequest = Partial<CreateProjectRequest>;
