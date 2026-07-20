import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoUi } from './dialogo-ui';

describe('DialogoUi', () => {
  let fixture: ComponentFixture<DialogoUi>;
  let dialogo: HTMLDialogElement;

  beforeEach(async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      }),
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      }),
    });

    fixture = TestBed.createComponent(DialogoUi);
    fixture.componentRef.setInput('abierto', false);
    fixture.componentRef.setInput('idTitulo', 'titulo-prueba');
    await fixture.whenStable();
    dialogo = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
  });

  it('sincroniza el estado abierto con el diálogo nativo', async () => {
    fixture.componentRef.setInput('abierto', true);
    await fixture.whenStable();

    expect(dialogo.hasAttribute('open')).toBe(true);

    fixture.componentRef.setInput('abierto', false);
    await fixture.whenStable();

    expect(dialogo.hasAttribute('open')).toBe(false);
  });

  it('solicita el cierre al presionar Escape', () => {
    const solicitudCierre = vi.fn();
    fixture.componentInstance.solicitudCierre.subscribe(solicitudCierre);
    const evento = new Event('cancel', { cancelable: true });

    dialogo.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(solicitudCierre).toHaveBeenCalledOnce();
  });
});
