// src/lib/types/order.ts
import type { CartItem } from "./cart";

export type DeliveryMethod = "omniva" | "lp-express" | "pastomatai";

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "shipped";

export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: DeliveryMethod;
};

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customer: Customer;              // ✅ vietoj customerEmail
  status: OrderStatus;
  currency: "EUR";                 // ✅ kad sutaptų su checkout route
  paymentProvider: string;         // ✅ pvz "opay-mock"
  createdAt: Date;
  updatedAt?: Date;
}