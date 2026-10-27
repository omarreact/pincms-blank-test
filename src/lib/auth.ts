import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [CredentialsProvider({
    name: "Administrator", credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email.trim().toLowerCase() } });
      if (!user?.password || !(await compare(credentials.password, user.password))) return null;
      return { id:user.id, email:user.email, name:user.name, role:user.role, image:user.image };
    }
  })],
  callbacks: {
    async jwt({token,user}) { if(user) { token.id=user.id; token.role=(user as {role:string}).role; } return token; },
    async session({session,token}) { if(session.user) {session.user.id = String(token.id ?? ""); session.user.role = String(token.role ?? "CONTRIBUTOR");} return session; },
  },
};
