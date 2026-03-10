import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Nodemailer({
      server: {
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_API_KEY,
        },
      },
      from: "PLANET <noreply@open.coop>",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/check-email",
  },
  callbacks: {
    async signIn({ user }) {
      // Verify membership against Open Collective
      if (!user.email) return false;

      try {
        const res = await fetch(
          "https://api.opencollective.com/graphql/v2",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.OPEN_COLLECTIVE_API_KEY && {
                "Api-Key": process.env.OPEN_COLLECTIVE_API_KEY,
              }),
            },
            body: JSON.stringify({
              query: `
                query($slug: String!, $email: EmailAddress!) {
                  account(slug: $slug) {
                    members(email: $email, limit: 1) {
                      nodes {
                        role
                        account { name }
                      }
                    }
                  }
                }
              `,
              variables: {
                slug: "the-open-co-op",
                email: user.email,
              },
            }),
          }
        );

        const data = await res.json();
        const members = data?.data?.account?.members?.nodes;

        // Allow login even if not an OC member — we'll track membership status in session
        user.isMember = members && members.length > 0;
      } catch {
        // If OC API fails, allow login but mark as unverified
        user.isMember = false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.isMember = user.isMember ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.isMember = token.isMember ?? false;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
