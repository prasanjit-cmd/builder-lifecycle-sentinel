import { useApi } from './useApi';

export function useBuilder-lifecycle-sentinelRunsChecks() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id/checks');
}
