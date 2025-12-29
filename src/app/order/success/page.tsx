// src/app/order/success/page.tsx
import { Suspense } from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = searchParams?.orderId ?? "";

  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-20">Loading...</div>}>
      <OrderSuccessClient orderId={orderId} />
    </Suspense>
  );
}