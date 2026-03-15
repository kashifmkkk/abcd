/**
 * NextAuth route handler.
 * Exported as GET and POST to handle all auth flow requests at /api/auth/[...nextauth]
 */
import handler from "@/lib/auth/authConfig";

export { handler as GET, handler as POST };
