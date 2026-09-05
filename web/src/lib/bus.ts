/*
 * Minimal invalidation bus. SSE events (see AuthContext useEvents) publish a
 * resource name; hooks subscribed via useApi({watch}) refetch when a resource
 * they care about is invalidated. Events are notifications, not a source of
 * truth — refetching state is always the recovery path.
 */

type Listener = (resource: string) => void;

const listeners = new Set<Listener>();

export function invalidate(resource: string): void {
  for (const listener of listeners) listener(resource);
}

export function onInvalidate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
