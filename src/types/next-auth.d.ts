import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    courses?: string[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      courses?: string[];
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    courses?: string[];
  }
}
