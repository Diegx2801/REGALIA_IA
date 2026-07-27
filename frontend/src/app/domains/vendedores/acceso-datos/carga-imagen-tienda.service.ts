import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concatMap, Observable } from 'rxjs';
import { ImagenTiendaVendedor, TipoImagenTienda } from '../modelos/vendedor.model';
import { VendedorApiService } from './vendedor-api.service';

/** Ejecuta la carga directa de identidad visual sin exponer credenciales de R2 al navegador. */
@Injectable({ providedIn: 'root' })
export class CargaImagenTiendaService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(VendedorApiService);

  cargarArchivo(
    idTienda: number,
    tipoImagen: TipoImagenTienda,
    archivo: File,
  ): Observable<ImagenTiendaVendedor> {
    return this.api.solicitarCargaImagenTienda(idTienda, tipoImagen, archivo).pipe(
      concatMap((ticket) =>
        this.http
          .put(ticket.urlCarga, archivo, {
            headers: new HttpHeaders(ticket.cabecerasRequeridas),
            responseType: 'text',
          })
          .pipe(
            concatMap(() =>
              this.api.confirmarCargaImagenTienda(idTienda, tipoImagen, ticket.claveTemporal),
            ),
          ),
      ),
    );
  }
}
