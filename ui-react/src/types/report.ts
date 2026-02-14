export type ReportType = 'performance' | 'pacing' | 'attribution' | 'creative' | 'executive';

export type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  metrics: string[];
  dimensions: string[];
  defaultDateRangeDays: number;
};

export type ReportScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportSchedule = {
  id: string;
  templateId: string;
  templateName: string;
  frequency: ReportScheduleFrequency;
  nextRunAt: string;
  recipients: string[];
  active: boolean;
};

export type GeneratedReport = {
  id: string;
  name: string;
  type: ReportType;
  createdAt: string;
  status: 'processing' | 'ready' | 'failed';
  downloadUrl?: string;
};

export type ReportFilters = {
  type?: ReportType | 'all';
  startDate?: string;
  endDate?: string;
};

export type GenerateReportRequest = {
  templateId: string;
  name?: string;
  metrics: string[];
  dimensions: string[];
  startDate: string;
  endDate: string;
  filters?: Record<string, string>;
};

export type CreateReportScheduleRequest = {
  templateId: string;
  frequency: ReportScheduleFrequency;
  recipients: string[];
};

export type ReportDashboardResponse = {
  templates: ReportTemplate[];
  scheduled: ReportSchedule[];
  history: GeneratedReport[];
};
