// src/types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      isAdmin?: boolean;
    };
  }
}
