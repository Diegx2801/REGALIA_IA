/** Política compartida para imágenes comerciales de producto. */
export const MAXIMO_IMAGENES_PRODUCTO = 5;
export const TAMANIO_MAXIMO_IMAGEN_PRODUCTO_BYTES = 5 * 1024 * 1024;
export const TIPOS_IMAGEN_PRODUCTO_PERMITIDOS: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function esImagenProductoPermitida(archivo: File): boolean {
  return (
    TIPOS_IMAGEN_PRODUCTO_PERMITIDOS.has(archivo.type) &&
    archivo.size <= TAMANIO_MAXIMO_IMAGEN_PRODUCTO_BYTES
  );
}
