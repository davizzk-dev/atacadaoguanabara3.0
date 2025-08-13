import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { promises as fs } from 'fs'
import path from 'path'

// Garantir Node.js runtime e execução dinâmica (evita tentativas de pré-render e coleta de dados em build)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Função para verificar se usuário tem endereço
async function checkUserAddress(email: string) {
  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const data = await fs.readFile(usersPath, 'utf-8')
    const users = JSON.parse(data)
    
    const user = users.find((u: any) => u.email === email)
    if (user && user.address) {
      // Verificar se tem todos os campos obrigatórios do endereço
      const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
      return requiredFields.every(field => user.address[field] && user.address[field].trim() !== '')
    }
    return false
  } catch (error) {
    console.error('Erro ao verificar endereço do usuário:', error)
    return false
  }
}

function getMissingEnv() {
  const missing: string[] = []
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID')
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET')
  if (!process.env.NEXTAUTH_SECRET) missing.push('NEXTAUTH_SECRET')
  if (!process.env.NEXTAUTH_URL) missing.push('NEXTAUTH_URL')
  return missing
}

function tryLoadDotenvIfNeeded() {
  try {
    // Carregar .env.local somente se algo estiver faltando
    if (getMissingEnv().length) {
      const dotenvPath = path.join(process.cwd(), '.env.local')
      try { require('dotenv').config({ path: dotenvPath, override: true }) } catch {}
    }
  } catch {}
}

function getAuthOptions() {
  // Garante que variáveis estejam carregadas em tempo de requisição
  tryLoadDotenvIfNeeded()

  return {
    providers: [
      GoogleProvider({
        // Não lançar erro em tempo de build; validação será feita na entrada da request
        clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
        authorization: {
          params: {
            prompt: 'consent select_account',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET || "atacadao_guanabara_secret_super_forte_2025_auth_key_123456789",
    pages: {
      signIn: '/login',
      signOut: '/',
      error: '/login',
    },
    basePath: '/api/auth',
    cookies: {
      pkceCodeVerifier: {
        name: 'next-auth.pkce.code_verifier',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    },
    callbacks: {
      async signIn({ user, account }: { user?: any, account?: any }) {
        if (account?.provider === "google") {
          const hasAddress = await checkUserAddress(user.email)
          if (!hasAddress) {
            return '/register?google=true&name=' + encodeURIComponent(user.name || '') + '&email=' + encodeURIComponent(user.email || '')
          }
          return true
        }
        return false
      },
      async session({ session, token }: { session?: any, token?: any }) {
        if (session.user) {
          session.user.id = token.sub as string
          session.user.role = (token as any).role as string || 'user'
          session.user.image = (token as any).picture
        }
        return session
      },
      async jwt({ token, user, account }: { token?: any, user?: any, account?: any }) {
        if (account && user) {
          ;(token as any).role = 'user'
          token.email = (user as any).email
          token.name = (user as any).name
          ;(token as any).picture = (user as any).image
        }
        return token
      }
    }
  }
}

// Exportar um objeto estável para uso em getServerSession em outras rotas
export const authOptions = getAuthOptions() as any

function missingEnvResponse() {
  const missing = getMissingEnv()
  const body = JSON.stringify({ error: 'Missing environment variables for NextAuth Google', missing }, null, 2)
  return new Response(body, { status: 500, headers: { 'content-type': 'application/json' } })
}

export async function GET(request: Request, ctx: any) {
  // Validar variáveis em tempo de request
  if (getMissingEnv().length) return missingEnvResponse()
  const handler = NextAuth(getAuthOptions() as any)
  return (handler as any)(request, ctx)
}

export async function POST(request: Request, ctx: any) {
  if (getMissingEnv().length) return missingEnvResponse()
  const handler = NextAuth(getAuthOptions() as any)
  return (handler as any)(request, ctx)
}