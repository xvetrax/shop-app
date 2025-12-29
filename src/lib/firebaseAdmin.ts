import "server-only";
import admin from "firebase-admin";
function getServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("Missing env: FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  // .env.local'e dažnai būna su kabutėm/apostrofais.
  // JSON.parse su tuo susitvarko, jei viduje tikras JSON.
  const parsed = JSON.parse(raw);

  // Labai svarbu: private_key turi turėti realius \n
  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  // Greitas sanity check
  if (!parsed.project_id) {
    throw new Error('Service account JSON must contain "project_id"');
  }

  return parsed;
}

// Init Admin SDK tik kartą (Next hot-reload atveju kitaip sproginėja)
const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(getServiceAccountFromEnv()),
      });

export const adminDb = app.firestore();
