import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BotonDirective } from '../../../../shared/directivas/boton.directive';
import { EstadoPantallaComponent } from '../../../../shared/ui/estado-pantalla/estado-pantalla';
import { TarjetaMetricaComponent } from '../../../../shared/ui/tarjeta-metrica/tarjeta-metrica';
import { AdministracionPanelStore } from '../../estado/administracion-panel.store';
import { TiendaAdministracion } from '../../modelos/panel-administracion.model';

interface ActividadAdministrativa {
  id: string;
  tipo: 'Usuario' | 'Vendedor' | 'Tienda' | 'Pedido';
  titulo: string;
  descripcion: string;
  fecha: string;
  ruta: string;
}

interface AccesoRapidoAdministrativo {
  etiqueta: string;
  ruta: string;
}

@Component({
  selector: 'app-pagina-admin-resumen',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NgbProgressbar,
    NgbTooltip,
    BotonDirective,
    EstadoPantallaComponent,
    TarjetaMetricaComponent,
  ],
  templateUrl: './pagina-admin-resumen.html',
  styleUrl: './pagina-admin-resumen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAdminResumen implements OnInit {
  readonly store = inject(AdministracionPanelStore);
  readonly accesosRapidos: readonly AccesoRapidoAdministrativo[] = [
    { etiqueta: 'Gestionar usuarios', ruta: '/admin/usuarios' },
    { etiqueta: 'Revisar vendedores', ruta: '/admin/vendedores' },
    { etiqueta: 'Moderar tiendas', ruta: '/admin/tiendas' },
    { etiqueta: 'Supervisar pedidos', ruta: '/admin/pedidos' },
    { etiqueta: 'Datos maestros', ruta: '/admin/datos-maestros' },
  ];

  readonly totalAlertas = computed(
    () => this.store.tiendasPendientes() + this.store.pedidosConSaldo(),
  );

  readonly pedidosPrioritarios = computed(() =>
    [...this.store.pedidos()]
      .filter((pedido) => pedido.saldoPendiente > 0)
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente),
  );

  readonly actividadReciente = computed(() => {
    const actividades = [
      ...this.store
        .usuarios()
        .map((usuario) =>
          this.crearActividad(
            `usuario-${usuario.idUsuario}`,
            'Usuario',
            usuario.nombreCompleto || usuario.correo,
            usuario.estado ? 'Cuenta activa registrada' : 'Cuenta actualmente inactiva',
            usuario.fechaCreacion,
            '/admin/usuarios',
          ),
        ),
      ...this.store
        .vendedores()
        .map((vendedor) =>
          this.crearActividad(
            `vendedor-${vendedor.idVendedor}`,
            'Vendedor',
            vendedor.nombreCompleto || vendedor.correo,
            vendedor.verificado ? 'Perfil comercial verificado' : 'Perfil comercial por verificar',
            vendedor.fechaActualizacion ?? vendedor.fechaCreacion,
            `/admin/vendedores/${vendedor.idVendedor}`,
          ),
        ),
      ...this.store
        .tiendas()
        .map((tienda) =>
          this.crearActividad(
            `tienda-${tienda.idTienda}`,
            'Tienda',
            tienda.nombre,
            `Revisión ${tienda.estadoRevision.toLocaleLowerCase('es-PE')}`,
            tienda.fechaActualizacion ?? tienda.fechaCreacion,
            `/admin/tiendas/${tienda.idTienda}`,
          ),
        ),
      ...this.store
        .pedidos()
        .map((pedido) =>
          this.crearActividad(
            `pedido-${pedido.idPedido}`,
            'Pedido',
            `Pedido #${pedido.idPedido} · ${pedido.nombreTienda}`,
            `${pedido.estadoPedido} · ${pedido.cantidadItems} producto(s)`,
            pedido.fechaActualizacion ?? pedido.fechaCreacion,
            `/admin/pedidos/${pedido.idPedido}`,
          ),
        ),
    ];

    return actividades
      .filter((actividad): actividad is ActividadAdministrativa => actividad !== null)
      .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
      .slice(0, 6);
  });

  readonly porcentajeTiendasPendientes = computed(() => {
    const total = this.store.totalTiendas();
    if (total <= 0) return 0;

    return Math.round((this.store.tiendasPendientes() / total) * 100);
  });

  readonly porcentajePedidosConSaldo = computed(() => {
    const total = this.store.totalPedidos();
    if (total <= 0) return 0;
    return Math.round((this.store.pedidosConSaldo() / total) * 100);
  });

  ngOnInit(): void {
    this.store.cargarResumen();
  }

  aprobar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'aprobar');
  }

  observar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'observar');
  }

  rechazar(tienda: TiendaAdministracion): void {
    this.store.cambiarEstadoTienda(tienda, 'rechazar');
  }

  private crearActividad(
    id: string,
    tipo: ActividadAdministrativa['tipo'],
    titulo: string,
    descripcion: string,
    fecha: string | null,
    ruta: string,
  ): ActividadAdministrativa | null {
    if (!fecha || !Number.isFinite(Date.parse(fecha))) return null;

    return { id, tipo, titulo, descripcion, fecha, ruta };
  }
}
