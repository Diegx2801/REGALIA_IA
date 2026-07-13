import { mapearCredencialesLoginADto, mapearLoginDesdeDto } from './autenticacion.mapper';

describe('autenticacion.mapper', () => {
  it('normaliza correo antes de enviar credenciales al backend', () => {
    const dto = mapearCredencialesLoginADto({
      correo: ' Cliente.Demo@REGALIA.Local ',
      contrasena: 'Regalia123!',
    });

    expect(dto).toEqual({
      correo: 'cliente.demo@regalia.local',
      contrasena: 'Regalia123!',
    });
  });

  it('descarta roles desconocidos para no contaminar autorizacion frontend', () => {
    const login = mapearLoginDesdeDto({
      token: 'jwt-demo',
      tipo: 'Bearer',
      idUsuario: 5,
      correo: 'cliente.demo@regalia.local',
      roles: ['CLIENTE', 'ROL_INVALIDO', 'VENDEDOR'],
      authContext: 'PUBLIC',
      expiraEnMinutos: 240,
    });

    expect(login.roles).toEqual(['CLIENTE', 'VENDEDOR']);
    expect(login.contextoAutenticacion).toBe('PUBLIC');
  });
});
