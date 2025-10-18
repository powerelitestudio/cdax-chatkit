// pages/api/create-session.ts
import type { NextApiRequest, NextApiResponse } from "next";

// Dominios permitidos
const ALLOWED = new Set<string>([
  "https://cartasdax.com",
  "https://www.cartasdax.com",
  "https://cdax-chatkit.vercel.app",
  "http://localhost:3000",
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = (req.headers.origin as string) || "";

  if (ALLOWED.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, OpenAI-Beta, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    // Preflight OK (sin cuerpo)
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const payload = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};

    // 👇 TU LÓGICA REAL AQUÍ:
    // const { client_secret, expires_after } = await createEphemeralKey(payload);

    // --- DEMO reemplaza por tu lógica ---
    const { client_secret, expires_after } = await generateClientSecretDemo();
    // ------------------------------------

    return res.status(200).json({ client_secret, expires_after });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

/** 🔧 DEMO: quita esta función cuando uses tu lógica real */
async function generateClientSecretDemo() {
  return {
    client_secret: "ek_demo_only_replace_with_real",
    expires_after: Math.floor(Date.now() / 1000) + 60,
  };
}
