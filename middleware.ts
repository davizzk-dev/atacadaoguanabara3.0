import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Temporariamente desabilitado para debug
  return NextResponse.next()
  
  // Clone request para evitar problemas de "Response body disturbed"
  const url = request.nextUrl.clone()
  
  // Adicionar headers para evitar cache em APIs admin
  if (url.pathname.startsWith('/api/admin/')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/promotions/:path*',
    '/api/camera-requests/:path*',
    '/api/return-requests/:path*',
    '/api/upload/:path*'
  ]
}
