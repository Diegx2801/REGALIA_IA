import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { VendedorApiService } from '../../acceso-datos/vendedor-api.service';
import { VendedorPanelStore } from '../../estado/vendedor-panel.store';
import { confirmarCambiosProductoGuard } from '../../guards/confirmar-cambios-producto.guard';
import {
  ProductoVendedor,
  SolicitudProductoVendedor,
  TiendaVendedor,
} from '../../modelos/vendedor.model';
import { PaginaVendedorProductos } from './pagina-vendedor-productos';

@Component({ template: '' })
class PaginaVaciaPrueba {}

describe('PaginaVendedorProductos', () => {
  let harness: RouterTestingHarness;
  let guardandoProducto: ReturnType<typeof signal<boolean>>;
  let mensajeError: ReturnType<typeof signal<string | null>>;
  let mensajeExito: ReturnType<typeof signal<string | null>>;
  let tiposProducto: ReturnType<
    typeof signal<Array<{ idTipoProducto: number; nombre: string; estado: boolean }>>
  >;
  let storeMock: {
    tiendas: ReturnType<typeof signal<TiendaVendedor[]>>;
    tiposProducto: typeof tiposProducto;
    cargando: ReturnType<typeof signal<boolean>>;
    guardandoProducto: typeof guardandoProducto;
    mensajeError: typeof mensajeError;
    mensajeExito: typeof mensajeExito;
    cargarContexto: ReturnType<typeof vi.fn>;
    limpiarMensajes: ReturnType<typeof vi.fn>;
    guardarProducto: ReturnType<typeof vi.fn>;
  };
  let vendedorApiMock: {
    obtenerProductoPorId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    guardandoProducto = signal(false);
    mensajeError = signal<string | null>(null);
    mensajeExito = signal<string | null>(null);
    tiposProducto = signal([
      { idTipoProducto: 1, nombre: 'Box personalizado', estado: true },
      { idTipoProducto: 2, nombre: 'Arreglo floral', estado: true },
    ]);
    storeMock = {
      tiendas: signal([crearTienda()]),
      tiposProducto,
      cargando: signal(false),
      guardandoProducto,
      mensajeError,
      mensajeExito,
      cargarContexto: vi.fn(),
      limpiarMensajes: vi.fn(() => {
        mensajeError.set(null);
        mensajeExito.set(null);
      }),
      guardarProducto: vi.fn(),
    };
    vendedorApiMock = {
      obtenerProductoPorId: vi.fn(() => of(crearProducto())),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: VendedorPanelStore, useValue: storeMock },
        { provide: VendedorApiService, useValue: vendedorApiMock },
        provideRouter([
          {
            path: 'vendedor/tiendas/:idTienda/productos/nuevo',
            component: PaginaVendedorProductos,
            canDeactivate: [confirmarCambiosProductoGuard],
          },
          {
            path: 'vendedor/tiendas/:idTienda/productos/:idProducto/editar',
            component: PaginaVendedorProductos,
            canDeactivate: [confirmarCambiosProductoGuard],
          },
          { path: 'vendedor/tiendas/:idTienda', component: PaginaVaciaPrueba },
          { path: 'vendedor/tiendas', component: PaginaVaciaPrueba },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
  });

  it('prepara la creación con tipos reales y sin consultar un producto', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');

    expect(storeMock.cargarContexto).toHaveBeenCalledOnce();
    expect(vendedorApiMock.obtenerProductoPorId).not.toHaveBeenCalled();
    expect(pagina.esEdicion()).toBe(false);
    expect(textoPagina()).toContain('Box personalizado');

    tiposProducto.set([
      ...tiposProducto(),
      { idTipoProducto: 3, nombre: 'Taza creativa', estado: true },
    ]);
    await harness.fixture.whenStable();

    expect(textoPagina()).toContain('Taza creativa');
  });

  it('alinea validaciones con el backend y enfoca el primer campo pendiente', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');

    pagina.formularioProducto.controls.nombre.setValue('   ');
    pagina.formularioProducto.controls.precio.setValue(10.999);
    pagina.formularioProducto.controls.stock.setValue(1.5);

    expect(pagina.formularioProducto.controls.nombre.invalid).toBe(true);
    expect(pagina.formularioProducto.controls.precio.hasError('maximoDosDecimales')).toBe(true);
    expect(pagina.formularioProducto.controls.stock.hasError('numeroEntero')).toBe(true);

    const formulario = harness.fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();

    expect(storeMock.guardarProducto).not.toHaveBeenCalled();
    expect(pagina.formularioProducto.controls.idTipoProducto.touched).toBe(true);
    expect(document.activeElement?.id).toBe('producto-tipo');
    const selectorTipo = harness.fixture.nativeElement.querySelector(
      '#producto-tipo',
    ) as HTMLSelectElement;
    expect(selectorTipo.getAttribute('aria-invalid')).toBe('true');
    expect(selectorTipo.getAttribute('aria-describedby')).toContain('producto-tipo-error');
    expect(harness.fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'campos pendientes',
    );
  });

  it('crea con la galería ordenada y cambia a edición después del éxito', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');
    completarFormularioValido(pagina);
    pagina.imagenes.at(0).setValue(' https://cdn.regalia.test/portada.webp ');
    pagina.agregarImagen();
    pagina.imagenes.at(1).setValue('https://cdn.regalia.test/detalle.webp');

    pagina.guardarProducto();

    expect(storeMock.guardarProducto).toHaveBeenCalledWith(
      10,
      {
        idTipoProducto: 1,
        nombre: 'Box aniversario',
        descripcion: null,
        precio: 129.9,
        stock: 6,
        visibleEnTienda: true,
        imagenes: [
          { urlImagen: 'https://cdn.regalia.test/portada.webp', orden: 1 },
          { urlImagen: 'https://cdn.regalia.test/detalle.webp', orden: 2 },
        ],
      } satisfies SolicitudProductoVendedor,
      undefined,
      expect.any(Function),
    );

    const alCompletar = storeMock.guardarProducto.mock.calls[0][3] as (
      producto: ProductoVendedor,
    ) => void;
    alCompletar(crearProducto({ idProducto: 88 }));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/vendedor/tiendas/10/productos/88/editar');
  });

  it('precarga y conserva todas las imágenes al editar', async () => {
    const producto = crearProducto();
    vendedorApiMock.obtenerProductoPorId.mockReturnValue(of(producto));

    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/77/editar');

    expect(vendedorApiMock.obtenerProductoPorId).toHaveBeenCalledWith(10, 77);
    expect(pagina.formularioProducto.controls.nombre.value).toBe('Box memorable');
    expect(pagina.imagenes.getRawValue()).toEqual([
      'https://cdn.regalia.test/portada.webp',
      'https://cdn.regalia.test/detalle.webp',
    ]);
    const imagenPrevia = harness.fixture.nativeElement.querySelector(
      '.editor-producto__imagen-principal > img',
    ) as HTMLImageElement;
    expect(imagenPrevia.src).toContain('https://cdn.regalia.test/portada.webp');
    expect(imagenPrevia.alt).toContain('Box memorable');

    pagina.guardarProducto();

    const solicitud = storeMock.guardarProducto.mock.calls[0][1] as SolicitudProductoVendedor;
    expect(solicitud.imagenes).toEqual(producto.imagenes);
    expect(storeMock.guardarProducto.mock.calls[0][2]).toBe(77);
  });

  it('conserva una imagen real aunque use la misma ruta del fallback visual', async () => {
    const urlFallback = '/assets/brand/producto-fallback.svg';
    vendedorApiMock.obtenerProductoPorId.mockReturnValue(
      of(
        crearProducto({
          imagenes: [{ urlImagen: urlFallback, orden: 1 }],
          urlImagen: urlFallback,
        }),
      ),
    );
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/77/editar');

    expect(pagina.imagenes.getRawValue()).toEqual([urlFallback]);
    pagina.guardarProducto();

    expect(
      (storeMock.guardarProducto.mock.calls[0][1] as SolicitudProductoVendedor).imagenes,
    ).toEqual([{ urlImagen: urlFallback, orden: 1 }]);
  });

  it('bloquea el formulario y ofrece recuperación cuando falla la carga', async () => {
    vendedorApiMock.obtenerProductoPorId.mockReturnValue(
      throwError(() => new Error('Fallo de red')),
    );

    await abrirPagina('/vendedor/tiendas/10/productos/77/editar');

    expect(harness.fixture.nativeElement.querySelector('form')).toBeNull();
    const alerta = harness.fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alerta.textContent).toContain('No pudimos cargar el producto solicitado');
    expect(alerta.textContent).toContain('Reintentar');
  });

  it('redirige rutas inválidas sin habilitar una creación accidental', async () => {
    await harness.navigateByUrl('/vendedor/tiendas/10/productos/no-valido/editar');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/vendedor/tiendas');
    expect(vendedorApiMock.obtenerProductoPorId).not.toHaveBeenCalled();
    expect(storeMock.guardarProducto).not.toHaveBeenCalled();
  });

  it('descarta una respuesta tardía del reintento al cambiar de producto', async () => {
    const cargaReintento = new Subject<ProductoVendedor>();
    const cargaProductoSiguiente = new Subject<ProductoVendedor>();
    vendedorApiMock.obtenerProductoPorId
      .mockReturnValueOnce(throwError(() => new Error('Fallo inicial')))
      .mockReturnValueOnce(cargaReintento.asObservable())
      .mockReturnValueOnce(cargaProductoSiguiente.asObservable());

    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/77/editar');
    pagina.reintentarCargaProducto();
    const paginaSiguiente = await harness.navigateByUrl(
      '/vendedor/tiendas/10/productos/88/editar',
      PaginaVendedorProductos,
    );

    cargaProductoSiguiente.next(crearProducto({ idProducto: 88, nombre: 'Producto actual' }));
    cargaProductoSiguiente.complete();
    await harness.fixture.whenStable();
    cargaReintento.next(crearProducto({ idProducto: 77, nombre: 'Producto anterior' }));
    cargaReintento.complete();
    await harness.fixture.whenStable();

    expect(paginaSiguiente.idProducto()).toBe(88);
    expect(paginaSiguiente.formularioProducto.controls.nombre.value).toBe('Producto actual');
    expect(paginaSiguiente.cargandoProducto()).toBe(false);
  });

  it('protege cambios pendientes y no ejecuta navegación tardía tras salir', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');
    pagina.formularioProducto.controls.nombre.setValue('Borrador importante');
    pagina.formularioProducto.markAsDirty();
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);

    pagina.cancelar();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/vendedor/tiendas/10/productos/nuevo');

    confirmar.mockReturnValue(true);
    pagina.cancelar();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/vendedor/tiendas/10');

    confirmar.mockRestore();
  });

  it('ignora el callback de creación si el editor ya fue destruido', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');
    completarFormularioValido(pagina);
    pagina.guardarProducto();
    const alCompletar = storeMock.guardarProducto.mock.calls[0][3] as (
      producto: ProductoVendedor,
    ) => void;

    await harness.navigateByUrl('/vendedor/tiendas/10');
    alCompletar(crearProducto({ idProducto: 99 }));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/vendedor/tiendas/10');
  });

  it('expone el estado de guardado y evita un segundo envío', async () => {
    const pagina = await abrirPagina('/vendedor/tiendas/10/productos/nuevo');
    completarFormularioValido(pagina);
    guardandoProducto.set(true);
    await harness.fixture.whenStable();

    const boton = harness.fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute('aria-busy')).toBe('true');
    expect(boton.textContent).toContain('Guardando');
    expect(
      [...harness.fixture.nativeElement.querySelectorAll('fieldset')].every(
        (fieldset: HTMLFieldSetElement) => fieldset.disabled,
      ),
    ).toBe(true);

    pagina.guardarProducto();
    expect(storeMock.guardarProducto).not.toHaveBeenCalled();
  });

  async function abrirPagina(url: string): Promise<PaginaVendedorProductos> {
    const pagina = await harness.navigateByUrl(url, PaginaVendedorProductos);
    await harness.fixture.whenStable();
    return pagina;
  }

  function textoPagina(): string {
    return (harness.fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});

