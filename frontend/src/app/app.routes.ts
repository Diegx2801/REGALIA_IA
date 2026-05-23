/**
 * =========================================================================
 * CONFIGURACIÓN DE ENRUTAMIENTO GLOBAL (ROUTING ARQUITECTURA)
 * DESCRIPCIÓN: Definición de rutas basadas en layouts y Features.
 * =========================================================================
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
        {
        // Contenedor principal público (Cascarón con Navbar y Footer)
        path: '',
        loadComponent: () => import('./core/layouts/public-layout/public-layout')
        .then(m => m.PublicLayoutComponent),
        children: [
        {
            // Vista por defecto inyectada en el router-outlet del layout
            path: '',
            loadComponent: () => import('./features/landing/landing')
            .then(m => m.LandingComponent)
        }
        ]
    }
];
