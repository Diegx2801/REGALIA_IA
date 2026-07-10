export function confirmarAccionCritica(mensaje: string): boolean {
  // Centraliza confirmaciones criticas hasta reemplazarlo por un modal visual compartido.
  return window.confirm(mensaje);
}
