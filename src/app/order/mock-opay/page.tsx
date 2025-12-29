// src/app/order/mock-opay/page.tsx
import { Suspense } from "react";
import MockOpayClient from "./MockOpayClient";

export default function MockOpayPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = searchParams?.orderId ?? "";

  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-6 py-10">Loading...</div>}>
      <MockOpayClient orderId={orderId} />
    </Suspense>
  );
}