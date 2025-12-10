import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-sand-100 shadow-sm aspect-[4/3]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-neutral-500">{product.category}</p>
        <h3 className="text-base font-medium group-hover:text-cocoa-700">
          {product.name}
        </h3>
        <p className="text-sm font-semibold">{product.price.toFixed(2)} €</p>
      </div>
    </Link>
  );
}
