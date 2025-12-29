"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartItem } from "@/components/cart/CartItem";
import { Button } from "@/components/ui/Button";
import {
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateRequired,
} from "@/lib/validation";
import type { DeliveryMethod } from "@/lib/types/order";

type OmnivaPickupPoint = {
  id: string;
  name: string;
  address: string;
  city?: string;
};

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: "omniva", label: "Omniva (paštomatas)" },
];

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function CheckoutPage() {
  const { items } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    deliveryMethod: "omniva" as DeliveryMethod,
    pickupPointId: "",
    comment: "",
  });

  // ✅ paštomatų paieška
  const [pickupSearch, setPickupSearch] = useState("");

  // ✅ paštomatai iš API
  const [pickupPoints, setPickupPoints] = useState<OmnivaPickupPoint[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupLoadError, setPickupLoadError] = useState<string | null>(null);

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <p className="text-neutral-600">Add some products to your cart before checkout.</p>
          <Link href="/products">
            <Button>Return to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ load pickup points from API
  useEffect(() => {
    const load = async () => {
      try {
        setPickupLoading(true);
        setPickupLoadError(null);

        const res = await fetch("/api/omniva/pickup-points", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load pickup points");
        }

        const points = (data?.points ?? []) as OmnivaPickupPoint[];
        setPickupPoints(points);
      } catch (e) {
        console.error(e);
        setPickupPoints([]);
        setPickupLoadError(e instanceof Error ? e.message : "Failed to load pickup points");
      } finally {
        setPickupLoading(false);
      }
    };

    load();
  }, []);

  const pickupPointOptions = useMemo(() => pickupPoints ?? [], [pickupPoints]);

  const filteredPickupPoints = useMemo(() => {
    const q = norm(pickupSearch);
    if (!q) return pickupPointOptions;

    return pickupPointOptions.filter((p) => {
      const hay = norm(`${p.name} ${p.address} ${p.city ?? ""} ${p.id}`);
      return hay.includes(q);
    });
  }, [pickupPointOptions, pickupSearch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "deliveryMethod") {
        const nextMethod = value as DeliveryMethod;
        return {
          ...prev,
          deliveryMethod: nextMethod,
          pickupPointId: nextMethod === "omniva" ? prev.pickupPointId : "",
        };
      }
      return { ...prev, [name]: value };
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.name)) newErrors.name = "Name is required";

    if (!validateRequired(formData.email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!validateRequired(formData.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid phone format (use +370 or 8XXXXXXXX)";
    }

    if (!validateRequired(formData.address)) newErrors.address = "Address is required";
    if (!validateRequired(formData.city)) newErrors.city = "City is required";

    if (!validateRequired(formData.postalCode)) {
      newErrors.postalCode = "Postal code is required";
    } else if (!validatePostalCode(formData.postalCode)) {
      newErrors.postalCode = "Invalid postal code (5 digits)";
    }

    if (formData.deliveryMethod === "omniva") {
      if (!validateRequired(formData.pickupPointId)) {
        newErrors.pickupPointId = "Please select an Omniva pickup point";
      }
      if (pickupLoadError) {
        newErrors.pickupPointId = "Pickup points are unavailable right now. Please try again.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const shippingCost = formData.deliveryMethod === "omniva" ? 3.99 : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
          <div className="space-y-6">
            <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Customer Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+370XXXXXXXX or 8XXXXXXXX"
                    required
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-neutral-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-neutral-700">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                    />
                    {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-neutral-700">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      maxLength={5}
                      required
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                    />
                    {errors.postalCode && (
                      <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="deliveryMethod" className="block text-sm font-medium text-neutral-700">
                    Delivery Method *
                  </label>
                  <div className="mt-2 space-y-2">
                    {DELIVERY_METHODS.map((method) => (
                      <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value={method.value}
                          checked={formData.deliveryMethod === method.value}
                          onChange={handleChange}
                          className="h-4 w-4 border-neutral-300 text-cocoa-600 focus:ring-cocoa-600"
                        />
                        <span className="text-sm">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ✅ Omniva pickup point + search */}
                {formData.deliveryMethod === "omniva" && (
                  <div className="space-y-2">
                    <label htmlFor="pickupPointId" className="block text-sm font-medium text-neutral-700">
                      Omniva pickup point *
                    </label>

                    <input
                      type="text"
                      value={pickupSearch}
                      onChange={(e) => setPickupSearch(e.target.value)}
                      placeholder="Start typing: city, address, name…"
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                      disabled={pickupLoading}
                    />

                    <select
                      id="pickupPointId"
                      name="pickupPointId"
                      value={formData.pickupPointId}
                      onChange={handleChange}
                      required
                      disabled={pickupLoading || !!pickupLoadError}
                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600 disabled:opacity-60"
                    >
                      <option value="" disabled>
                        {pickupLoading
                          ? "Loading pickup points…"
                          : pickupLoadError
                          ? "Pickup points unavailable"
                          : "Select pickup point"}
                      </option>

                      {!pickupLoading && !pickupLoadError ? (
                        filteredPickupPoints.length === 0 ? (
                          <option value="" disabled>
                            No results
                          </option>
                        ) : (
                          filteredPickupPoints.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.city ? `${p.city} — ` : ""}
                              {p.name} — {p.address}
                            </option>
                          ))
                        )
                      ) : null}
                    </select>

                    {pickupLoadError && (
                      <p className="text-xs text-red-600">
                        Failed to load pickup points. Please refresh and try again.
                      </p>
                    )}

                    {errors.pickupPointId && (
                      <p className="text-xs text-red-600">{errors.pickupPointId}</p>
                    )}

                    {!pickupLoading && !pickupLoadError && filteredPickupPoints.length > 0 && pickupSearch.trim() && (
                      <p className="text-xs text-neutral-500">
                        Showing {filteredPickupPoints.length} result(s)
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ Comment */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-neutral-700">
                    Comment (optional)
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-cocoa-600 focus:outline-none focus:ring-1 focus:ring-cocoa-600"
                    placeholder="Any notes about delivery, packaging, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="space-y-6">
              <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
                <h2 className="text-lg font-semibold">Order Items</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItem key={item.product.slug} item={item} />
                  ))}
                </div>
              </div>

              <CartSummary showShipping shippingCost={shippingCost} />

              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                  {errors.submit}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}