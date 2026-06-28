import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export interface ServerSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: 'user' | 'admin';
    emailVerified: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    
    if (!session) return null;
    
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || undefined,
        role: session.user.role === 'admin' ? 'admin' : 'user',
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt.toString(),
      }
    };
  } catch (e) {
    console.error("Failed to fetch session from Better Auth:", e);
    return null;
  }
}
