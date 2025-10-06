// components/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { VaultProvider } from "@/providers/VaultProvider";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <VaultProvider>{children}</VaultProvider>
    </SessionProvider>
  );
}
