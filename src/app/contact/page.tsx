"use client";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErr("Užpildykite visus laukus.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Nepavyko išsiųsti žinutės.");
      }

      setOk("Žinutė išsiųsta! Ačiū 🙌");
      setName("");
      setEmail("");
      setMessage("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Nepavyko išsiųsti žinutės.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
      <p className="text-sm text-neutral-700">
        Turite idėjų, norite individualaus užsakymo ar klausimų dėl gaminių?
        Parašykite žinutę – atsakysiu kuo greičiau.
      </p>

      {ok && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {ok}
        </div>
      )}
      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            Vardas
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            El. paštas
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            Žinutė
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            rows={4}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-cocoa-600 px-8 py-3 text-sm font-medium text-white hover:bg-cocoa-700 disabled:opacity-50"
        >
          {loading ? "Siunčiama..." : "Siųsti"}
        </button>
      </form>
    </div>
  );
}