function completarFormularioValido(pagina: PaginaVendedorProductos): void {
  pagina.formularioProducto.patchValue({
    idTipoProducto: 1,
    nombre: '  Box aniversario  ',
    descripcion: '   ',
    precio: 129.9,
    stock: 6,
    visibleEnTienda: true,
  });
}

function crearTienda(): TiendaVendedor {
  return {
    idTienda: 10,
    nombre: 'Detalles Aurora',
    descripcion: 'Regalos personalizados',
    direccionReferencia: 'Lima',
    estadoRevision: 'APROBADA',
    formalizada: true,
    idDocumentoFiscal: 1,
    rubros: [{ idRubro: 1, nombre: 'Regalos' }],
    estado: true,
  };
}

function crearProducto(cambios: Partial<ProductoVendedor> = {}): ProductoVendedor {
  const imagenes = [
    { urlImagen: 'https://cdn.regalia.test/portada.webp', orden: 1 },
    { urlImagen: 'https://cdn.regalia.test/detalle.webp', orden: 2 },
  ];
  return {
    idProducto: 77,
    idTienda: 10,
    nombreTienda: 'Detalles Aurora',
    idTipoProducto: 1,
    tipoProducto: 'Box personalizado',
    nombre: 'Box memorable',
    descripcion: 'Incluye dedicatoria personalizada.',
    precio: 129.9,
    stock: 6,
    visibleEnTienda: true,
    estado: true,
    imagenes,
    urlImagen: imagenes[0].urlImagen,
    ...cambios,
  };
}
