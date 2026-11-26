import type { ReactNode } from 'react';
import { useHomeControllerHome, type TaskDto } from '@tandems/api-client';
import { useMotionProfile } from '@/lib/motion';
import { useOnline } from '@/lib/online';
import { AskSupportButton } from './AskSupportButton';

/**
 * «Pedir apoyo» para cualquier tarea propia (Home y Mis tareas): solo con acompañante que ha
 * aceptado y con conexión. Las peticiones abiertas salen de /me/home.
 */
export function useAskSupport(): (task: TaskDto) => ReactNode {
  const home = useHomeControllerHome();
  const motion = useMotionProfile();
  const online = useOnline();
  const outgoing = home.data?.status === 200 ? (home.data.data.support?.outgoing ?? []) : [];
  const asked = new Set(outgoing.map((r) => r.taskId));
  return (task) =>
    online && task.companionStatus === 'accepted' ? (
      <AskSupportButton task={task} asked={asked.has(task.id)} motion={motion} />
    ) : undefined;
}
