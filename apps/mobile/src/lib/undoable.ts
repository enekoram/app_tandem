import { durations } from '@/theme';

/**
 * Acción con «Deshacer» (decisión 7: 8 s). La interfaz ya refleja el cambio; la acción real
 * (`commit`) se ejecuta al acabar la ventana si nadie pulsa «Deshacer». El temporizador vive
 * fuera de los componentes para que sobreviva a la navegación.
 */
export function runUndoable({
  commit,
  onUndo,
  delayMs = durations.undo,
}: {
  commit: () => Promise<unknown>;
  onUndo: () => void;
  delayMs?: number;
}): () => void {
  let done = false;
  const timer = setTimeout(() => {
    done = true;
    void commit();
  }, delayMs);
  return () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    onUndo();
  };
}
