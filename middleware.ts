import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that only logged-out users should access
const AUTH_ROUTES = ['/login']
// Routes that are always public (no redirect)
const PUBLIC_ROUTES = ['/']

// Role-based dashboard root mapping
const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin',
  dosen: '/dosen',
  mahasiswa: '/mahasiswa',
}

// Prefix guard: which route prefix each role is NOT allowed to access
const ROLE_RESTRICTED_PREFIXES: Record<string, string[]> = {
  admin: ['/dosen', '/mahasiswa'],
  dosen: ['/admin', '/mahasiswa'],
  mahasiswa: ['/admin', '/dosen'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Setup Supabase client to refresh session cookies
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not delete this, it's required for session refresh
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Public routes → always pass through
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return supabaseResponse
  }

  // 3. Auth routes (e.g. /login) → redirect logged-in users to their dashboard
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (user) {
      const role = user.app_metadata?.role as string | undefined
      const dashboard = role ? (ROLE_DASHBOARDS[role] ?? '/') : '/'
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
    return supabaseResponse
  }

  // 4. Protected routes → redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Role-based cross-area access prevention
  const role = user.app_metadata?.role as string | undefined
  if (role) {
    const restrictedPrefixes = ROLE_RESTRICTED_PREFIXES[role] ?? []
    const isBlocked = restrictedPrefixes.some(prefix => pathname.startsWith(prefix))
    if (isBlocked) {
      const ownDashboard = ROLE_DASHBOARDS[role] ?? '/'
      return NextResponse.redirect(new URL(ownDashboard, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public image/font files
     * - API routes (bypass auth so /api/seed and others work)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
}
