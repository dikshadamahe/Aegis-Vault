"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { deriveKeyFromPassphrase } from "@/lib/crypto";

type PassphraseContextValue = {
  key: Uint8Array | null;
  salt: Uint8Array | null;
  setPassphrase: (pass: string) => Promise<void>;
  clear: () => void;
};

const PassphraseContext = createContext<PassphraseContextValue | undefined>(
  undefined
);

export function PassphraseProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<Uint8Array | null>(null);
  const [salt, setSalt] = useState<Uint8Array | null>(null);

  const setPassphrase = async (pass: string) => {
    const { key, salt } = await deriveKeyFromPassphrase(pass);
    setKey(key);
    setSalt(salt);
  };

  const clear = () => {
    setKey(null);
    setSalt(null);
  };

  const value = useMemo(() => ({ key, salt, setPassphrase, clear }), [key, salt]);

  return (
    <PassphraseContext.Provider value={value}>{children}</PassphraseContext.Provider>
  );
}

export function usePassphrase() {
  const ctx = useContext(PassphraseContext);
  if (!ctx) throw new Error("usePassphrase must be used within PassphraseProvider");
  return ctx;
}
