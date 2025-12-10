export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
      <p className="text-sm text-neutral-700">
        Turite idėjų, norite individualaus užsakymo ar klausimų dėl gaminių?
        Parašykite žinutę – atsakysiu kuo greičiau.
      </p>
      <form className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            Vardas
          </label>
          <input
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            El. paštas
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-neutral-600">
            Žinutė
          </label>
          <textarea
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-cocoa-600"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-cocoa-600 px-8 py-3 text-sm font-medium text-white hover:bg-cocoa-700"
        >
          Siųsti
        </button>
      </form>
    </div>
  );
}
