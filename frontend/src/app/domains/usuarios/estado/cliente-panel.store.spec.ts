import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CuentaIdentidadApiService } from '../../autenticacion/acceso-datos/cuenta-identidad-api.service';
import { UsuarioApiService } from '../acceso-datos/usuario-api.service';
import { ClientePanelStore } from './cliente-panel.store';

describe('ClientePanelStore', () => {
  let store: ClientePanelStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientePanelStore,
        {
          provide: UsuarioApiService,
          useValue: {
            obtenerPerfilActual: () => of(crearPerfil()),
          },
        },
        {
          provide: CuentaIdentidadApiService,
          useValue: {
            listarIdentidades: () => of([]),
          },
        },
      ],
    });

    store = TestBed.inject(ClientePanelStore);
  });

  it('carga el perfil y las identidades de la cuenta', () => {
    store.cargarPanel();

    expect(store.perfil()?.correo).toBe('cliente.demo@regalia.local');
    expect(store.identidadesCuenta()).toEqual([]);
  });
});

function crearPerfil() {
  return {
    idUsuario: 1,
    nombres: 'Cliente',
    apellidos: 'Demo',
    nombreCompleto: 'Cliente Demo',
    correo: 'cliente.demo@regalia.local',
    telefono: '999888777',
    correoVerificado: true,
    estado: true,
    fechaCreacion: null,
    fechaActualizacion: null,
  };
}
