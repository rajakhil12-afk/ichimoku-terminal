// ============================================================
// Ichimoku MTF Terminal — Cloudflare Worker CORS Proxy
// Deploy at: https://dash.cloudflare.com → Workers & Pages
// Worker name: ichimoku-proxy
// ============================================================

const ALLOWED_ORIGIN = "https://rajakhil12-afk.github.io";

// Also allow localhost for local development
const ALLOWED_ORIGINS = [
    "https://rajakhil12-afk.github.io",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080"
];

export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get("Origin") || "";

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin)
            });
        }

        // Parse the ?url= parameter
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
            });
        }

        // Only allow Yahoo Finance requests for security
        if (!targetUrl.includes("finance.yahoo.com")) {
            return new Response(JSON.stringify({ error: "Only Yahoo Finance URLs are allowed" }), {
                status: 403,
                headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
            });
        }

        try {
            // Fetch from Yahoo Finance
            const response = await fetch(targetUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://finance.yahoo.com/",
                    "Origin": "https://finance.yahoo.com"
                }
            });

            const data = await response.text();

            return new Response(data, {
                status: response.status,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=60",
                    ...corsHeaders(origin)
                }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
            });
        }
    }
};

function corsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGIN;
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
    };
}
