import {
  StoreCategory,
  StoreOrderRecord,
  StoreProductRecord,
  getEffectiveProductPrice,
} from '../types/store';

export interface ProductSalesAggregate {
  unitsSold: number;
  paidOrdersCount: number;
  lastPaidAtMs?: number;
}

export interface ShowcaseRankSignal {
  rank: number;
  bestSeller: boolean;
}

export type ShowcaseRankingInput = Partial<ProductSalesAggregate> &
  Partial<ShowcaseRankSignal>;

export interface ShowcaseSlideItem {
  product: StoreProductRecord;
  categoryName: string;
  effectivePrice: number;
  hasDiscount: boolean;
  isBestSeller: boolean;
  rank: number;
}

/**
 * Only genuinely paid/verified orders count toward product sales rankings.
 * Pending, Payment Link Sent, Submitted, Rejected, failed, and refunded orders
 * are strictly excluded.
 */
export function isOrderEligiblePaidSale(
  order: Pick<StoreOrderRecord, 'status' | 'paymentStatus'>
): boolean {
  if (order.status === 'failed' || order.status === 'refunded') {
    return false;
  }
  if (
    order.paymentStatus === 'Pending' ||
    order.paymentStatus === 'Payment Link Sent' ||
    order.paymentStatus === 'Submitted' ||
    order.paymentStatus === 'Rejected'
  ) {
    return false;
  }

  return (
    order.status === 'paid' ||
    order.paymentStatus === 'Paid' ||
    order.paymentStatus === 'Verified'
  );
}

/**
 * Computes exact sales quantities and paid order counts per productId
 * from completed/paid orders only. Stored strictly in admin-only /productSales.
 */
export function computeProductSalesFromOrders(
  orders: StoreOrderRecord[]
): Record<string, ProductSalesAggregate> {
  const stats: Record<string, ProductSalesAggregate> = {};

  for (const order of orders) {
    if (!isOrderEligiblePaidSale(order)) {
      continue;
    }

    const quantity = Math.max(
      1,
      Math.floor(Number.isFinite(Number(order.quantity)) ? Number(order.quantity) : 1)
    );

    const rawIds =
      Array.isArray(order.productIds) && order.productIds.length > 0
        ? order.productIds
        : [order.productId];
    const uniqueIds = Array.from(
      new Set(rawIds.map((id) => String(id || '').trim()).filter(Boolean))
    );

    const paidTimeSource = order.verifiedAt || order.updatedAt || order.createdAt;
    const paidMs = paidTimeSource ? new Date(paidTimeSource).getTime() : 0;

    for (const productId of uniqueIds) {
      const current = stats[productId] || {
        unitsSold: 0,
        paidOrdersCount: 0,
        lastPaidAtMs: 0,
      };
      current.unitsSold += quantity;
      current.paidOrdersCount += 1;
      if (Number.isFinite(paidMs) && paidMs > (current.lastPaidAtMs || 0)) {
        current.lastPaidAtMs = paidMs;
      }
      stats[productId] = current;
    }
  }

  return stats;
}

/**
 * Converts exact admin sales aggregates into minimal, non-sensitive public ranking
 * projections ({ productId, rank, bestSeller: true }) with zero unitsSold or revenue data.
 */
export function computeShowcaseRanksFromSales(
  salesByProduct: Record<string, ProductSalesAggregate>
): Array<{ productId: string; rank: number; bestSeller: true }> {
  const entries = Object.entries(salesByProduct).filter(
    ([productId, agg]) => Boolean(productId) && agg.unitsSold > 0
  );

  entries.sort((a, b) => {
    const [, aggA] = a;
    const [, aggB] = b;
    if (aggB.unitsSold !== aggA.unitsSold) {
      return aggB.unitsSold - aggA.unitsSold;
    }
    if (aggB.paidOrdersCount !== aggA.paidOrdersCount) {
      return aggB.paidOrdersCount - aggA.paidOrdersCount;
    }
    const msA = aggA.lastPaidAtMs || 0;
    const msB = aggB.lastPaidAtMs || 0;
    if (msB !== msA) {
      return msB - msA;
    }
    return a[0].localeCompare(b[0]);
  });

  return entries.map(([productId], idx) => ({
    productId,
    rank: idx + 1,
    bestSeller: true as const,
  }));
}

