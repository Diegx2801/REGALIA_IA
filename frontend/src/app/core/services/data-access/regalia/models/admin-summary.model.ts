export interface AdminSummaryMetricGroup {
  total: number;
  active?: number;
  inactive?: number;
}

export interface AdminStoreSummary extends AdminSummaryMetricGroup {
  pending: number;
  approved: number;
  observed: number;
  rejected: number;
}

export interface AdminOrderSummary extends AdminSummaryMetricGroup {
  paid: number;
  pendingBalance: number;
  totalPaid: number;
}

export interface AdminSellerSummary extends AdminSummaryMetricGroup {
  verified: number;
  unverified: number;
  withStores: number;
}

export interface AdminUserSummary extends AdminSummaryMetricGroup {
  withPhone: number;
  withoutPhone: number;
}

export interface AdminCatalogSummary extends AdminSummaryMetricGroup {
  groups: number;
  items: number;
}

export interface AdminSummaryAlert {
  title: string;
  meta: string;
  status: string;
  tone: 'neutral' | 'success' | 'warning';
  route: string;
}

export interface AdminSummary {
  stores: AdminStoreSummary;
  orders: AdminOrderSummary;
  sellers: AdminSellerSummary;
  users: AdminUserSummary;
  catalogs: AdminCatalogSummary;
  alerts: AdminSummaryAlert[];
}
