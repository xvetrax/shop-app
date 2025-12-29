"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon } from "@/components/cart/CartIcon";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 bg-sand-50/90 backdrop-blur border-b border-neutral-200">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-semibold tracking-tight text-cocoa-700">
          CraftBox
        </Link>
        <div className="flex items-center gap-8 text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  active
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <CartIcon />
        </div>
      </nav>
    </header>
  );
}
