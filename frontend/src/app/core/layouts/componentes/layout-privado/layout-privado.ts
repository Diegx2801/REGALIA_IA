import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs';
import { SesionAutenticacionService } from '../../../autenticacion/sesion-autenticacion.service';

export type VarianteLayoutPrivado = 'cliente' | 'vendedor' | 'administracion';
export type IconoLayoutPrivado =
  | 'resumen'
  | 'pedidos'
  | 'perfil'
  | 'tiendas'
  | 'usuarios'
  | 'vendedores'
  | 'datos'
  | 'catalogo'
  | 'acceso';

export interface EnlaceLayoutPrivado {
  etiqueta: string;
  ruta: string;
  descripcion: string;
  icono?: IconoLayoutPrivado;
  queryParams?: Record<string, string>;
  patronesActivos?: RegExp[];
}

@Component({
  selector: 'app-layout-privado',
  imports: [RouterLink, NgbTooltip],
  templateUrl: './layout-privado.html',
  styleUrl: './layout-privado.css',
  host: {
    '(document:keydown.escape)': 'cerrarMenuMovil()',
    '(document:keydown.tab)': 'mantenerFocoMenu($event)',
  },
})
export class LayoutPrivadoComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly botonAbrirMenu = viewChild<ElementRef<HTMLButtonElement>>('botonAbrirMenu');
  private readonly botonCerrarMenu = viewChild<ElementRef<HTMLButtonElement>>('botonCerrarMenu');
  private readonly menuLateral = viewChild<ElementRef<HTMLElement>>('menuLateral');
  private readonly contenidoPrincipal = viewChild<ElementRef<HTMLElement>>('contenidoPrincipal');
  private rutaBaseActual = this.obtenerRutaBase(this.router.url);

  readonly titulo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly variante = input<VarianteLayoutPrivado>('cliente');
  readonly enlaces = input<EnlaceLayoutPrivado[]>([]);
  readonly menuMovilAbierto = signal(false);

  readonly sesion = inject(SesionAutenticacionService);
  readonly nombreVisible = computed(() => {
    const usuario = this.sesion.usuarioActual();
    const nombre = usuario?.nombreCompleto?.trim();
    const correo = usuario?.correo?.trim();

    // Durante el login actual, el backend aun no entrega nombres; evita repetir el correo como nombre y subtitulo.
    if (
      !nombre ||
      (correo && nombre.localeCompare(correo, undefined, { sensitivity: 'accent' }) === 0)
    ) {
      return 'Cuenta REGALIA';
    }

    return nombre;
  });
  readonly inicialesUsuario = computed(() => {
    const nombre = this.nombreVisible();
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });
  readonly rolVisible = computed(() => this.sesion.rolActual() ?? 'INVITADO');

  constructor() {
    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((evento) => {
        const rutaSiguiente = this.obtenerRutaBase(evento.urlAfterRedirects);
        if (rutaSiguiente === this.rutaBaseActual) return;

        this.rutaBaseActual = rutaSiguiente;
        setTimeout(() => this.contenidoPrincipal()?.nativeElement.focus(), 0);
      });
  }

  alternarMenuMovil(): void {
    if (this.menuMovilAbierto()) {
      this.cerrarMenuMovil();
      return;
    }

    this.menuMovilAbierto.set(true);
    setTimeout(() => this.botonCerrarMenu()?.nativeElement.focus(), 0);
  }

  cerrarMenuMovil(restaurarFoco = true): void {
    if (!this.menuMovilAbierto()) return;
    this.menuMovilAbierto.set(false);
    if (restaurarFoco) setTimeout(() => this.botonAbrirMenu()?.nativeElement.focus(), 0);
  }

  mantenerFocoMenu(evento: Event): void {
    if (!this.menuMovilAbierto()) return;

    const eventoTeclado = evento as KeyboardEvent;

    const menu = this.menuLateral()?.nativeElement;
    if (!menu) return;

    const elementos = Array.from(
      menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((elemento) => elemento.offsetParent !== null);
    const primero = elementos[0];
    const ultimo = elementos.at(-1);
    if (!primero || !ultimo) return;

    const activo = document.activeElement;
    if (!menu.contains(activo)) {
      eventoTeclado.preventDefault();
      primero.focus();
    } else if (eventoTeclado.shiftKey && activo === primero) {
      eventoTeclado.preventDefault();
      ultimo.focus();
    } else if (!eventoTeclado.shiftKey && activo === ultimo) {
      eventoTeclado.preventDefault();
      primero.focus();
    }
  }

  enlaceActivo(enlace: EnlaceLayoutPrivado): boolean {
    const rutaActual = this.obtenerRutaBase(this.router.url);
    if (enlace.patronesActivos?.length) {
      return enlace.patronesActivos.some((patron) => patron.test(rutaActual));
    }

    return rutaActual === enlace.ruta || rutaActual.startsWith(`${enlace.ruta}/`);
  }

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    void this.router.navigateByUrl('/');
  }

  private obtenerRutaBase(url: string): string {
    return url.split(/[?#]/, 1)[0] || '/';
  }
}
