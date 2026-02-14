import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectConnector,
  connectorKeys,
  disconnectConnector,
  getConnectors,
  getConnectorStatus,
  refreshMcpStatus,
  testConnector,
} from '../api/connectors';

export function useConnectors() {
  return useQuery({
    queryKey: connectorKeys.all,
    queryFn: getConnectors,
    refetchInterval: 20_000,
  });
}

export function useConnectorStatus() {
  return useQuery({
    queryKey: connectorKeys.status,
    queryFn: getConnectorStatus,
    refetchInterval: 20_000,
  });
}

export function useRefreshMcp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refreshMcpStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: connectorKeys.all });
      qc.invalidateQueries({ queryKey: connectorKeys.status });
    },
  });
}

export function useTestConnector() {
  return useMutation({
    mutationFn: (id: string) => testConnector(id),
  });
}

export function useConnectConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectConnector(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: connectorKeys.all });
      qc.invalidateQueries({ queryKey: connectorKeys.status });
    },
  });
}

export function useDisconnectConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disconnectConnector(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: connectorKeys.all });
      qc.invalidateQueries({ queryKey: connectorKeys.status });
    },
  });
}
