import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { PanelAdministracionApiService } from './panel-administracion-api.service';

describe('PanelAdministracionApiService', () => {
  let service: PanelAdministracionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PanelAdministracionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta usuarios con búsqueda, orden y tamaño soportados por el backend', () => {
    service
      .obtenerUsuarios({
        page: 2,
        size: 20,
        estado: 'TODOS',
        searchField: 'telefono',
        search: '  999  ',
        sort: 'nombre,asc',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (peticion) => peticion.url === ENDPOINTS_API.administracion.usuarios,
    );
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('estado')).toBe('TODOS');
    expect(request.request.params.get('searchField')).toBe('telefono');
    expect(request.request.params.get('search')).toBe('999');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    request.flush({
      status: 'success',
      data: {
        contenido: [],
        paginaActual: 2,
        tamanioPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      },
      message: null,
    });
  });

  it('desactiva un usuario y transforma la respuesta del backend', () => {
    let estado = true;

    service.desactivarUsuario(15).subscribe((usuario) => {
      estado = usuario.estado;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.desactivarUsuario(15));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush(crearRespuestaUsuario(false));

    expect(estado).toBe(false);
  });

  it('reactiva un usuario usando el endpoint administrativo', () => {
    let estado = false;

    service.reactivarUsuario(15).subscribe((usuario) => {
      estado = usuario.estado;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.reactivarUsuario(15));
    expect(request.request.method).toBe('PATCH');
    request.flush(crearRespuestaUsuario(true));

    expect(estado).toBe(true);
  });

  it('obtiene el detalle de un usuario mediante el contrato administrativo real', () => {
    let correo = '';

    service.obtenerUsuarioPorId(15).subscribe((usuario) => {
      correo = usuario.correo;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.usuarioPorId(15));
    expect(request.request.method).toBe('GET');
    request.flush(crearRespuestaUsuario(true));

    expect(correo).toBe('maria@regalia.pe');
  });

  it('obtiene el detalle de un vendedor conservando sus referencias administrativas', () => {
    let idUsuario = 0;

    service.obtenerVendedorPorId(7).subscribe((vendedor) => {
      idUsuario = vendedor.idUsuario;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.vendedorPorId(7));
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: {
        idVendedor: 7,
        idUsuario: 15,
        nombreUsuario: 'María',
        apellidoUsuario: 'Cliente',
        correoUsuario: 'maria@regalia.pe',
        vendedorVerificado: true,
        cantidadTiendasActivas: 2,
        cantidadTiendasTotales: 3,
        estado: true,
        fechaCreacion: '2026-07-01T10:00:00',
        fechaActualizacion: '2026-07-20T11:00:00',
      },
      message: null,
    });

    expect(idUsuario).toBe(15);
  });

  it('consulta vendedores con filtros y paginación soportados por el backend', () => {
    service
      .obtenerVendedores({
        page: 1,
        size: 20,
        estado: 'ACTIVO',
        verificacion: 'SIN_VERIFICAR',
        searchField: 'correo',
        search: '  tienda@regalia.pe  ',
        sort: 'correo,asc',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (peticion) => peticion.url === ENDPOINTS_API.administracion.vendedores,
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('estado')).toBe('ACTIVO');
    expect(request.request.params.get('verificacion')).toBe('SIN_VERIFICAR');
    expect(request.request.params.get('searchField')).toBe('correo');
    expect(request.request.params.get('search')).toBe('tienda@regalia.pe');
    expect(request.request.params.get('sort')).toBe('correo,asc');
    request.flush({
      status: 'success',
      data: {
        contenido: [],
        paginaActual: 1,
        tamanioPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      },
      message: null,
    });
  });

  it('obtiene el detalle comercial y fiscal de una tienda', () => {
    let numeroDocumentoFiscal: string | null = null;

    service.obtenerTiendaPorId(9).subscribe((tienda) => {
      numeroDocumentoFiscal = tienda.numeroDocumentoFiscal;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.tiendaPorId(9));
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: {
        idTienda: 9,
        idVendedor: 7,
        idUsuario: 15,
        nombreVendedor: 'María',
        apellidoVendedor: 'Cliente',
        correoVendedor: 'maria@regalia.pe',
        nombre: 'Detalles REGALIA',
        descripcion: 'Regalos personalizados',
        direccionReferencia: 'Centro de Trujillo',
        estadoRevision: 'APROBADA',
        tiendaFormalizada: true,
        idDocumentoFiscal: 22,
        numeroDocumentoFiscal: '20123456789',
        rubros: [{ idRubro: 3, nombre: 'Detalles personalizados' }],
        estado: true,
        fechaCreacion: '2026-07-01T10:00:00',
        fechaActualizacion: '2026-07-20T11:00:00',
      },
      message: null,
    });

    expect(numeroDocumentoFiscal).toBe('20123456789');
  });

  it('consulta tiendas con filtros, búsqueda y orden soportados por el backend', () => {
    service
      .obtenerTiendas({
        page: 1,
        size: 20,
        estadoRevision: 'OBSERVADA',
        searchField: 'correo_vendedor',
        search: '  tienda@regalia.pe  ',
        sort: 'nombreVendedor,asc',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (peticion) => peticion.url === ENDPOINTS_API.administracion.tiendas,
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('estadoRevision')).toBe('OBSERVADA');
    expect(request.request.params.get('searchField')).toBe('correo_vendedor');
    expect(request.request.params.get('search')).toBe('tienda@regalia.pe');
    expect(request.request.params.get('sort')).toBe('nombreVendedor,asc');
    request.flush({
      status: 'success',
      data: {
        contenido: [],
        paginaActual: 1,
        tamanioPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      },
      message: null,
    });
  });

  it('obtiene y transforma el catálogo público relacionado con una tienda', () => {
    let nombreProducto = '';

    service.obtenerCatalogoPublicoTienda(9).subscribe((productos) => {
      nombreProducto = productos[0]?.nombre ?? '';
    });

    const request = httpMock.expectOne(ENDPOINTS_API.tiendas.productos(9));
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: [
        {
          idProducto: 12,
          idTienda: 9,
          nombreTienda: 'Detalles REGALIA',
          idTipoProducto: 3,
          tipoProducto: 'Regalo personalizado',
          nombre: 'Caja personalizada',
          descripcion: 'Caja para una ocasión especial',
          precio: 60,
          stock: 8,
          imagenes: [],
        },
      ],
      message: null,
    });

    expect(nombreProducto).toBe('Caja personalizada');
  });

  it('rechaza una tienda mediante la acción administrativa existente', () => {
    service.rechazarTienda(9).subscribe();

    const request = httpMock.expectOne(`${ENDPOINTS_API.administracion.tiendas}/9/rechazar`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush({
      status: 'success',
      data: {
        idTienda: 9,
        idVendedor: 7,
        idUsuario: 15,
        nombreVendedor: 'María',
        apellidoVendedor: 'Cliente',
        correoVendedor: 'maria@regalia.pe',
        nombre: 'Detalles REGALIA',
        descripcion: 'Regalos personalizados',
        direccionReferencia: 'Centro de Trujillo',
        estadoRevision: 'RECHAZADA',
        tiendaFormalizada: true,
        idDocumentoFiscal: 22,
        numeroDocumentoFiscal: '20123456789',
        rubros: [],
        estado: true,
        fechaCreacion: '2026-07-01T10:00:00',
        fechaActualizacion: '2026-07-20T11:00:00',
      },
      message: null,
    });
  });

  it('obtiene el detalle de un pedido y transforma sus productos', () => {
    let cantidadItems = 0;

    service.obtenerPedidoPorId(21).subscribe((pedido) => {
      cantidadItems = pedido.cantidadItems;
    });

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.pedidoPorId(21));
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'success',
      data: {
        idPedido: 21,
        idUsuario: 15,
        idTienda: 9,
        nombreTienda: 'Detalles REGALIA',
        idTipoEntrega: 2,
        tipoEntrega: 'Recojo en tienda',
        fechaEntrega: '2026-07-25',
        observacion: 'Preparar por la tarde',
        estadoPedido: 'CONFIRMADO',
        subtotal: 120,
        total: 120,
        montoPagado: 60,
        saldoPendiente: 60,
        estado: true,
        fechaCreacion: '2026-07-20T10:00:00',
        fechaActualizacion: null,
        detalles: [
          {
            idDetallePedido: 30,
            idProducto: 12,
            nombreProducto: 'Caja personalizada',
            cantidad: 2,
            precioUnitario: 60,
            subtotal: 120,
          },
        ],
      },
      message: null,
    });

    expect(cantidadItems).toBe(2);
  });

  it('consulta pedidos combinando filtros administrativos y rango de fechas', () => {
    service
      .obtenerPedidos({
        page: 2,
        size: 20,
        estadoPago: 'CON_SALDO',
        estadoPedido: 'EN_PREPARACION',
        idTienda: 9,
        searchField: 'id_usuario',
        search: '  15  ',
        fechaDesde: '2026-07-01',
        fechaHasta: '2026-07-20',
        sort: 'saldoPendiente,desc',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (peticion) => peticion.url === ENDPOINTS_API.administracion.pedidos,
    );
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('estadoPago')).toBe('CON_SALDO');
    expect(request.request.params.get('estadoPedido')).toBe('EN_PREPARACION');
    expect(request.request.params.get('idTienda')).toBe('9');
    expect(request.request.params.get('searchField')).toBe('id_usuario');
    expect(request.request.params.get('search')).toBe('15');
    expect(request.request.params.get('fechaDesde')).toBe('2026-07-01');
    expect(request.request.params.get('fechaHasta')).toBe('2026-07-20');
    expect(request.request.params.get('sort')).toBe('saldoPendiente,desc');
    request.flush({
      status: 'success',
      data: {
        contenido: [],
        paginaActual: 2,
        tamanioPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultimaPagina: true,
      },
      message: null,
    });
  });
});

function crearRespuestaUsuario(estado: boolean) {
  return {
    status: 'success',
    data: {
      idUsuario: 15,
      nombres: 'María',
      apellidos: 'Cliente',
      correo: 'maria@regalia.pe',
      telefono: '999888777',
      correoVerificado: true,
      estado,
      fechaCreacion: '2026-07-20T10:00:00',
      fechaActualizacion: '2026-07-20T11:00:00',
    },
    message: null,
  } as const;
}
