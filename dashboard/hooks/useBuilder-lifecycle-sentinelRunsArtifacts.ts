import { useApi } from './useApi';

export function useBuilder-lifecycle-sentinelRunsArtifacts() {
  return useApi<Record<string, unknown>>('/api/builder-lifecycle-sentinel/runs/:id/artifacts');
}
