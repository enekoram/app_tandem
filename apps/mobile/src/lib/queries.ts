import type { QueryClient } from '@tanstack/react-query';

/** Invalida todo lo que depende de tareas (mis tareas, terminadas, acompaño, detalle). */
export function invalidateTasks(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/tasks'),
  });
}

/** Invalida contactos (lista y detalle). */
export function invalidateContacts(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('/contacts'),
  });
}

/** Invalida sesiones y la Home (que las incluye). */
export function invalidateSessions(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === 'string' &&
      (q.queryKey[0].startsWith('/sessions') || q.queryKey[0] === '/me/home'),
  });
}
