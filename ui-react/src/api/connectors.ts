import { apiGet, apiPost } from './client';
import type { Connector, ConnectorStatus, ConnectorTestResult } from '../types/connector';

type RefreshResponse = {
  success: boolean;
  connectors?: ConnectorStatus[];
  message?: string;
};

export const connectorKeys = {
  all: ['connectors'] as const,
  status: ['connectors', 'status'] as const,
};

function normalizeStatusLabel(label: string | undefined, connected: boolean, connectionType?: string) {
  if (label === 'Connected via MCP' || connectionType === 'mcp') return 'Connected via MCP';
  if (label === 'Connected') return 'Connected';
  if (label === 'Not configured') return 'Not configured';
  return connected ? 'Connected' : 'Mock data';
}

function normalizeConnector(raw: any): Connector {
  const connected = Boolean(raw.connected);
  const connectionType = raw.connectionType as 'mcp' | 'live' | 'mock' | undefined;
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.id),
    category: raw.category === 'dsp' ? 'dsp' : 'productivity',
    status: raw.status,
    connected,
    connectionType,
    statusLabel: normalizeStatusLabel(raw.statusLabel, connected, connectionType),
    lastSync: raw.lastSync ?? null,
    version: raw.version,
    features: Array.isArray(raw.features) ? raw.features : [],
    tools: Array.isArray(raw.tools) ? raw.tools : [],
    toolCount: typeof raw.toolCount === 'number' ? raw.toolCount : undefined,
  };
}

export async function getConnectors(): Promise<Connector[]> {
  const response = await apiGet<any[]>('/connectors');
  return (Array.isArray(response) ? response : []).map(normalizeConnector);
}

export async function getConnectorStatus(): Promise<ConnectorStatus[]> {
  const response = await apiGet<any[]>('/connectors/status');
  return (Array.isArray(response) ? response : []).map((raw) => {
    const connected = Boolean(raw.connected);
    const connectionType = raw.connectionType as 'mcp' | 'live' | 'mock' | undefined;
    return {
      id: String(raw.id),
      name: String(raw.name ?? raw.id),
      category: raw.category === 'dsp' ? 'dsp' : 'productivity',
      connected,
      connectionType,
      statusLabel: normalizeStatusLabel(raw.statusLabel, connected, connectionType),
      lastSync: raw.lastSync ?? null,
    };
  });
}

export async function refreshMcpStatus(): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>('/connectors/refresh-mcp', {});
}

export async function testConnector(id: string): Promise<ConnectorTestResult> {
  return apiGet<ConnectorTestResult>(`/connectors/test/${id}`);
}

export async function connectConnector(id: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/connectors/${id}/connect`, {});
}

export async function disconnectConnector(id: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/connectors/${id}/disconnect`, {});
}
