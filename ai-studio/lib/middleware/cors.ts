import { NextResponse } from "next/server";

/**
 * CORS middleware for API routes
 * Allows requests from Vercel domain and localhost for development
 */
export function corsMiddleware(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_VERCEL_URL,
    "http://localhost:3000",
    "http://localhost:8080",
  ].filter(Boolean);

  const isAllowed = allowedOrigins.some((allowedOrigin) =>
    origin.startsWith(allowedOrigin)
  );

  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function withCORS<T>(
  handler: (req: Request) => Promise<Response> | Response
) {
  return async (req: Request) => {
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsMiddleware(req),
      });
    }

    const response = await handler(req);
    const corsHeaders = corsMiddleware(req);

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
