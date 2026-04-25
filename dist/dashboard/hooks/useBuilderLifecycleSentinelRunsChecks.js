import { useApi } from './useApi';
export function useBuilderLifecycleSentinelRunsChecks() {
    return useApi('/api/builder-lifecycle-sentinel/runs/:id/checks');
}
