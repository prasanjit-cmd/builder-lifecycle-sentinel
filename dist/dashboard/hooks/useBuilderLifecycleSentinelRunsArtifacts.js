import { useApi } from './useApi';
export function useBuilderLifecycleSentinelRunsArtifacts() {
    return useApi('/api/builder-lifecycle-sentinel/runs/:id/artifacts');
}
