import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DatosMaestrosAdminApiService } from '../../acceso-datos/datos-maestros-admin-api.service';
import { DatoMaestroAdmin } from '../../modelos/dato-maestro-admin.model';
import { PaginaAdminDatosMaestros } from './pagina-admin-datos-maestros';

describe('PaginaAdminDatosMaestros', () => {
  let fixture: ComponentFixture<PaginaAdminDatosMaestros>;
  let component: PaginaAdminDatosMaestros;
  let api: {
    obtenerDatosMaestros: ReturnType<typeof vi.fn>;
    guardarDatoMaestro: ReturnType<typeof vi.fn>;
    cambiarEstadoDatoMaestro: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    });

    api = {
      obtenerDatosMaestros: vi.fn().mockReturnValue(of(DATOS_MAESTROS)),
      guardarDatoMaestro: vi.fn().mockReturnValue(of(DATOS_MAESTROS[0])),
      cambiarEstadoDatoMaestro: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DatosMaestrosAdminApiService, useValue: api }],
    });
    fixture = TestBed.createComponent(PaginaAdminDatosMaestros);
    component = fixture.componentInstance;
  });

  it('presenta los catálogos reales y el directorio responsive', async () => {
    await fixture.whenStable();

    const contenido = fixture.nativeElement.textContent as string;
    expect(api.obtenerDatosMaestros).toHaveBeenCalledOnce();
    expect(contenido).toContain('Rubros');
    expect(contenido).toContain('Tipos de pago');
    expect(contenido).toContain('Regalos personalizados');
    expect(fixture.nativeElement.querySelector('.admin-datos__tabla')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.admin-datos__tarjetas')).not.toBeNull();
  });

  it('filtra el catálogo seleccionado por texto y estado', async () => {
    await fixture.whenStable();
    component.formularioFiltros.setValue({ busqueda: 'corporativos', estado: 'INACTIVOS' });

    component.aplicarFiltros();
    await fixture.whenStable();

    expect(component.datosFiltrados().map((dato) => dato.nombre)).toEqual(['Regalos corporativos']);
    expect(fixture.nativeElement.textContent).toContain('Regalos corporativos');
    expect(fixture.nativeElement.textContent).not.toContain('Regalos personalizados');
  });

  it('respeta las restricciones reales de tipos de pago', async () => {
    await fixture.whenStable();

    component.seleccionarTipo('TIPO_PAGO');
    await fixture.whenStable();

    const contenido = fixture.nativeElement.textContent as string;
    expect(component.puedeCrearSeleccionado()).toBe(false);
    expect(contenido).toContain('Códigos protegidos por reglas de negocio');
    expect(contenido).not.toContain('Nuevo registro');
  });

  it('solicita confirmación accesible antes de desactivar', async () => {
    await fixture.whenStable();
    const rubro = DATOS_MAESTROS[0];

    component.solicitarCambioEstado(rubro);
    await fixture.whenStable();

    expect(api.cambiarEstadoDatoMaestro).not.toHaveBeenCalled();
    expect(component.datoPendienteEstado()).toBe(rubro);
    expect(fixture.nativeElement.textContent).toContain('¿Desactivar “Regalos personalizados”?');

    component.confirmarCambioEstado();
    await fixture.whenStable();

    expect(api.cambiarEstadoDatoMaestro).toHaveBeenCalledWith(rubro);
    expect(component.datoPendienteEstado()).toBeNull();
  });
});

const DATOS_MAESTROS: DatoMaestroAdmin[] = [
  crearDato({ id: 1, nombre: 'Regalos personalizados', estado: true }),
  crearDato({ id: 2, nombre: 'Regalos corporativos', estado: false }),
  crearDato({
    id: 3,
    tipo: 'TIPO_PAGO',
    categoria: 'Tipos de pago',
    nombre: 'Pago completo',
    codigo: 'COMPLETO',
    estado: true,
  }),
];

function crearDato(cambios: Partial<DatoMaestroAdmin> & Pick<DatoMaestroAdmin, 'id' | 'nombre'>): DatoMaestroAdmin {
  return {
    id: cambios.id,
    tipo: cambios.tipo ?? 'RUBRO',
    categoria: cambios.categoria ?? 'Rubros',
    nombre: cambios.nombre,
    descripcion: cambios.descripcion ?? 'Clasificación operativa',
    estado: cambios.estado ?? true,
    codigo: cambios.codigo ?? null,
    abreviatura: cambios.abreviatura ?? null,
    idCategoriaDocumento: cambios.idCategoriaDocumento ?? null,
    categoriaDocumento: cambios.categoriaDocumento ?? null,
    longitudMinima: cambios.longitudMinima ?? null,
    longitudMaxima: cambios.longitudMaxima ?? null,
    fechaCreacion: cambios.fechaCreacion ?? '2026-07-01T10:00:00',
    fechaActualizacion: cambios.fechaActualizacion ?? '2026-07-20T12:00:00',
  };
}
