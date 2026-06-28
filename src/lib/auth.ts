import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "./auth.config";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { data, error } = await supabaseAdmin
          .from("User")
          .select("id, email, name, role, password, isActive")
          .eq("email", credentials.email as string)
          .single();
        if (error || !data || !data.password) return null;
        if (!data.isActive) return null;
        const valid = await bcrypt.compare(credentials.password as string, data.password);
        if (!valid) return null;
        return { id: data.id, email: data.email, name: data.name, role: data.role } as any;
      },
    }),
  ],
});
