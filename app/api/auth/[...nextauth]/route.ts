import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Permitir login apenas com Google
      if (account?.provider === "google") {
        return true
      }
      return false
    },
    async session({ session, token }) {
      // Adicionar informações do usuário à sessão
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string || 'user'
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Adicionar informações do usuário ao token
      if (account && user) {
        token.role = 'user'
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST } 