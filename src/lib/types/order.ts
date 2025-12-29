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
};

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;

  // ✅ naujas formatas (kaip rašai į Firestore dabar)
  customer: Customer;

  // ✅ paliekam dėl backward compatibility (jei turi senų orderių)
  customerEmail?: string;

  currency?: "EUR";
  paymentProvider?: "opay-mock" | string;
}