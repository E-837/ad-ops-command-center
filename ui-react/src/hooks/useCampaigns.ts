import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkCampaignAction,
  campaignKeys,
  createCampaign,
  getCampaigns,
  updateCampaign,
} from '../api/campaigns';
import type {
  Campaign,
  CampaignBulkActionRequest,
  CampaignBulkActionResult,
  CampaignFilters,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '../types/campaign';

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => getCampaigns(filters),
    refetchInterval: 15_000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation<Campaign, Error, CreateCampaignRequest>({
    mutationFn: createCampaign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation<Campaign, Error, { id: string; payload: UpdateCampaignRequest }>({
    mutationFn: ({ id, payload }) => updateCampaign(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}

export function useBulkCampaignAction() {
  const qc = useQueryClient();
  return useMutation<CampaignBulkActionResult, Error, CampaignBulkActionRequest>({
    mutationFn: bulkCampaignAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}
