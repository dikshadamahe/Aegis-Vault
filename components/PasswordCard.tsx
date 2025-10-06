"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Copy, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Favicon, extractDomain } from "./ui/Favicon";
import PassphraseModal from "./passphrase-modal";
import { decryptWithEnvelope, decryptSecret, deriveKeyFromPassphrase } from "@/lib/crypto";
import { toast } from "sonner";
import type { Session } from "next-auth";

type PasswordCardProps = {
  item: {
    id: string;
    websiteName: string;
    username?: string;
    email?: string | null;
    url?: string;
    passwordCiphertext: string;
    passwordNonce: string;
    encryptedDek?: string;
    notesCiphertext?: string | null;
    notesNonce?: string | null;
    notesEncryptedDek?: string | null;
    notesDekNonce?: string | null;
  };
};

export function PasswordCard({ item }: PasswordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { data: session } = useSession();

  // Extract domain for favicon using the helper function
  const sanitizedUrl = item.url ? (item.url.startsWith("http") ? item.url : `https://${item.url}`) : undefined;
  const computedDomain = extractDomain(sanitizedUrl ?? item.websiteName);
  const hasEncryptedNotes = Boolean(
    item.notesCiphertext && (item.notesNonce || (item.notesEncryptedDek && item.notesDekNonce))
  );
  const maskedPassword = "••••••••••••";

  // Decrypt password using the session key
  const decryptSecrets = async (key: Uint8Array) => {
    try {
      setIsDecrypting(true);
      setError(null);
      let password: string;

      if (item.encryptedDek) {
        // Envelope encryption
        password = await decryptWithEnvelope(
          {
            ciphertext: item.passwordCiphertext,
            nonce: item.passwordNonce,
            encryptedDek: item.encryptedDek,
          },
          key
        );
      } else {
        // Legacy direct encryption
        password = await decryptSecret(
          {
            ciphertext: item.passwordCiphertext,
            nonce: item.passwordNonce,
          },
          key
        );
      }

      setDecrypted(password);
      if (item.notesCiphertext) {
        try {
          let notes: string | null = null;
          if (item.notesEncryptedDek && item.notesDekNonce && item.notesNonce) {
            notes = await decryptWithEnvelope(
              {
                ciphertext: item.notesCiphertext,
                nonce: item.notesNonce,
                encryptedDek: item.notesEncryptedDek,
                dekNonce: item.notesDekNonce,
              },
              key
            );
          } else if (item.notesNonce) {
            notes = await decryptSecret(
              {
                ciphertext: item.notesCiphertext,
                nonce: item.notesNonce,
              },
              key
            );
          }
          setDecryptedNotes(notes);
        } catch (notesErr) {
          console.error("Failed to decrypt notes", notesErr);
        }
      } else {
        setDecryptedNotes(null);
      }
      setShowPassword(true);
      toast.success("Password decrypted");
    } catch (err: any) {
      const message = err?.message || "Failed to decrypt";
      setError(message);
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsDecrypting(false);
      setIsModalOpen(false);
    }
  };

  // Handle eye button click
  const handleEyeClick = async () => {
    if (isDecrypting) return;
    if (decrypted) {
      // Toggle visibility if already decrypted
      setShowPassword(!showPassword);
    } else {
      setIsModalOpen(true);
    }
  };

  const handlePassphraseSubmit = async (passphrase: string) => {
  const saltBase64 = getSessionSalt(session);
    if (!saltBase64) {
      const error = new Error("Missing encryption salt. Please log out and sign back in.");
      toast.error(error.message);
      throw error;
    }

    const saltBytes = base64ToUint8(saltBase64);
    const { key } = await deriveKeyFromPassphrase(passphrase, saltBytes);
    await decryptSecrets(key);
  };

  const handleCopy = async (text: string | null | undefined, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card overflow-hidden"
        style={{
          padding: "var(--space-3)",
        }}
      >
        {/* Card Header - Always Visible */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-4 text-left"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Favicon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Favicon domain={computedDomain ?? sanitizedUrl ?? item.websiteName} size={96} className="w-12 h-12" />
          </motion.div>

          {/* Website Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--aegis-text-heading)] tracking-tight truncate">
              {item.websiteName}
            </h3>
            {item.username && (
              <p className="text-sm text-[var(--aegis-text-muted)] truncate">
                {item.username}
              </p>
            )}
          </div>

          {/* Expand Indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0"
          >
            <Lock 
              className={`w-5 h-5 transition-colors duration-300 ${
                isExpanded ? "text-[var(--aegis-accent-primary)]" : "text-[var(--aegis-text-muted)]"
              }`} 
              strokeWidth={2}
            />
          </motion.div>
        </motion.button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3 }}
                className="pt-6 space-y-6 border-t border-[var(--aegis-border)]"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Username
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.username ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {item.username && (
                        <motion.button
                          onClick={() => handleCopy(item.username, "Username")}
                          className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Copy className="w-4 h-4" strokeWidth={2} />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.email ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {item.email && (
                        <motion.button
                          onClick={() => handleCopy(item.email ?? "", "Email")}
                          className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Copy className="w-4 h-4" strokeWidth={2} />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* URL */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Website
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.url ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {sanitizedUrl && (
                        <motion.a
                          href={sanitizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300 flex items-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ExternalLink className="w-4 h-4" strokeWidth={2} />
                        </motion.a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Notes
                  </label>
                  <div className="rounded-lg bg-[var(--aegis-bg-elevated)] border border-[var(--aegis-border)] px-4 py-3 text-sm text-[var(--aegis-text-body)] whitespace-pre-wrap min-h-[3rem]">
                    {decryptedNotes
                      ? decryptedNotes
                      : hasEncryptedNotes
                        ? "Notes are encrypted. Unlock with your passphrase."
                        : "No notes saved."}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={decrypted ?? maskedPassword}
                        readOnly
                        className="input-glass w-full pr-12 font-mono text-sm"
                      />
                      <motion.button
                        onClick={handleEyeClick}
                        disabled={isDecrypting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-primary)] transition-colors disabled:opacity-60"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </motion.button>
                    </div>

                    {decrypted && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => handleCopy(decrypted, "Password")}
                        className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300 flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Copy className="w-4 h-4" strokeWidth={2} />
                      </motion.button>
                    )}
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Passphrase Modal - Only shown when vault is locked */}
      {isModalOpen && (
        <PassphraseModal
          onSubmit={handlePassphraseSubmit}
          title="Enter Passphrase"
          description="Provide your master passphrase to decrypt this password."
          submitLabel="Decrypt"
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

function getSessionSalt(session: Session | null): string | undefined {
  if (!session) return undefined;
  const root = (session as unknown as { encryptionSalt?: string }).encryptionSalt;
  const nested = (session.user as { encryptionSalt?: string } | undefined)?.encryptionSalt;
  return root ?? nested ?? undefined;
}

function base64ToUint8(value: string): Uint8Array {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  throw new Error("Base64 decoding is not supported in this environment");
}
