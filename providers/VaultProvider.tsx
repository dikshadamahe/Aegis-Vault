import type { ReactNode } from "react";

export function VaultProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useVault() {
  throw new Error(
    "VaultProvider has been removed. Use the account password modal flow instead."
  );
}
