import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { OrderApiDto } from '../../orders/models/order-api.model';
import { AdminOrderApiService } from '../../orders/services/admin-order-api.service';
import { AdminCatalogGroup } from '../models/admin-catalog-api.model';
import { AdminSellerApiDto } from '../models/admin-seller-api.model';
import { AdminStoreApiDto } from '../models/admin-store-api.model';
import { AdminUserApiDto } from '../models/admin-user-api.model';
import {
  AdminCatalogSummary,
  AdminOrderSummary,
  AdminSellerSummary,
  AdminStoreSummary,
  AdminSummary,
  AdminSummaryAlert,
  AdminUserSummary,
} from '../models/admin-summary.model';
import { RegaliaAdminCatalogApiService } from './regalia-admin-catalog-api.service';
import { RegaliaAdminSellerApiService } from './regalia-admin-seller-api.service';
import { RegaliaAdminStoreApiService } from './regalia-admin-store-api.service';
import { RegaliaAdminUserApiService } from './regalia-admin-user-api.service';

@Injectable({ providedIn: 'root' })
export class RegaliaAdminSummaryApiService {
  private readonly storeApi = inject(RegaliaAdminStoreApiService);
  private readonly sellerApi = inject(RegaliaAdminSellerApiService);
  private readonly userApi = inject(RegaliaAdminUserApiService);
  private readonly catalogApi = inject(RegaliaAdminCatalogApiService);
  private readonly orderApi = inject(AdminOrderApiService);

  getSummary(): Observable<AdminSummary> {
    return forkJoin({
      stores: this.storeApi.getStores(),
      orders: this.orderApi.getOrders({ page: 0, size: 50, sort: 'fechaCreacion,desc' }),
      sellers: this.sellerApi.getSellers(),
      users: this.userApi.getUsers({ estado: 'TODOS' }),
      catalogs: this.catalogApi.getCatalogs(),
    }).pipe(
      map(({ stores, orders, sellers, users, catalogs }) => {
        const storeSummary = this.buildStoreSummary(stores);
        const orderSummary = this.buildOrderSummary(orders.contenido, orders.totalElementos);
        const sellerSummary = this.buildSellerSummary(sellers);
        const userSummary = this.buildUserSummary(users);
        const catalogSummary = this.buildCatalogSummary(catalogs);

        return {
          stores: storeSummary,
          orders: orderSummary,
          sellers: sellerSummary,
          users: userSummary,
          catalogs: catalogSummary,
          alerts: this.buildAlerts(storeSummary, orderSummary, sellerSummary, userSummary, catalogSummary),
        };
      }),
    );
  }

  private buildStoreSummary(stores: AdminStoreApiDto[]): AdminStoreSummary {
    return {
      total: stores.length,
      active: stores.filter((store) => Boolean(store.estado)).length,
      inactive: stores.filter((store) => !store.estado).length,
      pending: stores.filter((store) => store.estadoRevision === 'PENDIENTE').length,
      approved: stores.filter((store) => store.estadoRevision === 'APROBADA').length,
      observed: stores.filter((store) => store.estadoRevision === 'OBSERVADA').length,
      rejected: stores.filter((store) => store.estadoRevision === 'RECHAZADA').length,
    };
  }

  private buildOrderSummary(orders: OrderApiDto[], totalElements: number): AdminOrderSummary {
    const paid = orders.filter((order) => this.toNumber(order.saldoPendiente) <= 0).length;
    const pendingBalance = orders.filter((order) => this.toNumber(order.saldoPendiente) > 0).length;
    const totalPaid = orders.reduce((sum, order) => sum + this.toNumber(order.montoPagado), 0);

    return {
      total: totalElements,
      active: orders.filter((order) => Boolean(order.estado)).length,
      inactive: orders.filter((order) => !order.estado).length,
      paid,
      pendingBalance,
      totalPaid,
    };
  }

  private buildSellerSummary(sellers: AdminSellerApiDto[]): AdminSellerSummary {
    return {
      total: sellers.length,
      active: sellers.filter((seller) => Boolean(seller.estado)).length,
      inactive: sellers.filter((seller) => !seller.estado).length,
      verified: sellers.filter((seller) => Boolean(seller.vendedorVerificado)).length,
      unverified: sellers.filter((seller) => !seller.vendedorVerificado).length,
      withStores: sellers.filter((seller) => this.toNumber(seller.cantidadTiendasTotales) > 0).length,
    };
  }

  private buildUserSummary(users: AdminUserApiDto[]): AdminUserSummary {
    return {
      total: users.length,
      active: users.filter((user) => Boolean(user.estado)).length,
      inactive: users.filter((user) => !user.estado).length,
      withPhone: users.filter((user) => Boolean(user.telefono?.trim())).length,
      withoutPhone: users.filter((user) => !user.telefono?.trim()).length,
    };
  }

  private buildCatalogSummary(catalogs: AdminCatalogGroup[]): AdminCatalogSummary {
    const items = catalogs.flatMap((catalog) => catalog.items);

    return {
      total: catalogs.length,
      groups: catalogs.length,
      items: items.length,
      active: items.filter((item) => Boolean(item.estado)).length,
      inactive: items.filter((item) => !item.estado).length,
    };
  }

  private buildAlerts(
    stores: AdminStoreSummary,
    orders: AdminOrderSummary,
    sellers: AdminSellerSummary,
    users: AdminUserSummary,
    catalogs: AdminCatalogSummary,
  ): AdminSummaryAlert[] {
    const alerts: AdminSummaryAlert[] = [];

    if (stores.pending > 0) {
      alerts.push({
        title: `${stores.pending} tienda(s) pendientes de revision`,
        meta: 'Requieren decision administrativa antes de ganar visibilidad publica completa.',
        status: 'Revisar',
        tone: 'warning',
        route: '/admin/tiendas',
      });
    }

    if (orders.pendingBalance > 0) {
      alerts.push({
        title: `${orders.pendingBalance} pedido(s) con saldo pendiente`,
        meta: 'Conviene dar seguimiento a reservas que todavia no completan el pago.',
        status: 'Seguimiento',
        tone: 'warning',
        route: '/admin/pedidos',
      });
    }

    if (sellers.unverified > 0) {
      alerts.push({
        title: `${sellers.unverified} vendedor(es) sin verificar`,
        meta: 'Los perfiles comerciales existen, pero aun necesitan control operativo.',
        status: 'Validar',
        tone: 'neutral',
        route: '/admin/vendedores',
      });
    }

    if (users.inactive && users.inactive > 0) {
      alerts.push({
        title: `${users.inactive} usuario(s) inactivos`,
        meta: 'Cuentas gestionables fuera del flujo normal de acceso.',
        status: 'Gestionar',
        tone: 'neutral',
        route: '/admin/usuarios',
      });
    }

    if (catalogs.inactive && catalogs.inactive > 0) {
      alerts.push({
        title: `${catalogs.inactive} registro(s) de catalogo inactivos`,
        meta: 'Datos maestros desactivados que pueden afectar configuracion futura.',
        status: 'Consultar',
        tone: 'neutral',
        route: '/admin/catalogos',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: 'Operacion administrativa sin alertas criticas',
        meta: 'Los modulos conectados no reportan pendientes principales.',
        status: 'Estable',
        tone: 'success',
        route: '/admin/resumen',
      });
    }

    return alerts;
  }

  private toNumber(value: number | null): number {
    return Number(value ?? 0);
  }
}
