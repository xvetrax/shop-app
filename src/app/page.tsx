import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-16">
      <section className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] items-center">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-500">
            One of a kind · 3D printed
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Minimalist décor,
            <br />
            <span className="text-cocoa-700">printed in 3D</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
            Vienetiniai 3D spausdinti objektai namams: vazos, kalendoriai ir
            interjero detalės, gaminamos mažomis serijomis ir baigiamos rankomis.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-md bg-cocoa-600 px-8 py-3 text-sm font-medium text-white hover:bg-cocoa-700 transition-colors"
            >
              Peržiūrėti produktus
            </Link>
            <Link
              href="/contact"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              Individualus užsakymas →
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-sand-100 shadow-lg aspect-[4/3]">
          <Image
            src="/images/image1.jpg"
            alt="Dekoro pavyzdys"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pasirinkti gaminiai</h2>
          <Link
            href="/products"
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            Žiūrėti visus
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
