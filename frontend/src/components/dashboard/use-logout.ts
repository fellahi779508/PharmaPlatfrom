"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { logOut } from "@/utils/server/auth-api";

/**
 * Signs the user out via the API route, then sends them back to the
 * public entry point. Shared by any UI that offers a "log out" action.
 */
export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logOut();
      router.push("/");
      router.refresh();
      setTimeout(() => setIsLoggingOut(false), 0);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  return { isLoggingOut, logout };
}
