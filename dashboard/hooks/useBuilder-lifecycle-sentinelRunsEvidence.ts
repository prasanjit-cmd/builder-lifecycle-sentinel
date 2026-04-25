import { useApi } from './useApi';

export function useBuilder-lifecycle-sentinelRunsEvidence() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id/evidence');
}
