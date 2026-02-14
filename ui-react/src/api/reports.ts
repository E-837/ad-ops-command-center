import { apiGet, apiPost } from './client';
import type {
  CreateReportScheduleRequest,
  GenerateReportRequest,
  GeneratedReport,
  ReportDashboardResponse,
  ReportFilters,
  ReportSchedule,
  ReportTemplate,
} from '../types/report';

export const reportKeys = {
  all: ['reports'] as const,
  templates: ['reports', 'templates'] as const,
  schedules: ['reports', 'schedules'] as const,
  history: (filters?: ReportFilters) => ['reports', 'history', filters ?? {}] as const,
};

function withQuery(path: string, filters?: ReportFilters) {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function getReports(filters?: ReportFilters): Promise<ReportDashboardResponse> {
  return apiGet<ReportDashboardResponse>(withQuery('/reports', filters));
}

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  return apiGet<ReportTemplate[]>('/reports/templates');
}

export async function getScheduledReports(): Promise<ReportSchedule[]> {
  return apiGet<ReportSchedule[]>('/reports/schedules');
}

export async function getReportHistory(filters?: ReportFilters): Promise<GeneratedReport[]> {
  return apiGet<GeneratedReport[]>(withQuery('/reports/history', filters));
}

export async function generateReport(payload: GenerateReportRequest): Promise<GeneratedReport> {
  return apiPost<GeneratedReport>('/reports/generate', payload);
}

export async function createReportSchedule(payload: CreateReportScheduleRequest): Promise<ReportSchedule> {
  return apiPost<ReportSchedule>('/reports/schedules', payload);
}
