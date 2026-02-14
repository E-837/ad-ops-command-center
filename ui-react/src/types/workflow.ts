export type WorkflowInputType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export type WorkflowInputSchema = {
  type: WorkflowInputType;
  required?: boolean;
  description?: string;
  default?: unknown;
};

export type WorkflowStageDefinition = {
  id: string;
  name: string;
  agent?: string | null;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  triggers?: {
    manual?: boolean;
    scheduled?: string | null;
    events?: string[];
  };
  requiredConnectors?: string[];
  optionalConnectors?: string[];
  inputs?: Record<string, WorkflowInputSchema>;
  outputs?: string[];
  stages?: WorkflowStageDefinition[];
  estimatedDuration?: string;
  isOrchestrator?: boolean;
  subWorkflows?: string[];
};

export type WorkflowCategory = {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  workflows: string[];
};

export type WorkflowRegistryResponse = {
  workflows: Workflow[];
  categories: WorkflowCategory[];
  stats?: {
    totalWorkflows: number;
    byCategory: Record<string, number>;
    byTriggerType: Record<string, number>;
    orchestrators: number;
  };
};

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'warning';

export type ExecutionStage = {
  id: string;
  name: string;
  status: string;
  agent?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  result?: unknown;
  error?: string | null;
};

export type WorkflowArtifact = {
  type: string;
  url?: string;
  name?: string;
  createdAt?: string;
};

export type WorkflowExecution = {
  id: string;
  projectId?: string | null;
  workflowId: string;
  status: ExecutionStatus;
  params?: Record<string, unknown>;
  stages: ExecutionStage[];
  result?: unknown;
  error?: string | null;
  artifacts?: WorkflowArtifact[];
  events?: string[];
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
};

export type RunWorkflowRequest = Record<string, unknown>;

export type RunWorkflowResponse = {
  executionId: string;
  status: ExecutionStatus;
  statusUrl: string;
  eventsUrl: string;
};

export type WorkflowExecutionEvent = {
  type: string;
  executionId?: string;
  workflowId?: string;
  status?: ExecutionStatus;
  stageId?: string;
  stageName?: string;
  stageIndex?: number;
  totalStages?: number;
  current?: number;
  total?: number;
  progress?: number;
  detail?: string;
  error?: string;
  [key: string]: unknown;
};