/**
 * Selects up to `limit` (default 5) published products for the homepage showcase:
 * - Only `status === 'published'` products are eligible.
 * - Accepts either public ShowcaseRankSignal ({ rank, bestSeller }) or exact ProductSalesAggregate.
 * - `isBestSeller` is true ONLY for products with verified paid sales (`bestSeller === true` or `unitsSold > 0`).
 * - When no published products have paid sales yet, falls back cleanly to latest published
 *   products with `isBestSeller: false` on every slide.
 */
export function rankShowcaseProducts(
  products: StoreProductRecord[],
  categories: StoreCategory[],
  rankingSignals: Record<string, ShowcaseRankingInput>,
  limit = 5
): ShowcaseSlideItem[] {
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const published = products.filter((p) => p.status === 'published');
  if (published.length === 0) {
    return [];
  }

  const enriched = published.map((product) => {
    const sig = rankingSignals[product.id];
    const unitsSold = typeof sig?.unitsSold === 'number' && sig.unitsSold > 0 ? sig.unitsSold : 0;
    const paidOrdersCount =
      typeof sig?.paidOrdersCount === 'number' && sig.paidOrdersCount > 0
        ? sig.paidOrdersCount
        : 0;
    const lastPaidAtMs = typeof sig?.lastPaidAtMs === 'number' ? sig.lastPaidAtMs : 0;
    const isBestSeller = sig?.bestSeller === true || unitsSold > 0;
    const rankSignal =
      typeof sig?.rank === 'number' && sig.rank >= 1
        ? sig.rank
        : Number.MAX_SAFE_INTEGER;
    const createdMs = product.createdAt ? new Date(product.createdAt).getTime() : 0;
    const effectivePrice = getEffectiveProductPrice(product);
    const hasDiscount =
      typeof product.salePrice === 'number' &&
      product.salePrice >= 0 &&
      product.salePrice < product.regularPrice;

    return {
      product,
      categoryName: categoryNameById.get(product.categoryId) || 'Digital Store',
      effectivePrice,
      hasDiscount,
      unitsSold,
      paidOrdersCount,
      lastPaidAtMs: Number.isFinite(lastPaidAtMs) ? lastPaidAtMs : 0,
      rankSignal,
      createdMs: Number.isFinite(createdMs) ? createdMs : 0,
      isBestSeller,
    };
  });

  enriched.sort((a, b) => {
    if (a.isBestSeller !== b.isBestSeller) {
      return a.isBestSeller ? -1 : 1;
    }
    if (a.isBestSeller && b.isBestSeller) {
      if (a.rankSignal !== b.rankSignal) {
        return a.rankSignal - b.rankSignal;
      }
      if (b.unitsSold !== a.unitsSold) {
        return b.unitsSold - a.unitsSold;
      }
      if (b.paidOrdersCount !== a.paidOrdersCount) {
        return b.paidOrdersCount - a.paidOrdersCount;
      }
      if (b.lastPaidAtMs !== a.lastPaidAtMs) {
        return b.lastPaidAtMs - a.lastPaidAtMs;
      }
    }
    if (b.createdMs !== a.createdMs) {
      return b.createdMs - a.createdMs;
    }
    if (a.product.featured !== b.product.featured) {
      return a.product.featured ? -1 : 1;
    }
    return a.product.name.localeCompare(b.product.name);
  });

  return enriched.slice(0, Math.max(1, limit)).map((item, idx) => ({
    product: item.product,
    categoryName: item.categoryName,
    effectivePrice: item.effectivePrice,
    hasDiscount: item.hasDiscount,
    isBestSeller: item.isBestSeller,
    rank: idx + 1,
  }));
}
