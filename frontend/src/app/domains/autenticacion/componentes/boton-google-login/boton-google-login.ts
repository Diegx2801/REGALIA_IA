import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { GoogleIdentidadService } from '../../acceso-datos/google-identidad.service';

@Component({
  selector: 'app-boton-google-login',
  templateUrl: './boton-google-login.html',
  styleUrl: './boton-google-login.css',
})
export class BotonGoogleLogin implements AfterViewInit, OnDestroy {
  @Input() disabled = false;
  @Output() idTokenObtenido = new EventEmitter<string>();
  @Output() errorAutenticacion = new EventEmitter<string>();

  @ViewChild('contenedorGoogle', { static: true })
  private contenedorGoogle?: ElementRef<HTMLElement>;

  private readonly googleIdentidad = inject(GoogleIdentidadService);
  private readonly zona = inject(NgZone);
  private destruido = false;

  ngAfterViewInit(): void {
    const contenedor = this.contenedorGoogle?.nativeElement;
    if (!contenedor) return;

    this.googleIdentidad.renderizarBoton(contenedor, {
      onCredential: (idToken) => this.emitirIdToken(idToken),
      onError: (mensaje) => this.emitirError(mensaje),
    });
  }

  ngOnDestroy(): void {
    this.destruido = true;
  }

  private emitirIdToken(idToken: string): void {
    this.zona.run(() => {
      if (!this.destruido) this.idTokenObtenido.emit(idToken);
    });
  }

  private emitirError(mensaje: string): void {
    this.zona.run(() => {
      if (!this.destruido) this.errorAutenticacion.emit(mensaje);
    });
  }
}
