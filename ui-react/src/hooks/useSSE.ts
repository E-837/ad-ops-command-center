import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { workflowKeys } from '../api/workflows';
import { agentKeys } from '../api/agents';
import type { AgentMessage } from '../types/agent';
import type { WorkflowExecution, WorkflowExecutionEvent } from '../types/workflow';

function normalizeEvent(raw: unknown): WorkflowExecutionEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;

  if (data.data && typeof data.data === 'object') {
    const inner = data.data as Record<string, unknown>;
    return {
      type: String(data.type || inner.type || 'unknown'),
      ...inner,
    };
  }

  return data as WorkflowExecutionEvent;
}

function mergeExecution(oldExecution: WorkflowExecution | undefined, event: WorkflowExecutionEvent): WorkflowExecution {
  const base: WorkflowExecution = oldExecution || {
    id: String(event.executionId || ''),
    workflowId: String(event.workflowId || ''),
    status: 'queued',
    stages: [],
  };

  const next: WorkflowExecution = {
    ...base,
    ...event,
    id: String(event.executionId || base.id),
    workflowId: String(event.workflowId || base.workflowId),
    status: (event.status as WorkflowExecution['status']) || base.status,
    stages: [...(base.stages || [])],
  };

  const stageId = event.stageId ? String(event.stageId) : undefined;
  if (stageId) {
    const idx = next.stages.findIndex((s) => s.id === stageId);
    const stagePatch = {
      id: stageId,
      name: String(event.stageName || stageId),
      status: String(event.type?.includes('failed') ? 'failed' : event.type?.includes('completed') ? 'completed' : event.type?.includes('started') ? 'running' : 'running'),
    };

    if (idx >= 0) next.stages[idx] = { ...next.stages[idx], ...stagePatch };
    else next.stages.push(stagePatch);
  }

  if (String(event.type).includes('completed')) next.completedAt = new Date().toISOString();
  if (String(event.type).includes('started') && !next.startedAt) next.startedAt = new Date().toISOString();
  if (String(event.type).includes('failed')) next.error = String(event.error || 'Workflow failed');

  return next;
}

function appendEvent(oldEvents: WorkflowExecutionEvent[] | undefined, event: WorkflowExecutionEvent) {
  const events = oldEvents ? [...oldEvents] : [];
  events.push({ ...event, _receivedAt: new Date().toISOString() });
  return events.slice(-500);
}

export function useSSE(url: string) {
  const qc = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let retries = 0;
    let reconnectTimer: number | undefined;

    const connect = () => {
      es = new EventSource(url);

      es.onmessage = (evt) => {
        const raw = JSON.parse(evt.data) as { type?: string; data?: unknown } | WorkflowExecutionEvent;

        if ((raw as { type?: string }).type === 'agent_message') {
          const message = (raw as { data?: AgentMessage }).data;
          if (!message) return;

          qc.setQueryData([...agentKeys.messages, 200], (old: AgentMessage[] | undefined) => {
            const next = [...(old ?? []), message];
            const uniq = new Map<string, AgentMessage>();
            next.forEach((m) => uniq.set(m.id, m));
            return [...uniq.values()].slice(-200);
          });
          return;
        }

        const parsed = normalizeEvent(raw);
        if (!parsed?.executionId || !parsed.workflowId) return;

        const executionKey = workflowKeys.execution(String(parsed.workflowId), String(parsed.executionId));
        const eventsKey = workflowKeys.executionEvents(String(parsed.workflowId), String(parsed.executionId));

        qc.setQueryData(executionKey, (old: WorkflowExecution | undefined) => mergeExecution(old, parsed));
        qc.setQueryData(eventsKey, (old: WorkflowExecutionEvent[] | undefined) => appendEvent(old, parsed));
      };

      es.onerror = () => {
        es?.close();
        retries += 1;
        const delay = Math.min(30000, 1000 * 2 ** retries);
        reconnectTimer = window.setTimeout(connect, delay);
      };

      es.onopen = () => {
        retries = 0;
      };
    };

    connect();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [qc, url]);
}

export function useWorkflowExecutionSSE(workflowId?: string, executionId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!workflowId || !executionId) return;

    let es: EventSource | null = null;
    let retries = 0;
    let reconnectTimer: number | undefined;

    const executionKey = workflowKeys.execution(workflowId, executionId);
    const eventsKey = workflowKeys.executionEvents(workflowId, executionId);

    const connect = () => {
      es = new EventSource(`/api/workflows/${workflowId}/executions/${executionId}/events`);

      es.onmessage = (evt) => {
        const parsed = normalizeEvent(JSON.parse(evt.data));
        if (!parsed) return;
        const normalized = { ...parsed, workflowId, executionId };
        qc.setQueryData(executionKey, (old: WorkflowExecution | undefined) => mergeExecution(old, normalized));
        qc.setQueryData(eventsKey, (old: WorkflowExecutionEvent[] | undefined) => appendEvent(old, normalized));
      };

      es.onerror = () => {
        es?.close();
        retries += 1;
        const delay = Math.min(15000, 1000 * 2 ** retries);
        reconnectTimer = window.setTimeout(connect, delay);
      };

      es.onopen = () => {
        retries = 0;
      };
    };

    connect();

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [executionId, qc, workflowId]);
}
