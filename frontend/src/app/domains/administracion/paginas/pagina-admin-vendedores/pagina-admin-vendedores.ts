import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { AdministracionPanelStore } from '../../estado/administracion-panel.store';

@Component({
  selector: 'app-pagina-admin-vendedores',
  imports: [NgbTooltip, EstadoPantallaComponent, FilaPanelComponent, ListaPanelComponent, TarjetaMetricaComponent],
  templateUrl: './pagina-admin-vendedores.html',
  styleUrl: './pagina-admin-vendedores.css',
})
export class PaginaAdminVendedores implements OnInit {
  readonly store = inject(AdministracionPanelStore);
  readonly busqueda = signal('');

  readonly vendedoresFiltrados = computed(() => {
    const busqueda = this.busqueda().trim().toLowerCase();
    if (!busqueda) return this.store.vendedores();

    return this.store
      .vendedores()
      .filter(
        (vendedor) =>
          vendedor.nombreCompleto.toLowerCase().includes(busqueda) ||
          vendedor.correo.toLowerCase().includes(busqueda),
      );
  });

  readonly verificados = computed(() =>
    this.store.vendedores().filter((vendedor) => vendedor.verificado).length,
  );
  readonly tiendasActivas = computed(() =>
    this.store.vendedores().reduce((total, vendedor) => total + vendedor.tiendasActivas, 0),
  );

  ngOnInit(): void {
    this.store.cargarVendedores();
  }

  buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}
