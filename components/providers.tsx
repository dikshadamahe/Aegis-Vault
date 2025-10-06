// components/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { AppStoreProvider } from "@/store/app-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppStoreProvider>{children}</AppStoreProvider>
    </SessionProvider>
  );
}
