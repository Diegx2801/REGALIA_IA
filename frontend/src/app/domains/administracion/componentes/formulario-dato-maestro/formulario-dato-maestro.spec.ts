import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioDatoMaestro } from './formulario-dato-maestro';

describe('FormularioDatoMaestro', () => {
  let fixture: ComponentFixture<FormularioDatoMaestro>;
  let component: FormularioDatoMaestro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(FormularioDatoMaestro);
    component = fixture.componentInstance;
  });

  it('impide guardar un documento con rango de longitud inválido', async () => {
    fixture.componentRef.setInput('tipo', 'TIPO_DOCUMENTO');
    fixture.componentRef.setInput('categoriasDocumento', [{ id: 1, nombre: 'PERSONA' }]);
    await fixture.whenStable();

    component.formulario.setValue({
      nombre: 'Documento nacional',
      descripcion: '',
      abreviatura: 'DNI',
      longitudMinima: '12',
      longitudMaxima: '8',
      idCategoriaDocumento: '1',
    });
    const guardar = vi.fn();
    component.guardar.subscribe(guardar);

    component.enviar();

    expect(component.formulario.hasError('rangoDocumentoInvalido')).toBe(true);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('emite un documento válido con valores numéricos tipados', async () => {
    fixture.componentRef.setInput('tipo', 'TIPO_DOCUMENTO');
    fixture.componentRef.setInput('categoriasDocumento', [{ id: 2, nombre: 'EMPRESA' }]);
    await fixture.whenStable();

    component.formulario.setValue({
      nombre: 'Registro único',
      descripcion: '',
      abreviatura: 'ruc',
      longitudMinima: '11',
      longitudMaxima: '11',
      idCategoriaDocumento: '2',
    });
    const guardar = vi.fn();
    component.guardar.subscribe(guardar);

    component.enviar();

    expect(guardar).toHaveBeenCalledWith({
      tipo: 'TIPO_DOCUMENTO',
      id: null,
      valores: {
        nombre: 'Registro único',
        descripcion: '',
        abreviatura: 'RUC',
        longitudMinima: 11,
        longitudMaxima: 11,
        idCategoriaDocumento: 2,
      },
    });
  });
});
