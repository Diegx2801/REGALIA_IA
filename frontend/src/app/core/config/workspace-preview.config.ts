import { UserRole } from '../services/auth/auth-session.service';

export interface WorkspaceIdentity {
  fullName: string;
  email: string;
  role: UserRole;
}

export const PREVIEW_IDENTITIES: Record<UserRole, WorkspaceIdentity> = {
  Cliente: {
    fullName: 'Valeria Mendoza',
    email: 'cliente.demo@regalia.pe',
    role: 'Cliente',
  },
  Proveedor: {
    fullName: 'Camila Rojas',
    email: 'proveedor.demo@regalia.pe',
    role: 'Proveedor',
  },
  Administrador: {
    fullName: 'Lucía Fernández',
    email: 'admin.demo@regalia.pe',
    role: 'Administrador',
  },
};

export const PREVIEW_ROUTES: Record<UserRole, string> = {
  Cliente: '/vista-previa/cliente',
  Proveedor: '/vista-previa/proveedor',
  Administrador: '/vista-previa/admin',
};
