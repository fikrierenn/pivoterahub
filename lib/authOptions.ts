// next-auth v4 config — single-user MVP (CredentialsProvider).
// Hedef: env'den AUTH_EMAIL + AUTH_PASSWORD okur, doğrularsa JWT session açar.
// Production'da kullanıcı tablosu + bcrypt'e taşınacak (G-01 sonrası).

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const { AUTH_EMAIL, AUTH_PASSWORD, NEXTAUTH_SECRET } = process.env;

if (!AUTH_EMAIL || !AUTH_PASSWORD) {
  // Development'ta erken uyar; production build'de fail-fast olmak için route içinde de kontrol var.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[auth] AUTH_EMAIL / AUTH_PASSWORD set edilmedi — login çalışmaz.');
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        if (!AUTH_EMAIL || !AUTH_PASSWORD) return null;

        const emailOk = credentials.email.toLowerCase() === AUTH_EMAIL.toLowerCase();
        const passwordOk = credentials.password === AUTH_PASSWORD;

        if (emailOk && passwordOk) {
          return { id: 'owner', email: AUTH_EMAIL, name: 'Owner' };
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 gün
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
