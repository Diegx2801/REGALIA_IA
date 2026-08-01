import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
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
  | 'carrito'
  | 'inicio'
  | 'acceso';

export interface EnlaceLayoutPrivado {
  etiqueta: string;
  ruta: string;
  descripcion: string;
  icono?: IconoLayoutPrivado;
  encabezadoGrupo?: string;
  queryParams?: Record<string, string>;
  patronesActivos?: RegExp[];
}

export interface AccionRapidaLayoutPrivado {
  etiqueta: string;
  ruta: string;
  descripcion: string;
  icono: Extract<IconoLayoutPrivado, 'catalogo' | 'carrito' | 'inicio'>;
  ariaLabel?: string;
  insignia?: number | string | null;
  destacada?: boolean;
  ocultaEnMovil?: boolean;
  etiquetaDesdeSm?: boolean;
}

const ACCIONES_RAPIDAS_PREDETERMINADAS: readonly AccionRapidaLayoutPrivado[] = [
  {
    etiqueta: 'Catálogo',
    ruta: '/catalogo',
    descripcion: 'Explorar productos',
    icono: 'catalogo',
    ocultaEnMovil: true,
    etiquetaDesdeSm: true,
  },
  {
    etiqueta: 'Inicio',
    ruta: '/',
    descripcion: 'Volver a REGALIA',
    icono: 'inicio',
    ariaLabel: 'Ir al inicio de REGALIA',
    destacada: true,
    etiquetaDesdeSm: true,
  },
];

@Component({
  selector: 'app-layout-privado',
  imports: [RouterLink, NgbTooltip],
  templateUrl: './layout-privado.html',
  styleUrl: './layout-privado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cerrarSuperficieActiva()',
    '(document:keydown.tab)': 'mantenerFocoMenu($event)',
    '(document:keydown.control.k)': 'abrirPaleta($event)',
    '(document:keydown.meta.k)': 'abrirPaleta($event)',
  },
})
export class LayoutPrivadoComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly botonAbrirMenu = viewChild<ElementRef<HTMLButtonElement>>('botonAbrirMenu');
  private readonly botonCerrarMenu = viewChild<ElementRef<HTMLButtonElement>>('botonCerrarMenu');
  private readonly menuLateral = viewChild<ElementRef<HTMLElement>>('menuLateral');
  private readonly dialogoNavegacion = viewChild<ElementRef<HTMLElement>>('dialogoNavegacion');
  private readonly campoBusqueda = viewChild<ElementRef<HTMLInputElement>>('campoBusqueda');
  private readonly contenidoPrincipal = viewChild<ElementRef<HTMLElement>>('contenidoPrincipal');
  private readonly rutaActual = signal(this.obtenerRutaBase(this.router.url));
  private elementoAntesDePaleta: HTMLElement | null = null;

  readonly titulo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly variante = input<VarianteLayoutPrivado>('cliente');
  readonly enlaces = input<readonly EnlaceLayoutPrivado[]>([]);
  readonly ariaEtiquetaMenu = input('Navegación privada');
  readonly ariaEtiquetaSecciones = input('Secciones del panel');
  readonly ariaEtiquetaAcciones = input('Acciones rápidas privadas');
  readonly accionesRapidas = input<readonly AccionRapidaLayoutPrivado[]>(
    ACCIONES_RAPIDAS_PREDETERMINADAS,
  );
  readonly mostrarAccionesEnMenuMovil = input(false);
  readonly menuMovilAbierto = signal(false);
  readonly paletaAbierta = signal(false);
  readonly consultaPaleta = signal('');
  readonly contenidoEntrando = signal(true);

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
  readonly enlaceActual = computed(() =>
    this.enlaces().find((enlace) => this.coincideEnlace(enlace, this.rutaActual())),
  );
  readonly tituloSeccionActual = computed(() => this.enlaceActual()?.etiqueta ?? this.titulo());
  readonly destinosPaleta = computed(() => {
    const destinos = [
      ...this.enlaces().map((enlace) => ({
        etiqueta: enlace.etiqueta,
        descripcion: enlace.descripcion,
        ruta: enlace.ruta,
        icono: enlace.icono,
      })),
      ...this.accionesRapidas().map((accion) => ({
        etiqueta: accion.etiqueta,
        descripcion: accion.descripcion,
        ruta: accion.ruta,
        icono: accion.icono,
      })),
    ];

    return destinos.filter(
      (destino, indice) =>
        destinos.findIndex((candidato) => candidato.ruta === destino.ruta) === indice,
    );
  });
  readonly resultadosPaleta = computed(() => {
    const consulta = this.normalizarTexto(this.consultaPaleta());
    if (!consulta) return this.destinosPaleta();

    return this.destinosPaleta().filter((destino) =>
      this.normalizarTexto(`${destino.etiqueta} ${destino.descripcion}`).includes(consulta),
    );
  });

  constructor() {
    effect((limpiar) => {
      if (!this.menuMovilAbierto() && !this.paletaAbierta()) return;

      const overflowAnterior = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
      limpiar(() => (this.document.body.style.overflow = overflowAnterior));
    });

    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((evento) => {
        const rutaSiguiente = this.obtenerRutaBase(evento.urlAfterRedirects);
        if (rutaSiguiente === this.rutaActual()) return;

        this.rutaActual.set(rutaSiguiente);
        this.cerrarPaleta(false);
        this.contenidoEntrando.set(false);
        requestAnimationFrame(() => this.contenidoEntrando.set(true));
        setTimeout(() => this.contenidoPrincipal()?.nativeElement.focus(), 0);
      });
  }

  abrirPaleta(evento?: Event): void {
    evento?.preventDefault();
    if (this.paletaAbierta()) return;

    this.elementoAntesDePaleta = this.document.activeElement as HTMLElement | null;
    this.consultaPaleta.set('');
    this.paletaAbierta.set(true);
    setTimeout(() => this.campoBusqueda()?.nativeElement.focus(), 0);
  }

  cerrarPaleta(restaurarFoco = true): void {
    if (!this.paletaAbierta()) return;
    this.paletaAbierta.set(false);
    this.consultaPaleta.set('');
    if (restaurarFoco) setTimeout(() => this.elementoAntesDePaleta?.focus(), 0);
  }

  cerrarSuperficieActiva(): void {
    if (this.paletaAbierta()) {
      this.cerrarPaleta();
      return;
    }
    this.cerrarMenuMovil();
  }

  actualizarBusqueda(evento: Event): void {
    this.consultaPaleta.set((evento.target as HTMLInputElement).value);
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
    const eventoTeclado = evento as KeyboardEvent;
    const superficie = this.paletaAbierta()
      ? this.dialogoNavegacion()?.nativeElement
      : this.menuMovilAbierto()
        ? this.menuLateral()?.nativeElement
        : null;
    if (!superficie) return;

    const elementos = Array.from(
      superficie.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((elemento) => elemento.offsetParent !== null);
    const primero = elementos[0];
    const ultimo = elementos.at(-1);
    if (!primero || !ultimo) return;

    const activo = document.activeElement;
    if (!superficie.contains(activo)) {
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
    return this.coincideEnlace(enlace, this.rutaActual());
  }

  private coincideEnlace(enlace: EnlaceLayoutPrivado, rutaActual: string): boolean {
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

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('es');
  }
}
