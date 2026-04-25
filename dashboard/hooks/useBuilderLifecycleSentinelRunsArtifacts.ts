import { useApi } from './useApi';

export function useBuilderLifecycleSentinelRunsArtifacts() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id/artifacts');
}
