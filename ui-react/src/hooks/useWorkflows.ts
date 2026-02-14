import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllExecutions,
  getWorkflow,
  getWorkflowExecution,
  getWorkflowHistory,
  getWorkflows,
  runWorkflow,
  workflowKeys,
} from '../api/workflows';
import type { RunWorkflowRequest, RunWorkflowResponse, WorkflowExecution } from '../types/workflow';

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.registry,
    queryFn: getWorkflows,
  });
}

export function useWorkflow(id?: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id || ''),
    queryFn: () => getWorkflow(id as string),
    enabled: Boolean(id),
  });
}

export function useWorkflowHistory(id?: string, limit = 20) {
  return useQuery({
    queryKey: [...workflowKeys.history(id || ''), limit],
    queryFn: () => getWorkflowHistory(id as string, limit),
    enabled: Boolean(id),
    refetchInterval: 5000,
  });
}

export function useExecutions(limit = 50) {
  return useQuery({
    queryKey: [...workflowKeys.executions, limit],
    queryFn: () => getAllExecutions(limit),
    refetchInterval: 5000,
  });
}

export function useWorkflowExecution(workflowId?: string, executionId?: string) {
  return useQuery({
    queryKey: workflowKeys.execution(workflowId || '', executionId || ''),
    queryFn: () => getWorkflowExecution(workflowId as string, executionId as string),
    enabled: Boolean(workflowId && executionId),
    refetchInterval: (q) => {
      const state = q.state.data as WorkflowExecution | undefined;
      if (!state) return 5000;
      return state.status === 'queued' || state.status === 'running' ? 3000 : false;
    },
  });
}

export function useRunWorkflow(workflowId: string) {
  const qc = useQueryClient();
  return useMutation<RunWorkflowResponse, Error, RunWorkflowRequest>({
    mutationFn: (payload) => runWorkflow(workflowId, payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: workflowKeys.registry });
      qc.invalidateQueries({ queryKey: workflowKeys.executions });
      qc.setQueryData(workflowKeys.execution(workflowId, result.executionId), {
        id: result.executionId,
        workflowId,
        status: result.status,
        stages: [],
      });
    },
  });
}
