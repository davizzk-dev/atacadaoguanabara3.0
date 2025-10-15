import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export interface AdminAuthResult {
  isAuthenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  error?: string
}

/**
 * Middleware simplificado para verificar se o usuário tem permissão de admin
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Verificar múltiplas possibilidades de autenticação
    const cookieStore = cookies()
    
    // Tentar diferentes formatos de cookie
    const authCookie = cookieStore.get('auth-storage') || 
                      cookieStore.get('next-auth.session-token') ||
                      cookieStore.get('__Secure-next-auth.session-token')
    
    // Se não tem cookie, verificar headers de autenticação básica
    const authHeader = request.headers.get('authorization')
    
    if (!authCookie?.value && !authHeader) {
      return { isAuthenticated: false, error: 'Não autenticado' }
    }

    // Verificar se é a credencial de admin padrão
    if (authHeader) {
      const [type, credentials] = authHeader.split(' ')
      if (type === 'Basic') {
        const decoded = Buffer.from(credentials, 'base64').toString()
        const [username, password] = decoded.split(':')
        if (username === 'admin' && password === 'atacadaoguanabaraadmin123secreto') {
          return {
            isAuthenticated: true,
            user: { id: 'admin', name: 'Admin', email: 'admin', role: 'admin' }
          }
        }
      }
    }

    // Tentar verificar cookie se existir
    if (authCookie?.value) {
      try {
        const decodedValue = decodeURIComponent(authCookie.value)
        const authData = JSON.parse(decodedValue)
        const userData = authData?.state?.user || authData?.user
        
        if (userData && (
          ['admin', 'programador', 'gerente', 'atendente'].includes(userData.role) || 
          userData.email === 'admin' || 
          userData.email === 'davikalebe20020602@gmail.com'
        )) {
          return {
            isAuthenticated: true,
            user: userData
          }
        }
      } catch (parseError) {
        console.log('Erro ao parsear cookie, mas continuando...')
      }
    }

    return { isAuthenticated: false, error: 'Acesso negado - Admin necessário' }

  } catch (error) {
    console.error('Erro na verificação de autenticação:', error)
    return { isAuthenticated: false, error: 'Erro interno' }
  }
}

/**
 * Wrapper para proteger rotas de API admin
 * Só permite acesso direto para usuários admin
 */
export function withAdminAuth(handler: Function) {
  return async function(request: NextRequest, context?: any) {
    // Verificar se a requisição vem do próprio frontend (painel admin)
    const referer = request.headers.get('referer')
    const origin = request.headers.get('origin')
    const userAgent = request.headers.get('user-agent')
    
    // Se vier do painel admin (mesmo domínio), permitir
    const isFromAdminPanel = referer?.includes('/admin') || 
                            (origin && request.url.includes(origin))

    // Para requisições do painel admin, verificar apenas se tem algum token
    if (isFromAdminPanel) {
      const cookieStore = cookies()
      const authCookie = cookieStore.get('auth-storage')
      
      if (authCookie?.value) {
        try {
          const decodedValue = decodeURIComponent(authCookie.value)
          const authData = JSON.parse(decodedValue)
          const userData = authData?.state?.user
          
          // Se tem usuário logado, permitir acesso (o painel já faz sua própria verificação)
          if (userData) {
            return handler(request, context)
          }
        } catch (e) {
          // Se não conseguir parsear, continuar com verificação normal
        }
      }
    }

    // Para acesso direto via URL, exigir admin
    const authResult = await verifyAdminAuth(request)
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { 
          error: authResult.error || 'Acesso não autorizado',
          message: 'Esta API só pode ser acessada diretamente por administradores. Use o painel administrativo.'
        }, 
        { status: 401 }
      )
    }

    // Se chegou aqui, é admin - permitir acesso
    return handler(request, context)
  }
}

/**
 * Middleware simples que bloqueia acesso direto via URL para visualização
 * Muito mais permissivo - só bloqueia GET direto no navegador
 */
export function withAPIProtection(handler: Function) {
  return async function(request: NextRequest, context?: any) {
    // Só aplicar proteção em GET requests
    if (request.method !== 'GET') {
      return handler(request, context)
    }

    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer')
    const accept = request.headers.get('accept') || ''
    
    // Permitir requisições que claramente vêm de aplicações (fetch, axios, etc)
    if (accept.includes('application/json') && !accept.includes('text/html')) {
      return handler(request, context)
    }
    
    // Permitir requisições com referer (vem de páginas do site)
    if (referer) {
      return handler(request, context)
    }
    
    // Permitir user agents que não são navegadores típicos
    if (!userAgent.includes('Mozilla') || userAgent.includes('curl') || userAgent.includes('Postman')) {
      return handler(request, context)
    }
    
    // Aqui é uma requisição GET direta no navegador - verificar admin de forma simples
    const authResult = await verifyAdminAuth(request)
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Acesso negado' }, 
        { status: 403 }
      )
    }

    return handler(request, context)
  }
}
