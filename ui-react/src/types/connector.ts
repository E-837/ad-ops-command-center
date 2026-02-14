export type ConnectorCategory = 'dsp' | 'productivity';
export type ConnectorStatusLabel = 'Connected via MCP' | 'Connected' | 'Mock data' | 'Not configured';

export type Connector = {
  id: string;
  name: string;
  category: ConnectorCategory;
  status?: string;
  connected: boolean;
  connectionType?: 'mcp' | 'live' | 'mock';
  statusLabel: ConnectorStatusLabel;
  lastSync?: string | null;
  version?: string;
  features?: string[];
  tools?: Array<{ name: string; description?: string }>;
  toolCount?: number;
};

export type ConnectorStatus = {
  id: string;
  name: string;
  category: ConnectorCategory;
  connected: boolean;
  connectionType?: 'mcp' | 'live' | 'mock';
  statusLabel: ConnectorStatusLabel;
  lastSync?: string | null;
};

export type ConnectorTestResult = {
  connected?: boolean;
  success?: boolean;
  error?: string;
  statusLabel?: string;
};

export type ConnectorAction = 'connect' | 'disconnect' | 'test';
