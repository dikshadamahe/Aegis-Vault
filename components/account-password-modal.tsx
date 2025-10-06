"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { deriveKeyFromPassphrase } from "@/lib/crypto";

type AccountPasswordModalProps = {
  open: boolean;
  onCancel: () => void;
  onAuthenticated: (key: Uint8Array) => Promise<void> | void;
  title?: string;
  description?: string;
  reason?: string;
  submitLabel?: string;
};

export default function AccountPasswordModal({
  open,
  onCancel,
  onAuthenticated,
  title = "Authenticate",
  description,
  reason,
  submitLabel = "Authenticate",
}: AccountPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: session } = useSession();

  const effectiveDescription = useMemo(
    () => description ?? reason ?? "Enter your account password to continue.",
    [description, reason]
  );

  if (!open) return null;

  const deriveKey = async (accountPassword: string): Promise<Uint8Array> => {
    const encryptionSalt = ((session as any)?.encryptionSalt ?? (session?.user as any)?.encryptionSalt) as
      | string
      | undefined;

    if (!encryptionSalt) {
      throw new Error("Missing encryption salt. Please sign out and sign back in.");
    }

    let saltBytes: Uint8Array;
    try {
      saltBytes = Uint8Array.from(atob(encryptionSalt), (c) => c.charCodeAt(0));
    } catch {
      throw new Error("Corrupted encryption salt. Please contact support.");
    }

    const { key } = await deriveKeyFromPassphrase(accountPassword, saltBytes);
    return key;
  };

  const verifyAccountPassword = async (accountPassword: string) => {
    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: accountPassword }),
    });

    if (!res.ok) {
      throw new Error("Unable to verify account password. Please try again.");
    }

    const data = (await res.json()) as { verified?: boolean };
    if (!data.verified) {
      throw new Error("Incorrect account password. Please try again.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = password.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");

    try {
      await verifyAccountPassword(trimmed);
      const key = await deriveKey(trimmed);
      setPassword("");
      await onAuthenticated(key);
    } catch (err: any) {
      const message =
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : "Failed to authenticate. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
      // Ensure we never hold on to the password longer than necessary
      setPassword("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md"
      >
        <div className="glass-card-elevated" style={{ padding: "var(--space-4)" }}>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>

          <h2 className="text-center text-2xl font-bold mb-2 text-[var(--aegis-text-heading)]">{title}</h2>
          <p className="text-center text-sm text-[var(--aegis-text-muted)] mb-6">{effectiveDescription}</p>

          <div className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Account password"
                  className="input-glass w-full pr-12"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-teal)] transition-colors disabled:opacity-60"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  if (!loading) onCancel();
                }}
                className="flex-1 btn-ghost"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="flex-1 btn-accent disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || !password.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    {submitLabel.endsWith("...") ? submitLabel : `${submitLabel}...`}
                  </>
                ) : (
                  submitLabel
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
