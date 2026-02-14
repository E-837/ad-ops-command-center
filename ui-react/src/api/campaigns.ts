import { apiGet, apiPatch, apiPost } from './client';
import type {
  Campaign,
  CampaignBulkActionRequest,
  CampaignBulkActionResult,
  CampaignFilters,
  CampaignListResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '../types/campaign';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (filters?: CampaignFilters) => ['campaigns', 'list', filters ?? {}] as const,
  detail: (id: string) => ['campaigns', id] as const,
};

function normalizeCampaignsResponse(payload: CampaignListResponse): Campaign[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.campaigns)) return payload.campaigns;
  return [];
}

export async function getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  const params = new URLSearchParams();
  if (filters?.dsp) params.set('dsp', filters.dsp);
  if (filters?.status) params.set('status', filters.status);
  const query = params.toString();
  const response = await apiGet<CampaignListResponse>(`/campaigns${query ? `?${query}` : ''}`);
  return normalizeCampaignsResponse(response);
}

export async function getCampaign(id: string): Promise<Campaign> {
  const response = await apiGet<{ success?: boolean; data?: Campaign } | Campaign>(`/campaigns/${id}`);
  return 'data' in (response as { data?: Campaign }) ? (response as { data?: Campaign }).data ?? (response as Campaign) : (response as Campaign);
}

export async function createCampaign(payload: CreateCampaignRequest): Promise<Campaign> {
  const response = await apiPost<{ success?: boolean; data?: Campaign } | Campaign>('/campaigns', payload);
  return 'data' in (response as { data?: Campaign }) ? (response as { data?: Campaign }).data ?? (response as Campaign) : (response as Campaign);
}

export async function updateCampaign(id: string, payload: UpdateCampaignRequest): Promise<Campaign> {
  const response = await apiPatch<{ success?: boolean; data?: Campaign } | Campaign>(`/campaigns/${id}`, payload);
  return 'data' in (response as { data?: Campaign }) ? (response as { data?: Campaign }).data ?? (response as Campaign) : (response as Campaign);
}

export async function bulkCampaignAction({ ids, action }: CampaignBulkActionRequest): Promise<CampaignBulkActionResult> {
  const status = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'archived';
  const updated = await Promise.all(ids.map((id) => updateCampaign(id, { status })));
  return { updated, action };
}
