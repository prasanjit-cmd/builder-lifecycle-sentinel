import { useApi } from './useApi';

export function useBuilderLifecycleSentinelRunsChecks() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id/checks');
}
