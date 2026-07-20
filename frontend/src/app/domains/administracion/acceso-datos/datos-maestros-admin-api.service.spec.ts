import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENDPOINTS_API } from '../../../core/configuracion/endpoints-api';
import { SolicitudGuardarDatoMaestro } from '../modelos/dato-maestro-admin.model';
import { DatosMaestrosAdminApiService } from './datos-maestros-admin-api.service';

describe('DatosMaestrosAdminApiService', () => {
  let service: DatosMaestrosAdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DatosMaestrosAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consolida y tipa los cinco catálogos administrativos', () => {
    let categorias: string[] = [];

    service.obtenerDatosMaestros().subscribe((datos) => {
      categorias = datos.map((dato) => dato.tipo);
    });

    httpMock.expectOne(ENDPOINTS_API.administracion.rubros).flush(
      respuesta([
        {
          idRubro: 1,
          nombre: 'Detalles',
          descripcion: 'Regalos personalizados',
          ...auditoria(true),
        },
      ]),
    );
    httpMock
      .expectOne(ENDPOINTS_API.administracion.tiposProducto)
      .flush(respuesta([{ idTipoProducto: 2, nombre: 'Caja', ...auditoria(true) }]));
    httpMock
      .expectOne(ENDPOINTS_API.administracion.tiposEntrega)
      .flush(respuesta([{ idTipoEntrega: 3, nombre: 'Recojo', ...auditoria(true) }]));
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposPago).flush(
      respuesta([
        {
          idTipoPago: 4,
          codigo: 'SENA',
          nombre: 'Seña',
          descripcion: 'Pago parcial',
          ...auditoria(true),
        },
      ]),
    );
    httpMock.expectOne(ENDPOINTS_API.administracion.tiposDocumento).flush(
      respuesta([
        {
          idTipoDocumento: 5,
          idCategoriaDocumento: 1,
          categoriaDocumento: 'PERSONA',
          nombre: 'DNI',
          abreviatura: 'DNI',
          longitudMinima: 8,
          longitudMaxima: 8,
          ...auditoria(true),
        },
      ]),
    );

    expect(categorias).toEqual([
      'RUBRO',
      'TIPO_PRODUCTO',
      'TIPO_ENTREGA',
      'TIPO_PAGO',
      'TIPO_DOCUMENTO',
    ]);
  });

  it('crea un rubro con el contrato esperado', () => {
    const solicitud = crearSolicitud({
      tipo: 'RUBRO',
      nombre: 'Flores',
      descripcion: 'Arreglos florales',
    });

    service.guardarDatoMaestro(solicitud).subscribe();

    const request = httpMock.expectOne(ENDPOINTS_API.administracion.rubros);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Flores',
      descripcion: 'Arreglos florales',
    });
    request.flush(
      respuesta({
        idRubro: 8,
        nombre: 'Flores',
        descripcion: 'Arreglos florales',
        ...auditoria(true),
      }),
    );
  });

  it('actualiza un tipo de documento conservando categoría y longitudes', () => {
    const solicitud = crearSolicitud({
      tipo: 'TIPO_DOCUMENTO',
      id: 5,
      nombre: 'Documento nacional',
      abreviatura: 'DNI',
      longitudMinima: 8,
      longitudMaxima: 8,
      idCategoriaDocumento: 1,
    });

    service.guardarDatoMaestro(solicitud).subscribe();

    const request = httpMock.expectOne(`${ENDPOINTS_API.administracion.tiposDocumento}/5`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      nombre: 'Documento nacional',
      abreviatura: 'DNI',
      longitudMinima: 8,
      longitudMaxima: 8,
      idCategoriaDocumento: 1,
    });
    request.flush(
      respuesta({
        idTipoDocumento: 5,
        idCategoriaDocumento: 1,
        categoriaDocumento: 'PERSONA',
        nombre: 'Documento nacional',
        abreviatura: 'DNI',
        longitudMinima: 8,
        longitudMaxima: 8,
        ...auditoria(true),
      }),
    );
  });

  it('solo actualiza los datos visibles de un tipo de pago', () => {
    const solicitud = crearSolicitud({
      tipo: 'TIPO_PAGO',
      id: 4,
      nombre: 'Pago inicial',
      descripcion: 'Cobro parcial del pedido',
    });

    service.guardarDatoMaestro(solicitud).subscribe();

    const request = httpMock.expectOne(`${ENDPOINTS_API.administracion.tiposPago}/4`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      nombre: 'Pago inicial',
      descripcion: 'Cobro parcial del pedido',
    });
    request.flush(
      respuesta({
        idTipoPago: 4,
        codigo: 'SENA',
        nombre: 'Pago inicial',
        descripcion: 'Cobro parcial del pedido',
        ...auditoria(true),
      }),
    );
  });

  it('desactiva un tipo de producto mediante DELETE', () => {
    service.cambiarEstadoDatoMaestro(crearDato('TIPO_PRODUCTO', true)).subscribe();

    const request = httpMock.expectOne(`${ENDPOINTS_API.administracion.tiposProducto}/9`);
    expect(request.request.method).toBe('DELETE');
    request.flush(respuesta(null));
  });

  it('reactiva un tipo de entrega mediante PATCH', () => {
    service.cambiarEstadoDatoMaestro(crearDato('TIPO_ENTREGA', false)).subscribe();

    const request = httpMock.expectOne(`${ENDPOINTS_API.administracion.tiposEntrega}/9/reactivar`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush(respuesta({ idTipoEntrega: 9, nombre: 'Delivery', ...auditoria(true) }));
  });
});

function respuesta<T>(data: T) {
  return { status: 'success' as const, data, message: null };
}

function auditoria(estado: boolean) {
  return {
    estado,
    fechaCreacion: '2026-07-01T10:00:00',
    fechaActualizacion: '2026-07-20T11:00:00',
  };
}

function crearSolicitud(
  cambios: Partial<SolicitudGuardarDatoMaestro['valores']> &
    Pick<SolicitudGuardarDatoMaestro, 'tipo'> & { id?: number },
): SolicitudGuardarDatoMaestro {
  return {
    tipo: cambios.tipo,
    id: cambios.id ?? null,
    valores: {
      nombre: cambios.nombre ?? '',
      descripcion: cambios.descripcion ?? '',
      abreviatura: cambios.abreviatura ?? '',
      longitudMinima: cambios.longitudMinima ?? null,
      longitudMaxima: cambios.longitudMaxima ?? null,
      idCategoriaDocumento: cambios.idCategoriaDocumento ?? null,
    },
  };
}

function crearDato(tipo: 'TIPO_PRODUCTO' | 'TIPO_ENTREGA', estado: boolean) {
  return {
    id: 9,
    tipo,
    categoria: tipo === 'TIPO_PRODUCTO' ? 'Tipos de producto' : 'Tipos de entrega',
    nombre: 'Registro',
    descripcion: 'Descripción',
    estado,
    codigo: null,
    abreviatura: null,
    idCategoriaDocumento: null,
    categoriaDocumento: null,
    longitudMinima: null,
    longitudMaxima: null,
    fechaCreacion: null,
    fechaActualizacion: null,
  } as const;
}
