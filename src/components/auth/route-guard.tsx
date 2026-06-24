"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { StrawberryIcon } from "@/components/strawberry-icon";

function LoadingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <StrawberryIcon className="size-8 animate-pulse" />
    </div>
  );
}

/** 認証必須エリア。未認証なら /login へ。 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") return <LoadingScreen />;
  return <>{children}</>;
}

/** ゲスト専用エリア（ログイン/登録）。認証済みなら /chat へ。 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/chat");
  }, [status, router]);

  if (status === "authed") return <LoadingScreen />;
  return <>{children}</>;
}
