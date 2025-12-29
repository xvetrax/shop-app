import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { AddToCartButton } from "@/components/products/AddToCartButton";

type Props = { params: { slug: string } };

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);

  if (!product) return notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-start">
        <div className="relative overflow-hidden rounded-3xl bg-sand-100 shadow-md aspect-[4/3]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight">{product.name}</h1>
            <div className="h-[2px] w-16 bg-neutral-900" />
            <p className="text-lg font-semibold">{product.price.toFixed(2)} €</p>
          </div>

          <p className="text-sm leading-relaxed text-neutral-700">{product.description}</p>

          {product.dimensions && (
            <p className="text-xs text-neutral-500">Dimensions: {product.dimensions}</p>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Color</p>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <span
                    key={c}
                    className="h-5 w-5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          <AddToCartButton product={product} className="mt-4 w-full md:w-auto" />
        </div>
      </div>
    </div>
  );
}