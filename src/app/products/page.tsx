import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Products</h1>
      <div className="grid gap-10 md:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}