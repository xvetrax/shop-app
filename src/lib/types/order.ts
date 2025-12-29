import type { CartItem } from "./cart";

export type DeliveryMethod = "omniva" | "lp-express" | "pastomatai";
export type OrderStatus = "pending" | "paid" | "failed" | "shipped";

export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: DeliveryMethod;

  // Omniva paštomatas (privalomas tik jei deliveryMethod === "omniva")
  pickupPointId?: string;

  // Vartotojo komentaras dėl siuntimo / užsakymo
  comment?: string;
};

export interface Order {
  id: string;
  items: CartItem[];

  // Breakdown
  itemsTotal: number;
  shippingCost: number;
  total: number;

  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;

  customer: Customer;

  // backward compatibility
  customerEmail?: string;

  currency?: "EUR";
  paymentProvider?: "opay-mock" | string;

  // patogumui admin / email (nebūtina laikyti, bet ok jei laikysi)
  pickupPoint?: {
    id: string;
    name: string;
    address: string;
    city?: string;
  } | null;
}