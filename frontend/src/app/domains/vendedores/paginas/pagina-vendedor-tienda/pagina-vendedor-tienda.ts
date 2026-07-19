import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { TiendaVendedor } from '../../modelos/vendedor.model';

/** Centro privado de una tienda. El id de tienda en la ruta evita depender de estado efimero. */
@Component({
  selector: 'app-pagina-vendedor-tienda',
  imports: [CurrencyPipe, RouterLink, BotonDirective, EstadoPantallaComponent],
  templateUrl: './pagina-vendedor-tienda.html',
  styleUrl: './pagina-vendedor-tienda.css',
})
export class PaginaVendedorTienda implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vendedorApi = inject(VendedorApiService);

  readonly store = inject(VendedorPanelStore);
  readonly idTienda = signal<number | null>(null);
  readonly tienda = signal<TiendaVendedor | null>(null);
  readonly cargandoTienda = signal(true);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idTienda = Number(params.get('idTienda'));
      if (!Number.isInteger(idTienda) || idTienda <= 0) {
        void this.router.navigate(['/vendedor/tiendas']);
        return;
      }

      this.idTienda.set(idTienda);
      this.cargarTienda(idTienda);
    });
  }

  estadoComercial(estado: string): string {
    return ({
      PENDIENTE: 'En revisión',
      APROBADA: 'Activa en REGALIA',
      OBSERVADA: 'Requiere atención',
      RECHAZADA: 'No aprobada',
    } as Record<string, string>)[estado] ?? 'En revisión';
  }

  private cargarTienda(idTienda: number): void {
    this.cargandoTienda.set(true);
    this.store.limpiarMensajes();
    this.store.cargarPanel(false, false, idTienda);

    this.vendedorApi
      .obtenerTiendaPorId(idTienda)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tienda) => {
          this.tienda.set(tienda);
          this.store.tiendas.update((tiendas) => {
            const sinTiendaActual = tiendas.filter((actual) => actual.idTienda !== tienda.idTienda);
            return [...sinTiendaActual, tienda];
          });
          this.store.idTiendaSeleccionada.set(idTienda);
          this.cargandoTienda.set(false);
        },
        error: () => {
          this.store.mensajeError.set('No pudimos cargar esta tienda.');
          this.cargandoTienda.set(false);
        },
      });
  }
}
