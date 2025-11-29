/**
 * Copy this file to: app/utils/supabase/mobile.js in your halteres.ai backend
 * This adds bearer token support while keeping cookie auth for web
 *
 * IMPORTANT: Authentication Pattern for Mobile Compatibility
 * ==========================================================
 * When checking authentication in API routes that receive requests from mobile:
 *
 * ❌ DON'T use getSession() - it doesn't work with bearer tokens:
 *    const { data: { session } } = await supabase.auth.getSession();
 *
 * ✅ DO use getUser() - it works with both cookies and bearer tokens:
 *    const { data: { user }, error } = await supabase.auth.getUser();
 *
 * Example API route pattern:
 * ```js
 * export async function POST(req) {
 *   const supabase = await createMobileCompatibleClient(req);
 *   const { data: { user }, error: authError } = await supabase.auth.getUser();
 *
 *   if (authError || !user) {
 *     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */

const { createServerClient } = require("@supabase/ssr");
const { cookies } = require("next/headers");

/**
 * Creates a Supabase client that supports both cookie and bearer token auth
 * @param {Request} request - The incoming request object
 */
async function createMobileCompatibleClient(request) {
  const authHeader = request?.headers?.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    // Mobile app with bearer token
    const token = authHeader.substring(7);
    console.log("[Auth] Using bearer token authentication");

    // Create a client that uses the bearer token directly
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  // Web app with cookies
  console.log("[Auth] Using cookie authentication");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name, value, options) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
        async remove(name, options) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
      },
    },
  );
}

/**
 * CORS headers for mobile app
 */
function corsHeaders(origin = "capacitor://localhost") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle CORS preflight requests
 */
async function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }
  return null;
}

module.exports = {
  createMobileCompatibleClient,
  corsHeaders,
  handleCors,
};
