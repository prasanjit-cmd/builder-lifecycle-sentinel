import { useApi } from './useApi';
export function useBuilderLifecycleSentinelRunsEvidence() {
    return useApi('/api/builder-lifecycle-sentinel/runs/:id/evidence');
}
