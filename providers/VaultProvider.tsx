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
        // GUARD CLAUSE 1: Check session exists
        if (!session?.user) {
          const errorMsg = "No active session. Please log in again.";
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // GUARD CLAUSE 2: Check encryptionSalt exists in session.user
        const encryptionSalt = (session.user as any).encryptionSalt as string | undefined;
        if (!encryptionSalt || encryptionSalt.trim() === "") {
          const errorMsg = "Encryption salt missing from session. Please log out and log back in.";
          console.error("[VaultProvider] encryptionSalt not found in session.user:", session.user);
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }

        // GUARD CLAUSE 3: Validate base64 format
        let saltBytes: Uint8Array;
        try {
          saltBytes = Uint8Array.from(atob(encryptionSalt), (c) => c.charCodeAt(0));
        } catch (decodeError) {
          const errorMsg = "Invalid encryption salt format. Please contact support.";
          console.error("[VaultProvider] Failed to decode encryptionSalt:", decodeError);
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Derive key from passphrase
        const { key } = await deriveKeyFromPassphrase(passphrase, saltBytes);

        // Store key in memory
        setEncryptionKey(key);
        setIsLocked(false);

        // Start inactivity timer
        resetInactivityTimer();

        toast.success("Vault unlocked successfully");
      } catch (error: any) {
        // Only show generic error if we haven't already shown a specific one
        if (!error.message?.includes("salt") && !error.message?.includes("session")) {
          toast.error("Failed to unlock vault - incorrect passphrase");
        }
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
