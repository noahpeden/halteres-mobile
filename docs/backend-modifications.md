# Backend Modifications for Mobile Support

This document outlines the specific changes needed to add bearer token authentication to your existing halteres.ai API routes.

## Current Authentication Method

Your API routes currently use cookie-based authentication via Supabase SSR:

```javascript
// Current implementation in all API routes
const supabase = await createClient(); // Uses cookies
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

## Required Modifications

### 1. Create a New Supabase Client Helper

Create a new file: `app/utils/supabase/mobile.js`

```javascript
const { createServerClient } = require('@supabase/ssr');
const { cookies } = require('next/headers');

/**
 * Creates a Supabase client that supports both cookie and bearer token auth
 * @param {Request} request - The incoming request object
 */
async function createMobileCompatibleClient(request) {
  // Check for bearer token first
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    // Mobile app with bearer token
    const token = authHeader.substring(7);

    // Create a client without cookie handling for bearer token auth
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
  }

  // Fall back to cookie-based auth for web
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
            // Ignore errors from Server Components
          }
        },
        async remove(name, options) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}

module.exports = { createMobileCompatibleClient };
```

### 2. Update API Routes

For each API route, make these changes:

#### Example: `app/api/generate-program-anthropic/route.js`

```javascript
// Add at the top
import { createMobileCompatibleClient } from '@/utils/supabase/mobile';

// Change this line:
// OLD:
const supabase = await createClient();

// NEW:
const supabase = await createMobileCompatibleClient(request);

// The rest stays the same - getSession() will work with both auth methods
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

### 3. Add CORS Headers

Create a middleware helper: `app/utils/cors.js`

```javascript
export function corsHeaders(origin = 'capacitor://localhost') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

export async function handleCors(request) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders()
    });
  }
  return null;
}
```

### 4. Update Each API Route with CORS

```javascript
import { corsHeaders, handleCors } from '@/utils/cors';

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders()
  });
}

export async function POST(request) {
  // Handle CORS preflight
  const corsResponse = await handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Your existing code here...

    // When returning responses, include CORS headers
    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: corsHeaders()
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}
```

## API Routes That Need Updates

Based on your codebase, these are the primary API routes the mobile app will need:

### High Priority (Core Features)
1. ✅ `/api/generate-program-anthropic` - Main AI program generation
2. ✅ `/api/CreateProgram` - Manual program creation
3. ✅ `/api/enhance-workout` - Workout enhancement
4. ✅ `/api/DeleteProgram` - Program deletion
5. ✅ `/api/add-workout-to-program` - Add workouts

### Medium Priority (Search & Discovery)
6. ✅ `/api/search-workouts-new` - Workout search with embeddings
7. ✅ `/api/ai-workout-suggestions` - AI suggestions
8. ✅ `/api/public-program` - Public program access
9. ✅ `/api/public-workout` - Public workout access

### Low Priority (Account & Billing)
10. ✅ `/api/check-subscription-status` - Subscription check
11. ✅ `/api/billing-portal` - Stripe billing
12. ✅ `/api/cancel-subscription` - Cancel subscription
13. ✅ `/api/resume-subscription` - Resume subscription

## Testing Bearer Token Auth

### Test with cURL

```bash
# Get a user token from Supabase
TOKEN="your-supabase-jwt-token"

# Test an endpoint
curl -X POST https://localhost:3000/api/generate-program-anthropic \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "uuid-here",
    "duration_weeks": 8,
    "difficulty": "intermediate"
  }'
```

### Test from Mobile App

```javascript
// In your React Native/Capacitor app
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('https://halteres.ai/api/generate-program-anthropic', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entity_id: selectedEntity.id,
    duration_weeks: 8,
    // ... other params
  })
});
```

## Environment Variables

No new environment variables needed! The mobile app uses:
- `NEXT_PUBLIC_SUPABASE_URL` (same as web)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as web)
- `NEXT_PUBLIC_API_URL=https://halteres.ai` (points to your backend)

## Deployment Checklist

1. [ ] Create `mobile.js` helper for dual auth support
2. [ ] Update priority API routes with new client
3. [ ] Add CORS headers to all updated routes
4. [ ] Test with bearer token locally
5. [ ] Deploy to staging
6. [ ] Test from mobile app
7. [ ] Monitor logs for any auth issues
8. [ ] Deploy to production

## Important Notes

- **NO PROMPT MIGRATION**: All your prompt JS files stay exactly where they are
- **NO EDGE FUNCTIONS**: Continue using your existing Vercel functions
- **BACKWARD COMPATIBLE**: Web app continues working with cookies
- **SINGLE CODEBASE**: Same API serves both web and mobile

## Gradual Rollout Strategy

You don't need to update all routes at once:

### Phase 1 (Week 1)
- Update authentication helpers
- Update core generation endpoints
- Test with mobile app prototype

### Phase 2 (Week 2)
- Update search and discovery endpoints
- Add CORS to all updated routes

### Phase 3 (Week 3)
- Update billing endpoints
- Complete testing and deployment

This approach lets you maintain the web app while gradually adding mobile support.