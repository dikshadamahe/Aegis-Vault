"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { deriveKeyFromPassphrase } from "@/lib/crypto";
import { toast } from "sonner";

type Props = {
  open: boolean;
  reason?: string;
  salt: string; // base64 encoded salt
  onSuccess: (key: Uint8Array) => Promise<void>;
  onCancel: () => void;
};

export default function PassphraseModal({ open, reason, salt, onSuccess, onCancel }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      // Convert base64 salt to Uint8Array
      const saltBytes = base64ToU8(salt);
      
      // Derive key from passphrase using libsodium
      const { key } = await deriveKeyFromPassphrase(value, saltBytes);
      
      // Call the success callback with the derived key
      await onSuccess(key);
      setValue("");
    } catch (error) {
      console.error("Key derivation failed:", error);
      toast.error("Failed to derive key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            onClick={onCancel}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
          >
            <div className="glass-card-elevated p-8 w-full max-w-md pointer-events-auto relative">
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-[var(--aegis-text-muted)] hover:text-[var(--aegis-text-body)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center shadow-[0_0_30px_rgba(0,191,165,0.4)]">
                  <Lock className="w-8 h-8 text-[var(--aegis-bg-deep)]" strokeWidth={2.5} />
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-center mb-2">
                {reason || "Enter Passphrase"}
              </h3>
              <p className="text-center text-[var(--aegis-text-muted)] mb-6">
                Your master passphrase unlocks your vault
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  placeholder="Master passphrase"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input-glass"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !value.trim()}
                  className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Unlocking..." : "Unlock"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper to convert base64 to Uint8Array
function base64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
