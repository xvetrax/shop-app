// src/lib/products.ts
import { getActiveProducts, getActiveProductBySlug } from "@/lib/db";

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  dimensions?: string;
  colors?: string[];
};

function toUiProduct(p: any): Product {
  return {
    slug: p.slug,
    name: p.name,
    price: Number(p.price ?? 0),
    category: p.category ?? "Objects",
    description: p.description ?? "",
    imageUrl: (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "/images/image1.jpg",
    dimensions: p.dimensions,
    colors: p.colors,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const items = await getActiveProducts(); // ✅ tik aktyvūs
  return items.map(toUiProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const items = await getActiveProducts(); // ✅ tik aktyvūs
  return items.slice(0, 3).map(toUiProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await getActiveProductBySlug(slug); // ✅ tik aktyvus
  return p ? toUiProduct(p) : null;
}