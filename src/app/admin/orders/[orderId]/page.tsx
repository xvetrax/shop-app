"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types/order";
import { getOrderById } from "@/lib/db";

function fmtMoney(n: any) {
  const x = Number(n ?? 0);
  return `${x.toFixed(2)} €`;
}

function fmtDate(v: any) {
  try {
    const d =
      typeof v?.toDate === "function"
        ? v.toDate()
        : v instanceof Date
        ? v
        : typeof v === "string" || typeof v === "number"
        ? new Date(v)
        : null;

    if (!d || isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}

export default function AdminOrderDetailsPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(orderId);
        if (mounted) setOrder(data);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to fetch order.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const totals = useMemo(() => {
    if (!order) return null;

    const itemsTotal =
      typeof (order as any).itemsTotal === "number"
        ? (order as any).itemsTotal
        : (order.items ?? []).reduce((sum: number, it: any) => {
            const qty = Number(it?.quantity ?? it?.qty ?? 0);
            const unit = Number(it?.product?.price ?? it?.price ?? 0);
            return sum + qty * unit;
          }, 0);

    const shipping =
      typeof (order as any).shipping === "number" ? (order as any).shipping : 0;

    const total =
      typeof order.total === "number" ? order.total : Number(itemsTotal) + Number(shipping);

    return { itemsTotal, shipping, total };
  }, [order]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!order) return <p className="p-6">Order not found.</p>;

  const email = order.customer?.email ?? order.customerEmail ?? "-";
  const deliveryMethod = order.customer?.deliveryMethod ?? "-";
  const pickup = order.pickupPoint ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Order</h1>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="font-mono break-all">{order.id}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(order.id)}
              className="text-blue-600 hover:underline"
            >
              copy
            </button>
          </div>
        </div>

        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to orders
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
        <div className="flex flex-wrap gap-x-10 gap-y-2 text-sm">
          <div>
            <span className="text-neutral-500">Status:</span>{" "}
            <span className="font-medium capitalize">{order.status}</span>
          </div>
          <div>
            <span className="text-neutral-500">Created:</span>{" "}
            <span className="font-medium">{fmtDate(order.createdAt)}</span>
          </div>
          <div>
            <span className="text-neutral-500">Email:</span>{" "}
            <span className="font-medium">{email}</span>
          </div>
        </div>
      </div>

      {/* Customer / shipping */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
          <h2 className="font-semibold">Customer</h2>
          <p className="text-sm">
            <span className="text-neutral-500">Name:</span>{" "}
            {order.customer?.name ?? "-"}
          </p>
          <p className="text-sm">
            <span className="text-neutral-500">Phone:</span>{" "}
            {order.customer?.phone ?? "-"}
          </p>
          <p className="text-sm">
            <span className="text-neutral-500">Address:</span>{" "}
            {order.customer?.address ?? "-"}
          </p>
          <p className="text-sm">
            <span className="text-neutral-500">City:</span>{" "}
            {order.customer?.city ?? "-"}
          </p>
          <p className="text-sm">
            <span className="text-neutral-500">Postal code:</span>{" "}
            {order.customer?.postalCode ?? "-"}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
          <h2 className="font-semibold">Delivery</h2>
          <p className="text-sm">
            <span className="text-neutral-500">Method:</span>{" "}
            <span className="capitalize">{deliveryMethod}</span>
          </p>

          {deliveryMethod === "omniva" && (
            <>
              <p className="text-sm">
                <span className="text-neutral-500">Pickup point ID:</span>{" "}
                <span className="font-mono">{order.customer?.pickupPointId ?? "-"}</span>
              </p>

              {pickup ? (
                <div className="text-sm">
                  <span className="text-neutral-500">Pickup point:</span>{" "}
                  {pickup.name} — {pickup.address}
                  {pickup.city ? `, ${pickup.city}` : ""}
                </div>
              ) : null}
            </>
          )}

          {order.customer?.comment?.trim() ? (
            <div className="text-sm">
              <span className="text-neutral-500">Comment:</span>{" "}
              <span className="whitespace-pre-wrap">{order.customer.comment}</span>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No comment.</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold">Items</h2>

        <div className="divide-y">
          {(order.items ?? []).map((it: any, idx: number) => {
            const name = it?.product?.name ?? it?.name ?? "Item";
            const qty = Number(it?.quantity ?? it?.qty ?? 1);
            const unit = Number(it?.product?.price ?? it?.price ?? 0);
            const img = it?.product?.imageUrl ?? it?.product?.images?.[0] ?? null;

            return (
              <div key={`${idx}-${name}`} className="py-4 flex gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-md bg-neutral-100 shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={name} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-neutral-600">
                        Qty: <b>{qty}</b>
                      </p>

                      {it?.product?.id ? (
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                          Product ID: {it.product.id}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right text-sm">
                      <div className="text-neutral-600">{fmtMoney(unit)}</div>
                      <div className="font-semibold">{fmtMoney(unit * qty)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        {totals ? (
          <div className="border-t pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Items total</span>
              <span className="font-medium">{fmtMoney(totals.itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Shipping</span>
              <span className="font-medium">{fmtMoney(totals.shipping)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{fmtMoney(totals.total)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}