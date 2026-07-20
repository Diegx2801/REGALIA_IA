import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidoRecibidoDetalle } from '../../modelos/vendedor.model';
import { DetallePedidoVendedor } from './detalle-pedido-vendedor';

describe('DetallePedidoVendedor', () => {
  let component: DetallePedidoVendedor;
  let fixture: ComponentFixture<DetallePedidoVendedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePedidoVendedor],
    }).compileComponents();

    fixture = TestBed.createComponent(DetallePedidoVendedor);
    component = fixture.componentInstance;
  });

  it('presenta identidad, estados, importes y trazabilidad reales del pedido', async () => {
    fixture.componentRef.setInput('pedido', crearDetallePedido());
    fixture.detectChanges();
    await fixture.whenStable();

    const texto = textoNormalizado();
    expect(texto).toContain('Pedido #42');
    expect(texto).toContain('Nuevo · reservado');
    expect(texto).toContain('Pago parcial');
    expect(texto).toContain('cliente@regalia.test');
    expect(texto).toContain('Detalles Aurora');
    expect(texto).toContain('Box aniversario');
    expect(texto).toContain('Aprobado');
    expect(texto).toContain('Coordinar dedicatoria por WhatsApp');
    expect(texto).not.toContain('RESERVADO');
    expect(texto).not.toContain('APROBADO');
    expect(texto).toMatch(/S\/\s*150\.00/);
    expect(texto).toMatch(/S\/\s*80\.00/);
    expect(texto).toMatch(/S\/\s*70\.00/);

    const titulo = fixture.nativeElement.querySelector('#detalle-pedido-titulo') as HTMLElement;
    expect(titulo.textContent).toContain('42');
    expect(fixture.nativeElement.querySelector('time[datetime="2026-07-24"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Cantidad 2"]')?.textContent).toContain(
      '2×',
    );
  });

  it('comunica la carga como estado ocupado y oculta el contenido anterior', async () => {
    fixture.componentRef.setInput('pedido', crearDetallePedido());
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const contenedor = fixture.nativeElement.querySelector('.detalle-pedido') as HTMLElement;
    const estado = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(contenedor.getAttribute('aria-busy')).toBe('true');
    expect(estado.textContent).toContain('Consultando la información completa');
    expect(textoNormalizado()).not.toContain('Box aniversario');
  });

  it('muestra un error accesible y emite el reintento sin perder el contexto del listado', async () => {
    const emitirReintento = vi.spyOn(component.reintentar, 'emit');
    fixture.componentRef.setInput('mensajeError', 'No se pudo consultar este pedido.');
    fixture.detectChanges();
    await fixture.whenStable();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alerta.textContent).toContain('No se pudo consultar este pedido.');
    expect(alerta.textContent).toContain('El listado se mantiene disponible');

    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button',
    );
    const boton = [...botones].find((elemento) =>
      elemento.textContent?.includes('Reintentar detalle'),
    );
    expect(boton).toBeTruthy();
    boton?.click();

    expect(emitirReintento).toHaveBeenCalledOnce();
  });

  it('presenta un estado vacío y permite ocultar el cierre cuando no hay selección', async () => {
    fixture.componentRef.setInput('mostrarCerrar', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textoNormalizado()).toContain('Selecciona un pedido para revisar su información');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Cerrar detalle del pedido"]'),
    ).toBeNull();
  });

  function textoNormalizado(): string {
    return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ').trim();
  }
});

function crearDetallePedido(): PedidoRecibidoDetalle {
  return {
    idPedido: 42,
    correoCliente: 'cliente@regalia.test',
    idTienda: 10,
    nombreTienda: 'Detalles Aurora',
    fechaEntrega: '2026-07-24',
    estadoPedido: 'RESERVADO',
    total: 150,
    montoPagado: 80,
    saldoPendiente: 70,
    cantidadItems: 2,
    fechaCreacion: '2026-07-20T10:30:00',
    tipoEntrega: 'Recojo en tienda',
    observacion: 'Coordinar dedicatoria por WhatsApp',
    estado: true,
    fechaActualizacion: '2026-07-20T11:00:00',
    productos: [
      {
        idDetallePedido: 1,
        idProducto: 7,
        nombreProducto: 'Box aniversario',
        cantidad: 2,
        precioUnitario: 75,
        subtotal: 150,
      },
    ],
    pagos: [
      {
        idPago: 5,
        codigoTipoPago: 'ADELANTO',
        tipoPago: 'Adelanto',
        monto: 80,
        estadoPago: 'APROBADO',
        metodoPagoPasarela: 'Tarjeta',
        codigoTransaccion: 'TX-2026-001',
        fechaCreacion: '2026-07-20T10:32:00',
      },
    ],
  };
}
