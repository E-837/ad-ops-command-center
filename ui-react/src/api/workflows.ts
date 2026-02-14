import { apiGet, apiPost } from './client';
import type {
  RunWorkflowRequest,
  RunWorkflowResponse,
  Workflow,
  WorkflowExecution,
  WorkflowRegistryResponse,
} from '../types/workflow';

type ExecutionsListResponse = {
  executions: WorkflowExecution[];
};

export const workflowKeys = {
  all: ['workflows'] as const,
  registry: ['workflows', 'registry'] as const,
  detail: (id: string) => ['workflows', id] as const,
  history: (id: string) => ['workflows', id, 'history'] as const,
  execution: (workflowId: string, executionId: string) => ['workflows', workflowId, 'executions', executionId] as const,
  executionEvents: (workflowId: string, executionId: string) => ['workflows', workflowId, 'executions', executionId, 'events'] as const,
  executions: ['executions'] as const,
};

export async function getWorkflows(): Promise<WorkflowRegistryResponse> {
  return apiGet<WorkflowRegistryResponse>('/workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return apiGet<Workflow>(`/workflows/${id}`);
}

export async function runWorkflow(id: string, payload: RunWorkflowRequest): Promise<RunWorkflowResponse> {
  return apiPost<RunWorkflowResponse>(`/workflows/${id}/run`, payload);
}

export async function getWorkflowExecution(workflowId: string, executionId: string): Promise<WorkflowExecution> {
  return apiGet<WorkflowExecution>(`/workflows/${workflowId}/executions/${executionId}`);
}

export async function getWorkflowHistory(workflowId: string, limit = 20): Promise<WorkflowExecution[]> {
  return apiGet<WorkflowExecution[]>(`/workflows/${workflowId}/history?limit=${limit}`);
}

export async function getAllExecutions(limit = 50): Promise<WorkflowExecution[]> {
  const data = await apiGet<ExecutionsListResponse | WorkflowExecution[]>(`/executions?limit=${limit}`);
  return Array.isArray(data) ? data : data.executions ?? [];
}

export function getWorkflowExecutionEventsUrl(workflowId: string, executionId: string): string {
  return `/api/workflows/${workflowId}/executions/${executionId}/events`;
}
