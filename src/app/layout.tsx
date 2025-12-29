import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProviderWrapper } from "@/components/providers/CartProviderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "CraftBox | Vienetiniai dekoro objektai",
  description: "Rankų darbo 3D spausdinti dekoro elementai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt">
      <body className="min-h-screen bg-sand-50 text-neutral-900 flex flex-col">
        <AuthProvider>
          <CartProviderWrapper>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
