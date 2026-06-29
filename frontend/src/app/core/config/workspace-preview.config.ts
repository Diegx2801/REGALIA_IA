import { UserRole } from '../services/auth/auth-session.model';

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
  Vendedor: {
    fullName: 'Camila Rojas',
    email: 'vendedor.demo@regalia.pe',
    role: 'Vendedor',
  },
  Administrador: {
    fullName: 'Lucía Fernández',
    email: 'admin.demo@regalia.pe',
    role: 'Administrador',
  },
};

export const PREVIEW_ROUTES: Record<UserRole, string> = {
  Cliente: '/vista-previa/cliente',
  Vendedor: '/vista-previa/vendedor',
  Administrador: '/vista-previa/admin',
};
