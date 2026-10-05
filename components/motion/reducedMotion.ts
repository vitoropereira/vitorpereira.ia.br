// Guarda de SSR: no servidor não há preferência, e o HTML do servidor já sai
// com o estado final visível.
export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
