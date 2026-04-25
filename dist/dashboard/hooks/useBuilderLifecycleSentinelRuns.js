import { useApi } from './useApi';
export function useBuilderLifecycleSentinelRuns() {
    return useApi('/api/builder-lifecycle-sentinel/runs/:id');
}
