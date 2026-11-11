import { Order, FinancialSummary, AuditLog } from '../types';

export const MOCK_ORDERS: Order[] = [];

export const MOCK_FINANCIAL_SUMMARY: FinancialSummary = {
  today_revenue: 0,
  today_transactions: 0,
  today_online_revenue: 0,
  today_instore_revenue: 0,
  today_aov: 0,
  month_revenue: 0,
  month_transactions: 0,
  month_online_revenue: 0,
  month_instore_revenue: 0,
  refunds_total: 0,
  net_revenue: 0,
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [];
