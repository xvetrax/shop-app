"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/types/order";
import { getOrderById } from "@/lib/db";
import { Button } from "@/components/ui/Button";

function fmtMoney(n: any) {
  const x = Number(n ?? 0);
  return `${x.toFixed(2)} €`;
}

function fmtDate(d: any) {
  try {
    const date =
      d?.toDate?.() instanceof Date ? d.toDate() : d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString();
  } catch {
    return "-";
  }
}

export default function AdminOrderDetailsClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const o = await getOrderById(orderId);
        setOrder(o);
      } catch (e) {
        console.error(e);
        setError("Failed to load order.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [orderId]);

  const totals = useMemo(() => {
    if (!order) return null;

    const itemsTotal =
      typeof (order as any).itemsTotal === "number"
        ? (order as any).itemsTotal
        : order.items?.reduce((sum: number, i: any) => {
            const price = Number(i?.product?.price ?? i?.price ?? 0);
            const qty = Number(i?.quantity ?? i?.qty ?? 0);
            return sum + price * qty;
          }, 0) ?? 0;

    const shipping =
      typeof (order as any).shipping === "number" ? (order as any).shipping : 0;

    const total = typeof order.total === "number" ? order.total : itemsTotal + shipping;

    return { itemsTotal, shipping, total };
  }, [order]);

  if (loading) return <p className="p-4">Loading order...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!order) return <p className="p-4">Order not found.</p>;

  const email = order.customer?.email ?? order.customerEmail ?? "-";
  const name = order.customer?.name ?? "-";
  const phone = order.customer?.phone ?? "-";
  const deliveryMethod = order.customer?.deliveryMethod ?? "-";
  const comment = order.customer?.comment?.trim();
  const pickup = order.pickupPoint ?? null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <div className="mt-1 font-mono text-xs text-neutral-600 break-all">{order.id}</div>
        </div>

       <Link href="/admin/orders">
  <Button className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200">
    ← Back
  </Button>
</Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs text-neutral-500">Status</div>
          <div className="mt-1 text-sm font-semibold capitalize">{order.status}</div>
          <div className="mt-3 text-xs text-neutral-500">Created</div>
          <div className="mt-1 text-sm">{fmtDate(order.createdAt)}</div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs text-neutral-500">Customer</div>
          <div className="mt-1 text-sm font-semibold">{name}</div>
          <div className="mt-1 text-sm">{email}</div>
          <div className="mt-1 text-sm">{phone}</div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-xs text-neutral-500">Totals</div>
          {totals && (
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Items</span>
                <span className="font-medium">{fmtMoney(totals.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-medium">{fmtMoney(totals.shipping)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{fmtMoney(totals.total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Delivery</h2>
        <div className="text-sm">
          <span className="text-neutral-600">Method: </span>
          <span className="capitalize font-medium">{deliveryMethod}</span>
        </div>

        {pickup ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <div className="font-semibold">{pickup.name}</div>
            <div className="text-neutral-600">
              {pickup.address}
              {pickup.city ? `, ${pickup.city}` : ""}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Pickup ID: {pickup.id}</div>
          </div>
        ) : null}

        {comment ? (
          <div>
            <div className="text-xs text-neutral-500 mb-1">Customer comment</div>
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm whitespace-pre-wrap">
              {comment}
            </div>
          </div>
        ) : null}
      </div>

      {/* Items */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>

        <div className="space-y-3">
          {(order.items ?? []).map((it: any, idx: number) => {
            const qty = Number(it?.quantity ?? it?.qty ?? 0);
            const product = it?.product ?? null;
            const name = product?.name ?? it?.name ?? "Item";
            const price = Number(product?.price ?? it?.price ?? 0);
            const image = product?.images?.[0] ?? null;
            const line = qty * price;

            return (
              <div
                key={`${product?.slug ?? product?.id ?? name}-${idx}`}
                className="flex gap-4 rounded-md border border-neutral-200 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{name}</div>
                      {product?.id ? (
                        <div className="mt-0.5 font-mono text-xs text-neutral-500">
                          Product ID: {product.id}
                        </div>
                      ) : null}
                      {product?.slug ? (
                        <div className="mt-0.5 font-mono text-xs text-neutral-500">
                          Slug: {product.slug}
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right text-sm">
                      <div>
                        <span className="text-neutral-600">Qty: </span>
                        <span className="font-semibold">{qty}</span>
                      </div>
                      <div className="text-neutral-600">{fmtMoney(price)} / vnt.</div>
                      <div className="mt-1 font-semibold">{fmtMoney(line)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(order.items ?? []).length === 0 ? (
            <div className="text-sm text-neutral-500">No items.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}