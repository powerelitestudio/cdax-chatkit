// app/api/create-session/route.ts
import { NextRequest } from "next/server";

// (opcional) si quieres Edge:
// export const runtime = "edge";

// ✅ Dominios permitidos para CORS
const ALLOWED = new Set<string>([
  "https://cartasdax.com",
  "https://www.cartasdax.com",
  "https://cdax-chatkit.vercel.app",
  "http://localhost:3000",
]);

// Helper: responde JSON con headers CORS correctos
function corsJson(req: Request, body: any, status = 200) {
  const origin = req.headers.get("origin") || "";
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, OpenAI-Beta, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  });
  if (ALLOWED.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(body == null ? null : JSON.stringify(body), { status, headers });
}

// ====== PRE-FLIGHT (OPTIONS) ======
export async function OPTIONS(req: NextRequest) {
  return corsJson(req, null, 204); // responde SIEMPRE con CORS
}

// ====== POST: devuelve { client_secret, expires_after } ======
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    // 👇👇👇 PEGAR AQUÍ TU LÓGICA ACTUAL 👇👇👇
    // Ejemplo: si ya tienes una función que genera el client_secret, úsala:
    // const { client_secret, expires_after } = await createEphemeralKey(payload);
    // ⛳ Reemplaza la línea de DEMO por tu código real:
    const { client_secret, expires_after } = await generateClientSecretDEMO();
    // 👆👆👆 PEGAR AQUÍ TU LÓGICA ACTUAL 👆👆👆

    return corsJson(req, { client_secret, expires_after }, 200);
  } catch (err: any) {
    return corsJson(req, { error: String(err?.message || err) }, 500);
  }
}

/** ❗ DEMO TEMPORAL: quítala cuando pegues tu lógica real */
async function generateClientSecretDEMO() {
  return {
    client_secret: "ek_demo_only_replace_with_real",
    expires_after: Math.floor(Date.now() / 1000) + 60,
  };
}
