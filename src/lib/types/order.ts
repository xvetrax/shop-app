import type { CartItem } from "./cart";

export type DeliveryMethod = "omniva" | "lp-express" | "pastomatai";

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: DeliveryMethod;
};

export type Order = {
  id: string;
  items: CartItem[];
  customer: Customer;
  total: number;
  status: PaymentStatus;
  createdAt: string;
};

