export type DSP = 'ttd' | 'dv360' | 'amazon' | 'google_ads' | 'meta';

export type CampaignStatus = 'draft' | 'active' | 'live' | 'paused' | 'completed' | 'archived' | 'error';

export type PacingStatus = 'ahead' | 'on_track' | 'behind' | 'critical_ahead' | 'critical_behind' | 'unknown';

export type CampaignMetrics = {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number;
  cpm?: number;
  roas?: number;
  spend?: number;
};

export type Campaign = {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  dsp?: DSP | string;
  status: CampaignStatus | string;
  budget?: number;
  dailyBudget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  pacingStatus?: PacingStatus;
  pacingPercent?: number;
  metrics?: CampaignMetrics;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignFilters = {
  dsp?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export type CampaignListResponse =
  | Campaign[]
  | {
      success?: boolean;
      data?: Campaign[];
      campaigns?: Campaign[];
    };

export type CreateCampaignRequest = {
  name: string;
  dsp: DSP | string;
  projectId?: string;
  status?: CampaignStatus | string;
  budget?: number;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
};

export type UpdateCampaignRequest = Partial<CreateCampaignRequest> & {
  status?: CampaignStatus | string;
};

export type CampaignBulkAction = 'pause' | 'resume' | 'archive';

export type CampaignBulkActionRequest = {
  ids: string[];
  action: CampaignBulkAction;
};

export type CampaignBulkActionResult = {
  updated: Campaign[];
  action: CampaignBulkAction;
};
