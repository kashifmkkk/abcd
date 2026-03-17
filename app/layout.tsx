import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/authConfig";
import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/db/client";
import "./globals.css";

export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Dashboard Platform",
  description: "Config-driven AI-generated dashboard MVP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user;

  const recentProjects = session?.user?.id
    ? await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, name: true },
      })
    : [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const saved = localStorage.getItem("theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const isDark = saved === "dark" || (!saved && prefersDark);
                document.documentElement.classList.toggle("dark", isDark);
              } catch {}
            })();`,
          }}
        />
        <Navbar
          isAuthenticated={isAuthenticated}
          userEmail={session?.user?.email ?? null}
          recentProjects={recentProjects}
        />
        {children}
      </body>
    </html>
  );
}
