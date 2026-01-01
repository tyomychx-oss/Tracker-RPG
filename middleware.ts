import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Створюємо початкову відповідь
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Налаштовуємо клієнт Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Оновлюємо куки в запиті
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Оновлюємо куки у відповіді (щоб браузер їх запам'ятав)
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Оновлюємо сесію (це критично для Supabase auth)
  await supabase.auth.getUser()

  // 4. Повертаємо оновлену відповідь
  return response
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}