"use client";

import { useAuth } from "@/lib/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.replace("/login");
    } else if (user && !isAuthorized) {
      router.replace("/login?error=unauthorized");
    } else if (user && isAuthorized && isLoginPage) {
      router.replace("/");
    }
  }, [user, loading, isAuthorized, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;
  if (!user || !isAuthorized) return null;

  return <>{children}</>;
}
