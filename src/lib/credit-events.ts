/**
 * Emite un evento global para que CreditosContext y UserContext
 * actualicen el balance visible en la UI (header, sidebar, perfil).
 *
 * Uso: llamar después de cada POST exitoso a un endpoint que deduzca créditos.
 * Si la respuesta del endpoint incluye `credits.newBalance`, pasarlo como
 * argumento para que la UI se actualice de forma optimista sin esperar
 * al fetch de /api/credits.
 */
export function emitCreditsChanged(newBalance?: number): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('creditsChanged', {
      detail: typeof newBalance === 'number' ? { newBalance } : {},
    })
  );
}
