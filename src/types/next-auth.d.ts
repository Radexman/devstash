import "next-auth";

declare module "next-auth" {
  interface User {
    emailVerified?: Date | null;
    isPro?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
      isPro: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    emailVerified?: Date | null;
    isPro?: boolean;
  }
}
