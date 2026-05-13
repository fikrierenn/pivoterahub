// Server-side auth helper — API route'ların başında çağrılır.
// Auth yoksa null döner; route 401 ile yanıt verir.

import { getServerSession } from 'next-auth/next';
import { authOptions } from './authOptions';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * API route içinde mevcut oturum sahibini döner. Yoksa null.
 * Her route şu pattern'i uygular:
 *
 * ```ts
 * const user = await getAuthUser();
 * if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return {
    id: (session.user as { id?: string }).id ?? 'owner',
    email: session.user.email,
  };
}
