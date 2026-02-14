import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReportSchedule,
  generateReport,
  getReports,
  reportKeys,
} from '../api/reports';
import type { CreateReportScheduleRequest, GenerateReportRequest, ReportFilters } from '../types/report';

export function useReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.history(filters),
    queryFn: () => getReports(filters),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateReportRequest) => generateReport(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useCreateReportSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportScheduleRequest) => createReportSchedule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
