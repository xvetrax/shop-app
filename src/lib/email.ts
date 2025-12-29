import "server-only";
import { Resend } from "resend";

type PaidOrderEmailParams = {
  to: string;
  orderId: string;
  total: number;
  currency: string;
  items: { name: string; qty: number; price: number }[];
  shipping: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    deliveryMethod?: string;
  };
};

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error("Missing env: RESEND_API_KEY");
}
const resend = new Resend(apiKey);

function fmt(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toFixed(2);
}

function escapeHtml(input?: string | null) {
  const s = String(input ?? "");
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[c] ?? c;
  });
}

export async function sendPaidOrderEmail(params: PaidOrderEmailParams) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing env: EMAIL_FROM");

  const { to, orderId, total, currency, items, shipping } = params;

  const rowsHtml = (items ?? [])
    .map((i) => {
      const name = escapeHtml(i?.name);
      const qty = Number(i?.qty ?? 0);
      const unit = Number(i?.price ?? 0);
      const line = unit * qty;

      return `
        <tr>
          <td style="padding:8px 0;">${name}</td>
          <td style="padding:8px 0; text-align:center;">${qty}</td>
          <td style="padding:8px 0; text-align:right;">${fmt(unit)} ${currency}</td>
          <td style="padding:8px 0; text-align:right;"><b>${fmt(line)} ${currency}</b></td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; line-height:1.45; color:#111;">
      <h2 style="margin:0 0 12px;">Apmokėjimas gautas ✅</h2>
      <p style="margin:0 0 16px;">Jūsų užsakymas <b>${escapeHtml(orderId)}</b> yra apmokėtas.</p>

      <h3 style="margin:16px 0 8px;">Užsakymo detalės</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th align="left" style="padding:8px 0; border-bottom:1px solid #eee;">Prekė</th>
            <th align="center" style="padding:8px 0; border-bottom:1px solid #eee;">Kiekis</th>
            <th align="right" style="padding:8px 0; border-bottom:1px solid #eee;">Vnt.</th>
            <th align="right" style="padding:8px 0; border-bottom:1px solid #eee;">Suma</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="4" style="padding:10px 0; color:#666;">(Nėra prekių)</td></tr>`}
        </tbody>
      </table>

      <p style="margin:12px 0 0;"><b>Viso:</b> ${fmt(total)} ${currency}</p>

      <h3 style="margin:18px 0 8px;">Pristatymas</h3>
      <p style="margin:0">Vardas: ${escapeHtml(shipping?.name) || "-"}</p>
      <p style="margin:0">Tel: ${escapeHtml(shipping?.phone) || "-"}</p>
      <p style="margin:0">Adresas: ${escapeHtml(shipping?.address) || "-"}</p>
      <p style="margin:0">Miestas: ${escapeHtml(shipping?.city) || "-"}</p>
      <p style="margin:0">Pašto kodas: ${escapeHtml(shipping?.postalCode) || "-"}</p>
      <p style="margin:0">Būdas: ${escapeHtml(shipping?.deliveryMethod) || "-"}</p>

      <p style="margin:18px 0 0; color:#666; font-size:12px;">
        Jei turite klausimų — atsakykite į šį laišką.
      </p>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject: `Užsakymas apmokėtas (#${orderId || "—"})`,
    html,
  });
}

export async function sendContactEmail(params: {
  name: string;
  email: string;
  message: string;
}) {
  const from = process.env.EMAIL_FROM;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!from) throw new Error("Missing env: EMAIL_FROM");
  if (!to) throw new Error("Missing env: CONTACT_TO_EMAIL");

  const subject = `Contact forma: ${params.name}`;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui;line-height:1.45">
      <h2>Nauja žinutė iš Contact formos</h2>
      <p><b>Vardas:</b> ${escapeHtml(params.name)}</p>
      <p><b>El. paštas:</b> ${escapeHtml(params.email)}</p>
      <p><b>Žinutė:</b></p>
      <pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px">${escapeHtml(
        params.message
      )}</pre>
    </div>
  `;

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo: params.email,
  });
}