import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ImagenProductoVendedor } from '../modelos/vendedor.model';
import { VendedorApiService } from './vendedor-api.service';

/**
 * Orquesta una carga directa al almacenamiento sin exponer sus detalles a las pantallas.
 */
@Injectable({ providedIn: 'root' })
export class CargaImagenProductoService {
  private readonly api = inject(VendedorApiService);
  private readonly http = inject(HttpClient);

  cargarArchivo(
    idTienda: number,
    idProducto: number,
    archivo: File,
  ): Observable<ImagenProductoVendedor> {
    return this.api.solicitarCargaImagenProducto(idTienda, idProducto, archivo).pipe(
      switchMap((ticket) =>
        this.http
          .put(ticket.urlCarga, archivo, {
            headers: new HttpHeaders(ticket.cabecerasRequeridas),
            responseType: 'text',
          })
          .pipe(
            switchMap(() =>
              this.api.confirmarCargaImagenProducto(idTienda, idProducto, ticket.claveTemporal),
            ),
          ),
      ),
    );
  }
}
