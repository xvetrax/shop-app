import { NextResponse } from "next/server";

export type OmnivaPickupPoint = {
  id: string;
  name: string;
  address: string;
  city?: string;
};

// Omniva public locations list (LT ir kitos šalys viename faile)
const OMNIVA_LOCATIONS_URL = "https://www.omniva.lt/locations.json";

export async function GET() {
  try {
    const res = await fetch(OMNIVA_LOCATIONS_URL, {
      // Vercel cache (galima pakoreguoti)
      next: { revalidate: 60 * 60 }, // 1 val.
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Omniva locations fetch failed (${res.status})` },
        { status: 502 }
      );
    }

    const raw = (await res.json()) as any[];

    // Filtruojam: LT + paštomatai (TYPE "0")
    const points: OmnivaPickupPoint[] = raw
      .filter((x) => x?.A0_NAME === "LT" && String(x?.TYPE) === "0")
      .map((x) => ({
        id: String(x.ZIP ?? ""),              // Omniva čia naudoja ZIP kaip ID
        name: String(x.NAME ?? "Omniva"),
        address: buildAddress(x),
        city: String(x.A3_NAME ?? x.A2_NAME ?? ""),
      }))
      .filter((p) => p.id && p.name && p.address);

    return NextResponse.json(
      { success: true, points },
      {
        headers: {
          // papildomai: CDN cache
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildAddress(x: any) {
  // A5..A8 dažnai yra gatvė/namas ir pan.
  const parts = [
    x?.A5_NAME, // street
    x?.A6_NAME,
    x?.A7_NAME, // house nr
    x?.A8_NAME,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  // jei tuščia, fallback į NAME (kai kuriuose įrašuose adreso laukai nepilni)
  return parts.length ? parts.join(" ") : String(x?.NAME ?? "");
}