import type { DeliveryMethod } from "@/lib/types/order";

/**
 * Siuntimo kainos EUR
 * Galima lengvai plėsti ateityje
 */
export const SHIPPING_PRICES_EUR: Record<DeliveryMethod, number> = {
  omniva: 3.99,
  "lp-express": 4.49,
  pastomatai: 0, // jei nenaudosi – palik 0
};

/**
 * Grąžina siuntimo kainą pagal būdą
 */
export function getShippingPriceEUR(method: DeliveryMethod): number {
  return SHIPPING_PRICES_EUR[method] ?? 0;
}

/**
 * Helperis UI / validacijai
 */
export function requiresPickupPoint(method: DeliveryMethod): boolean {
  return method === "omniva";
}