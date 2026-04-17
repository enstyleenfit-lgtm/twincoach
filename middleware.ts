import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_ROLE_COOKIE_NAME,
  isDemoRole,
  roleHomePath,
} from "@/lib/authz/demoSession";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const demoRoleRaw = request.cookies.get(DEMO_ROLE_COOKIE_NAME)?.value;
  const demoRole = isDemoRole(demoRoleRaw) ? demoRoleRaw : null;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  }

  const isAuthenticated = Boolean(user) || Boolean(demoRole);

  // ログインページは認証不要（ただし認証済みなら role に応じて遷移）
  if (pathname === "/login") {
    if (demoRole) {
      return NextResponse.redirect(new URL(roleHomePath(demoRole), request.url));
    }
    if (user) {
      return NextResponse.redirect(new URL("/trainer", request.url));
    }
    return response;
  }

  // 未ログインで保護ページに来た場合はログインへ
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

