"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MockOpayClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!orderId) {
    return <div className="mx-auto max-w-xl px-6 py-10">Missing orderId</div>;
  }

  async function finish(status: "paid" | "failed") {
    setLoading(true);

    const res = await fetch("/api/mock-opay-finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });

    // saugiau: jei API grąžins ne JSON, nenulūš
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok || !data?.success) {
      setLoading(false);
      alert(data?.error || "Failed");
      return;
    }

    router.replace(
      status === "paid"
        ? `/order/success?orderId=${encodeURIComponent(orderId)}`
        : `/order/failure?orderId=${encodeURIComponent(orderId)}`
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Mock Opay</h1>
      <p className="text-neutral-600">
        Čia testinis apmokėjimas. Pasirink rezultatą orderiui: <b>{orderId}</b>
      </p>

      <div className="flex gap-3">
        <button
          disabled={loading}
          onClick={() => finish("paid")}
          className="rounded-md bg-green-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "..." : "Pay (Success)"}
        </button>

        <button
          disabled={loading}
          onClick={() => finish("failed")}
          className="rounded-md bg-red-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "..." : "Fail Payment"}
        </button>
      </div>
    </div>
  );
}