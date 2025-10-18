// middleware.ts (en la RAÍZ del repo)
// CORS universal para /api/create-session (funciona con App Router o Pages Router)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Dominios permitidos
const ALLOWED = new Set([
  "https://cartasdax.com",
  "https://www.cartasdax.com",
  "https://cdax-chatkit.vercel.app",
  "http://localhost:3000",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo tocar /api/create-session
  if (pathname === "/api/create-session") {
    const origin = req.headers.get("origin") || "";
    const res = NextResponse.next();

    // CORS headers
    if (ALLOWED.has(origin)) res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, OpenAI-Beta, X-Requested-With"
    );
    res.headers.set("Access-Control-Max-Age", "86400");

    // Responder preflight inmediatamente
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }

    // Para POST/otros, deja pasar al handler con headers añadidos
    return res;
  }

  // Resto de rutas: no hacer nada
  return NextResponse.next();
}

// Aplica solo a esa ruta exacta
export const config = {
  matcher: ["/api/create-session"],
};
