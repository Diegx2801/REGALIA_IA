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
