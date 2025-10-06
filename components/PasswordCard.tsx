"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Copy, ExternalLink, Shield, Lock } from "lucide-react";
import { useState } from "react";
import { Favicon, extractDomain } from "./ui/Favicon";
import PassphraseModal from "./passphrase-modal";
import { decryptWithEnvelope, decryptSecret } from "@/lib/crypto";
import { useVault } from "@/providers/VaultProvider";
import { toast } from "sonner";

type PasswordCardProps = {
  item: {
    id: string;
    websiteName: string;
    username?: string;
    url?: string;
    passwordCiphertext: string;
    passwordNonce: string;
    passwordEncryptedDek?: string;
    passwordDekNonce?: string;
  };
};

export function PasswordCard({ item }: PasswordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Use vault context for session-based decryption
  const { isLocked, encryptionKey, unlockVault, resetInactivityTimer } = useVault();

  // Extract domain for favicon using the helper function
  const domain = extractDomain(item.url);

  // Decrypt password using the session key
  const decryptPassword = async (key: Uint8Array) => {
    try {
      setError(null);
      resetInactivityTimer(); // Reset timer on vault activity
      let password: string;

      if (item.passwordEncryptedDek && item.passwordDekNonce) {
        // Envelope encryption
        password = await decryptWithEnvelope(
          {
            ciphertext: item.passwordCiphertext,
            nonce: item.passwordNonce,
            encryptedDek: item.passwordEncryptedDek,
            dekNonce: item.passwordDekNonce,
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
      setShowPassword(true);
      toast.success("Password decrypted");
    } catch (err: any) {
      setError(err.message || "Failed to decrypt");
      toast.error("Decryption failed");
    }
  };

  // Handle eye button click
  const handleEyeClick = async () => {
    if (decrypted) {
      // Toggle visibility if already decrypted
      setShowPassword(!showPassword);
    } else if (isLocked) {
      // Vault is locked - show passphrase modal
      setIsModalOpen(true);
    } else if (encryptionKey) {
      // Vault is unlocked - decrypt immediately
      await decryptPassword(encryptionKey);
    }
  };

  // Handle successful vault unlock
  const handleVaultUnlocked = async () => {
    setIsModalOpen(false);
    // After unlock, the encryptionKey will be available, decrypt now
    if (encryptionKey) {
      await decryptPassword(encryptionKey);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      resetInactivityTimer(); // Reset timer on vault activity
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
            <Favicon domain={domain} size={64} />
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
                className="pt-6 space-y-4"
              >
                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={decrypted || "••••••••••••"}
                        readOnly
                        className="input-glass w-full pr-12 font-mono text-sm"
                      />
                      <motion.button
                        onClick={handleEyeClick}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-primary)] transition-colors"
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

                {/* Username Field */}
                {item.username && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Username
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.username}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      <motion.button
                        onClick={() => handleCopy(item.username!, "Username")}
                        className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Copy className="w-4 h-4" strokeWidth={2} />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* URL Field */}
                {item.url && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Website
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.url}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      <motion.a
                        href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 rounded-lg bg-[var(--aegis-bg-elevated)] hover:bg-[var(--aegis-accent-primary)] hover:text-[var(--aegis-bg-deep)] transition-all duration-300 flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink className="w-4 h-4" strokeWidth={2} />
                      </motion.a>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Passphrase Modal - Only shown when vault is locked */}
      {isModalOpen && (
        <PassphraseModal
          onUnlocked={handleVaultUnlocked}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
