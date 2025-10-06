"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { deriveKeyFromPassphrase } from "@/lib/crypto";
import { toast } from "sonner";

type VaultContextType = {
  isLocked: boolean;
  encryptionKey: Uint8Array | null;
  unlockVault: (passphrase: string) => Promise<void>;
  lockVault: () => void;
  resetInactivityTimer: () => void;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isLocked, setIsLocked] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lock vault (clear key from memory)
  const lockVault = useCallback(() => {
    setEncryptionKey(null);
    setIsLocked(true);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    toast.info("Vault locked for security");
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set timer if vault is unlocked
    if (!isLocked) {
      inactivityTimerRef.current = setTimeout(() => {
        lockVault();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isLocked, lockVault]);

  // Unlock vault (derive key and store in memory)
  const unlockVault = useCallback(
    async (passphrase: string) => {
      try {
        if (!session?.user) {
          throw new Error("No session found");
        }
        
        const encryptionSalt = (session.user as any).encryptionSalt as string | undefined;
        if (!encryptionSalt) {
          throw new Error("No encryption salt found in session");
        }

        // Convert base64 salt to Uint8Array
        const saltBytes = Uint8Array.from(atob(encryptionSalt), (c) =>
          c.charCodeAt(0)
        );

        // Derive key from passphrase
        const { key } = await deriveKeyFromPassphrase(passphrase, saltBytes);

        // Store key in memory
        setEncryptionKey(key);
        setIsLocked(false);

        // Start inactivity timer
        resetInactivityTimer();

        toast.success("Vault unlocked successfully");
      } catch (error: any) {
        toast.error("Failed to unlock vault - incorrect passphrase");
        throw error;
      }
    },
    [session, resetInactivityTimer]
  );

  // Reset timer on user activity
  useEffect(() => {
    const handleActivity = () => {
      if (!isLocked) {
        resetInactivityTimer();
      }
    };

    // Listen for various user activities
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isLocked, resetInactivityTimer]);

  // Auto-lock on session change/logout
  useEffect(() => {
    if (!session) {
      lockVault();
    }
  }, [session, lockVault]);

  return (
    <VaultContext.Provider
      value={{
        isLocked,
        encryptionKey,
        unlockVault,
        lockVault,
        resetInactivityTimer,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
