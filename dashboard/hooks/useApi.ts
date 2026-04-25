import { useEffect, useState } from 'react';
import type { AsyncState } from '../components/types';

export function useApi<T>(url: string, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState(s => ({ ...s, loading: true, error: null }));
    fetch(url, { signal: controller.signal })
      .then(r => r.json().then(j => ({ ok: r.ok, json: j })))
      .then(({ ok, json }) => {
        if (!active) return;
        if (!ok) throw new Error((json as {error?:{message?:string}})?.error?.message || 'Request failed');
        setState({ data: json as T, loading: false, error: null });
      })
      .catch(e => { if (active && !controller.signal.aborted) setState({ data: null, loading: false, error: e instanceof Error ? e.message : 'Unknown error' }); });
    return () => { active = false; controller.abort(); };
  }, deps);
  return state;
}
