import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DatosMaestrosAdminApiService } from '../../acceso-datos/datos-maestros-admin-api.service';
import { DatoMaestroAdmin } from '../../modelos/dato-maestro-admin.model';
import { PaginaAdminDatosMaestros } from './pagina-admin-datos-maestros';

describe('PaginaAdminDatosMaestros', () => {
  let fixture: ComponentFixture<PaginaAdminDatosMaestros>;
  let component: PaginaAdminDatosMaestros;
  const api = { obtenerDatosMaestros: vi.fn().mockReturnValue(of(DATOS_MAESTROS)) };

  beforeEach(() => {
    api.obtenerDatosMaestros.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: DatosMaestrosAdminApiService, useValue: api }],
    });
    fixture = TestBed.createComponent(PaginaAdminDatosMaestros);
    component = fixture.componentInstance;
  });

  it('muestra catalogos de solo consulta', async () => {
    await fixture.whenStable();

    const contenido = fixture.nativeElement.textContent as string;
    expect(api.obtenerDatosMaestros).toHaveBeenCalledOnce();
    expect(contenido).toContain('Configuracion del marketplace');
    expect(contenido).toContain('Rubros');
    expect(contenido).not.toContain('Nuevo registro');
  });

  it('cambia el catalogo visible sin mutar datos', async () => {
    await fixture.whenStable();
    component.seleccionarTipo('TIPO_PAGO');
    await fixture.whenStable();

    expect(component.datosDeCategoria().map((dato) => dato.nombre)).toEqual(['Pago completo']);
    expect(fixture.nativeElement.textContent).toContain('Pago completo');
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
    descripcion: cambios.descripcion ?? 'Clasificacion operativa',
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
