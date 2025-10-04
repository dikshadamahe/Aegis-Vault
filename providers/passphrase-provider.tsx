"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { deriveKeyFromPassphrase } from "@/lib/crypto";
import PassphraseModal from "@/components/passphrase-modal";

type OpenOptions = { reason?: string };

type PassphraseContextValue = {
  // passphrase is kept in-memory only
  isSet: boolean;
  clear: () => void;
  touch: () => void;
  // opens modal, waits for user to enter passphrase
  openPassphrase: (opts?: OpenOptions) => Promise<void>;
  // derive a key for a given salt (Uint8Array or base64)
  getKeyForSalt: (salt: Uint8Array | string) => Promise<Uint8Array>;
  // generate a new random salt for KDF
  genSalt: () => Uint8Array;
};

const PassphraseContext = createContext<PassphraseContextValue | undefined>(undefined);

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export function PassphraseProvider({ children }: { children: React.ReactNode }) {
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [lastActiveAt, setLastActiveAt] = useState<number>(Date.now());
  const timeoutRef = useRef<number | null>(null);

  // modal state
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const resolverRef = useRef<((v: void) => void) | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const armTimer = () => {
    clearTimer();
    timeoutRef.current = window.setTimeout(() => {
      setPassphrase(null);
    }, INACTIVITY_MS) as unknown as number;
  };

  const touch = useCallback(() => {
    setLastActiveAt(Date.now());
    if (passphrase) armTimer();
  }, [passphrase]);

  useEffect(() => {
    if (passphrase) armTimer();
    return clearTimer; // cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passphrase]);

  const clear = useCallback(() => {
    setPassphrase(null);
    clearTimer();
  }, []);

  const openPassphrase = useCallback(async (opts?: OpenOptions) => {
    setReason(opts?.reason);
    setOpen(true);
    return new Promise<void>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const onSubmitPassphrase = async (value: string) => {
    setPassphrase(value);
    touch();
    setOpen(false);
    resolverRef.current?.();
    resolverRef.current = null;
  };

  const getKeyForSalt = useCallback(
    async (salt: Uint8Array | string) => {
      if (!passphrase) {
        await openPassphrase({ reason: "Enter passphrase" });
      }
      const s = typeof salt === "string" ? base64ToU8(salt) : salt;
      const { key } = await deriveKeyFromPassphrase(passphrase as string, s);
      touch();
      return key;
    },
    [passphrase, openPassphrase, touch]
  );

  const genSalt = () => {
    const u8 = new Uint8Array(16);
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(u8);
      return u8;
    }
    // very rare fallback; not expected in browser
    for (let i = 0; i < u8.length; i++) u8[i] = Math.floor(Math.random() * 256);
    return u8;
  };

  const value = useMemo(
    () => ({ isSet: !!passphrase, clear, touch, openPassphrase, getKeyForSalt, genSalt }),
    [passphrase, clear, touch, openPassphrase, getKeyForSalt]
  );

  return (
    <PassphraseContext.Provider value={value}>
      {children}
      <PassphraseModal
        open={open}
        reason={reason}
        onCancel={() => {
          setOpen(false);
          resolverRef.current?.();
          resolverRef.current = null;
        }}
        onSubmit={onSubmitPassphrase}
      />
    </PassphraseContext.Provider>
  );
}

export function usePassphrase() {
  const ctx = useContext(PassphraseContext);
  if (!ctx) throw new Error("usePassphrase must be used within PassphraseProvider");
  return ctx;
}

function base64ToU8(b64: string) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
