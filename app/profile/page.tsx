import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/authConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Display Name: {session.user.email?.split("@")[0] ?? "User"}</p>
          <p>Email: {session.user.email}</p>
        </CardContent>
      </Card>
    </main>
  );
}
