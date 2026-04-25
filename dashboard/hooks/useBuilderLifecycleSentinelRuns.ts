import { useApi } from './useApi';

export function useBuilderLifecycleSentinelRuns() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id');
}
