"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  type CurrentUser,
} from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import {
  getCurrentChannelId,
  setCurrentChannelId as setStoreChannelId,
} from "@/lib/api/channel-store";

type AuthStatus = "loading" | "authed" | "guest";

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  currentChannelId: string | null;
  login: (params: { email: string; password: string; remember?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentChannel: (id: string | null) => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [currentChannelId, setChannelState] = useState<string | null>(null);

  const applyBootstrap = useCallback(
    (boot: { user: CurrentUser; currentChannelId: string | null }) => {
      setUser(boot.user);
      // localStorage に保存済みのチャネルを優先（手動切替を保持）。なければサーバ既定。
      const stored = getCurrentChannelId();
      const channel = stored ?? boot.currentChannelId;
      setStoreChannelId(channel);
      setChannelState(channel);
      setStatus("authed");
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const boot = await getCurrentUser();
      applyBootstrap(boot);
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, [applyBootstrap]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 401 を受けたらゲスト状態へ。
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("guest");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(
    async (params: { email: string; password: string; remember?: boolean }) => {
      const boot = await apiLogin(params);
      // ログイン時はサーバの既定チャネルを採用（前ユーザーの残骸を消す）。
      setStoreChannelId(boot.currentChannelId);
      setUser(boot.user);
      setChannelState(boot.currentChannelId);
      setStatus("authed");
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setStoreChannelId(null);
    setUser(null);
    setChannelState(null);
    setStatus("guest");
  }, []);

  const setCurrentChannel = useCallback((id: string | null) => {
    setStoreChannelId(id);
    setChannelState(id);
  }, []);

  return (
    <AuthContext.Provider
      value={{ status, user, currentChannelId, login, logout, setCurrentChannel, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
