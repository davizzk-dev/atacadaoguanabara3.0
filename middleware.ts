import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Verifica se o usuário está autenticado como dev através do cookie
  const devAuth = request.cookies.get('dev_authenticated')?.value
  
  // Se não está autenticado como dev e não está tentando acessar a página de desenvolvimento
  if (devAuth !== 'true' && url.pathname !== '/desenvolvimento') {
    // Redireciona para a página de desenvolvimento
    url.pathname = '/desenvolvimento'
    return NextResponse.redirect(url)
  }
  
  // Se está na página de desenvolvimento e está autenticado, redireciona para home
  if (url.pathname === '/desenvolvimento' && devAuth === 'true') {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
