"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/types/order";
import { getOrders, updateOrderStatus } from "@/lib/db";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // tik vienai eilutei rodom "updating"
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError("Failed to fetch orders.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) {
      return;
    }

    try {
      setError(null);
      setUpdatingId(orderId);

      await updateOrderStatus(orderId, newStatus);

      // optimistinis update UI (kad iškart matytųsi "Shipped")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // persikraunam iš DB (kad atsinaujintų visos detalės)
      await fetchOrders();
    } catch (err) {
      setError("Failed to update order status.");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedOrders = useMemo(() => {
    // naujausi viršuje
    return [...orders].sort((a: any, b: any) => {
      const da = (a?.createdAt?.toDate?.() ?? a?.createdAt) as any;
      const db = (b?.createdAt?.toDate?.() ?? b?.createdAt) as any;
      return new Date(db).getTime() - new Date(da).getTime();
    });
  }, [orders]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn("Clipboard copy failed", e);
    }
  };

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Orders</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-sm">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Order</th>
              <th className="py-2 px-4 border-b text-left">Customer</th>
              <th className="py-2 px-4 border-b text-left">Totals</th>
              <th className="py-2 px-4 border-b text-left">Delivery</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Created</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedOrders.map((order) => {
              const email = order.customer?.email ?? order.customerEmail ?? "-";

              const itemsTotal =
                typeof (order as any).itemsTotal === "number" ? (order as any).itemsTotal : null;
              const shipping =
                typeof (order as any).shipping === "number" ? (order as any).shipping : null;

              const total = order.total ?? 0;

              const pickup = order.pickupPoint ?? null;
              const deliveryMethod = order.customer?.deliveryMethod ?? "-";
              const comment = order.customer?.comment?.trim();

              const isUpdating = updatingId === order.id;
              const isShipped = order.status === "shipped";

              return (
                <tr key={order.id} className="align-top">
                  <td className="py-2 px-4 border-b">
                    <div className="flex flex-col gap-2">
                      <div className="font-mono text-xs break-all">{order.id}</div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => copyText(order.id)}
                          className="text-xs text-blue-600 hover:underline"
                          title="Copy order ID"
                        >
                          copy
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-4 border-b">
                    <div className="font-medium">{email}</div>
                    <div className="text-neutral-500">{order.customer?.name ?? ""}</div>
                  </td>

                  <td className="py-2 px-4 border-b">
                    {itemsTotal !== null && shipping !== null ? (
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-neutral-500">Items</span>
                          <span className="font-medium">{fmtMoney(itemsTotal)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-neutral-500">Shipping</span>
                          <span className="font-medium">{fmtMoney(shipping)}</span>
                        </div>
                        <div className="border-t pt-1 flex justify-between gap-4">
                          <span className="font-semibold">Total</span>
                          <span className="font-semibold">{fmtMoney(total)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold">{fmtMoney(total)}</div>
                    )}
                  </td>

                  <td className="py-2 px-4 border-b">
                    <div className="capitalize">{deliveryMethod}</div>

                    {pickup ? (
                      <div className="mt-1 text-xs text-neutral-700">
                        <div className="font-medium">{pickup.name}</div>
                        <div className="text-neutral-500">
                          {pickup.address}
                          {pickup.city ? `, ${pickup.city}` : ""}
                        </div>
                        <div className="text-neutral-400">ID: {pickup.id}</div>
                      </div>
                    ) : null}

                    {comment ? (
                      <div className="mt-2 text-xs">
                        <div className="text-neutral-500">Comment:</div>
                        <div className="rounded bg-neutral-50 border border-neutral-200 p-2">
                          {comment}
                        </div>
                      </div>
                    ) : null}
                  </td>

                  <td className="py-2 px-4 border-b">
                    {isShipped ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Shipped
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                        {order.status}
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-4 border-b text-neutral-600">{fmtDate(order.createdAt)}</td>

                <td className="py-2 px-4 border-b">
  <div className="flex flex-wrap gap-2">
    <Link
      href={`/admin/orders/${order.id}`}
      className="inline-flex items-center rounded bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-200"
    >
      View
    </Link>

    {isShipped ? (
      <span className="text-xs text-neutral-500">—</span>
    ) : (
      <button
        onClick={() => handleStatusChange(order.id, "shipped")}
        disabled={isUpdating}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs"
      >
        {isUpdating ? "Updating..." : "Mark as shipped"}
      </button>
    )}
  </div>
</td>
                </tr>
              );
            })}

            {sortedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}