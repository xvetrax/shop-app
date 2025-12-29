import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { Product } from "./types/product";
import { Order, OrderStatus } from "./types/order";

const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");

// --------- HELPERS ----------
function toDateSafe(v: any): Date | undefined {
  // Firestore Timestamp turi .toDate()
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  return undefined;
}

// --------- ADMIN (requires auth + rules allow) ----------
export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(query(productsCollection, orderBy("createdAt", "desc")));
  return snapshot.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDateSafe(data.createdAt) ?? new Date(),
    } as Product;
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(productsCollection, where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const d = snapshot.docs[0];
  const data: any = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: toDateSafe(data.createdAt) ?? new Date(),
  } as Product;
}

export async function createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const newProductRef = await addDoc(productsCollection, {
    ...productData,
    createdAt: new Date(),
  });

  const newProductSnapshot = await getDoc(newProductRef);
  const data: any = newProductSnapshot.data();

  return {
    id: newProductRef.id,
    ...data,
    createdAt: toDateSafe(data?.createdAt) ?? new Date(),
  } as Product;
}

export async function updateProduct(
  productId: string,
  productData: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { ...productData });
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}

// --------- SHOP (public read, only active, matches your rules) ----------
export async function getActiveProducts(): Promise<Product[]> {
  const q = query(productsCollection, where("isActive", "==", true), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDateSafe(data.createdAt) ?? new Date(),
    } as Product;
  });
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const q = query(
    productsCollection,
    where("slug", "==", slug),
    where("isActive", "==", true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const d = snapshot.docs[0];
  const data: any = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: toDateSafe(data.createdAt) ?? new Date(),
  } as Product;
}

// --------- ORDERS ----------
export async function getOrders(): Promise<Order[]> {
  const snapshot = await getDocs(query(ordersCollection, orderBy("createdAt", "desc")));
  return snapshot.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toDateSafe(data.createdAt) ?? new Date(),
    } as Order;
  });
}

export async function createOrder(orderData: Omit<Order, "id" | "createdAt">): Promise<Order> {
  const newOrderRef = await addDoc(ordersCollection, {
    ...orderData,
    createdAt: new Date(),
  });

  const newOrderSnapshot = await getDoc(newOrderRef);
  const data: any = newOrderSnapshot.data();

  return {
    id: newOrderRef.id,
    ...data,
    createdAt: toDateSafe(data?.createdAt) ?? new Date(),
  } as Order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status });
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const ref = doc(db, "orders", orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data: any = snap.data();

  return {
    id: snap.id,
    ...data,
    createdAt: toDateSafe(data.createdAt) ?? new Date(),
    updatedAt: toDateSafe(data.updatedAt),
  } as Order;
}

