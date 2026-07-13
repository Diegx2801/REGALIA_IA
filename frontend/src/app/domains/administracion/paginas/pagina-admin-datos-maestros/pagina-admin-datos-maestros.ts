import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { FilaPanelComponent } from '../../../../shared/ui/fila-panel/fila-panel';
import { ListaPanelComponent } from '../../../../shared/ui/lista-panel/lista-panel';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { AdministracionPanelStore } from '../../estado/administracion-panel.store';

@Component({
  selector: 'app-pagina-admin-datos-maestros',
  imports: [NgbTooltip, EstadoPantallaComponent, FilaPanelComponent, ListaPanelComponent, TarjetaMetricaComponent],
  templateUrl: './pagina-admin-datos-maestros.html',
  styleUrl: './pagina-admin-datos-maestros.css',
})
export class PaginaAdminDatosMaestros implements OnInit {
  readonly store = inject(AdministracionPanelStore);
  readonly categoriaSeleccionada = signal('');

  readonly datosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    return categoria
      ? this.store.datosMaestros().filter((dato) => dato.categoria === categoria)
      : this.store.datosMaestros();
  });

  ngOnInit(): void {
    this.store.cargarDatosMaestros();
  }

  filtrarCategoria(evento: Event): void {
    this.categoriaSeleccionada.set((evento.target as HTMLSelectElement).value);
  }
}
