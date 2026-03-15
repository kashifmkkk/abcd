import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/authConfig";

export async function getCurrentUserId() {
  const session = await getServerSession(authConfig);
  return session?.user?.id ?? null;
}
