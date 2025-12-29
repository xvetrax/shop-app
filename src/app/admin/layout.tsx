"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link"; // Import Link

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (user && !isAdmin && pathname !== "/admin/login") {
      router.push("/"); // Redirect non-admin authenticated users away from admin pages
    }
  }, [user, loading, isAdmin, pathname, router]);

  if (loading || (!user && pathname !== "/admin/login") || (user && !isAdmin && pathname !== "/admin/login")) {
    return <div className="flex flex-col items-center justify-center min-h-screen">Loading admin content...</div>; // Or a spinner
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-2">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <nav>
          <ul>
            <li>
              <Link href="/admin/products" className="block py-2 px-4 rounded hover:bg-gray-700">
                Products
              </Link>
            </li>
            <li>
              <Link href="/admin/orders" className="block py-2 px-4 rounded hover:bg-gray-700">
                Orders
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
