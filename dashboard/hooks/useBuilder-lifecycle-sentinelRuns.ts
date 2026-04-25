import { useApi } from './useApi';

export function useBuilder-lifecycle-sentinelRuns() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id');
}
