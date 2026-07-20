import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { CampoTexto } from './campo-texto/campo-texto';
import { CampoTextarea } from './campo-textarea/campo-textarea';

describe('Campos de formulario compartidos', () => {
  describe('CampoTexto', () => {
    let fixture: ComponentFixture<CampoTexto>;
    let control: FormControl<string>;

    beforeEach(async () => {
      control = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(10)],
      });
      fixture = TestBed.createComponent(CampoTexto);
      fixture.componentRef.setInput('id', 'nombre-prueba');
      fixture.componentRef.setInput('etiqueta', 'Nombre');
      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('maximoCaracteres', 10);
      fixture.componentRef.setInput('mensajeError', 'Nombre inválido.');
      await fixture.whenStable();
    });

    it('actualiza el estado accesible y el mensaje cuando el control cambia', () => {
      const entrada = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(entrada.maxLength).toBe(10);
      expect(entrada.getAttribute('aria-invalid')).toBe('false');

      control.markAsTouched();
      fixture.detectChanges();

      expect(entrada.getAttribute('aria-invalid')).toBe('true');
      expect(fixture.nativeElement.textContent).toContain('Nombre inválido.');

      control.setValue('REGALIA');
      fixture.detectChanges();

      expect(entrada.getAttribute('aria-invalid')).toBe('false');
      expect(fixture.nativeElement.textContent).not.toContain('Nombre inválido.');
    });

    it('asocia una única etiqueta al input sin duplicar el identificador en el host', () => {
      const host = fixture.nativeElement as HTMLElement;
      const entrada = host.querySelector('input') as HTMLInputElement;
      if (!host.isConnected) document.body.appendChild(host);

      expect(host.getAttribute('id')).toBeNull();
      expect(entrada.id).toBe('nombre-prueba');
      expect(entrada.labels?.length).toBe(1);
      expect(entrada.labels?.item(0)?.textContent).toContain('Nombre');
    });
  });

  describe('CampoTextarea', () => {
    let fixture: ComponentFixture<CampoTextarea>;
    let control: FormControl<string>;

    beforeEach(async () => {
      control = new FormControl('Regalo', {
        nonNullable: true,
        validators: [Validators.maxLength(20)],
      });
      fixture = TestBed.createComponent(CampoTextarea);
      fixture.componentRef.setInput('id', 'descripcion-prueba');
      fixture.componentRef.setInput('etiqueta', 'Descripción');
      fixture.componentRef.setInput('control', control);
      fixture.componentRef.setInput('maximoCaracteres', 20);
      await fixture.whenStable();
    });

    it('mantiene sincronizado el contador de caracteres', async () => {
      expect(fixture.nativeElement.textContent).toContain('6/20');

      control.setValue('Regalo personalizado');
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('20/20');
    });

    it('asocia una única etiqueta al textarea sin duplicar el identificador en el host', () => {
      const host = fixture.nativeElement as HTMLElement;
      const campo = host.querySelector('textarea') as HTMLTextAreaElement;
      if (!host.isConnected) document.body.appendChild(host);

      expect(host.getAttribute('id')).toBeNull();
      expect(campo.id).toBe('descripcion-prueba');
      expect(campo.labels?.length).toBe(1);
      expect(campo.labels?.item(0)?.textContent).toContain('Descripción');
    });
  });
});
