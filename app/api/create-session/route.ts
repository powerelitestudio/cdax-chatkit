// app/api/create-session/route.ts
import { NextRequest } from "next/server";

// (Opcional) si quieres Edge Runtime:
// export const runtime = "edge";

// ⛳ Dominios permitidos
const ALLOWED = new Set<string>([
  "https://cartasdax.com",
  "https://www.cartasdax.com",
  "https://cdax-chatkit.vercel.app",
  "http://localhost:3000",
]);

// Helper: JSON + CORS siempre
function corsJson(req: Request, body: any, status = 200) {
  const origin = req.headers.get("origin") || "";
  const h = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, OpenAI-Beta, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  });
  if (ALLOWED.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  return new Response(body == null ? null : JSON.stringify(body), { status, headers: h });
}

// ===== Preflight (CORS) =====
export async function OPTIONS(req: NextRequest) {
  return corsJson(req, null, 204);
}

// ===== POST: debe devolver { client_secret, expires_after } =====
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));

    // 🔽🔽🔽 TU LÓGICA REAL AQUÍ (usa tu OPENAI_API_KEY y tu WORKFLOW_ID) 🔽🔽🔽
    // Ejemplo: const { client_secret, expires_after } = await createEphemeralKey(payload);
    // Demo temporal (cámbialo por lo real)
    const { client_secret, expires_after } = await generateClientSecretDEMO();
    // 🔼🔼🔼 TU LÓGICA REAL AQUÍ 🔼🔼🔼

    return corsJson(req, { client_secret, expires_after }, 200);
  } catch (err: any) {
    return corsJson(req, { error: String(err?.message || err) }, 500);
  }
}

/** ❗ DEMO: quítala cuando pegues tu lógica real */
async function generateClientSecretDEMO() {
  return {
    client_secret: "ek_demo_only_replace_with_real",
    expires_after: Math.floor(Date.now() / 1000) + 60,
  };
}
