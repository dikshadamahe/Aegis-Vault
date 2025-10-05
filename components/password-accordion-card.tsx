"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Eye, EyeOff, Copy, Edit, Trash2, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { categoryIcon } from "@/constants/category-icon";
import { WebsiteLogo } from "./website-logo";
import PassphraseModal from "./passphrase-modal";
import { decryptWithEnvelope, decryptSecret } from "@/lib/crypto";

type PasswordAccordionCardProps = {
  id: string;
  websiteName: string;
  username?: string;
  email?: string;
  url?: string;
  notes?: string;
  category: { name: string; slug: string };
  // Encryption data
  passwordCiphertext: string;
  passwordNonce: string;
  passwordSalt: string;
  passwordEncryptedDek?: string;
  passwordDekNonce?: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function PasswordAccordionCard({
  id,
  websiteName,
  username,
  email,
  url,
  notes,
  category,
  passwordCiphertext,
  passwordNonce,
  passwordSalt,
  passwordEncryptedDek,
  passwordDekNonce,
  onEdit,
  onDelete,
}: PasswordAccordionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const CategoryIcon = categoryIcon[category.slug] || Globe;

  // STATELESS DECRYPTION: Fresh operation each time
  const performDecryption = async (key: Uint8Array) => {
    setLoading(true);
    setError(null);
    try {
      let decrypted: string;
      
      // Check if envelope encryption is used (new architecture)
      if (passwordEncryptedDek && passwordDekNonce) {
        // ENVELOPE DECRYPTION: New secure architecture
        decrypted = await decryptWithEnvelope(
          {
            ciphertext: passwordCiphertext,
            nonce: passwordNonce,
            encryptedDek: passwordEncryptedDek,
            dekNonce: passwordDekNonce,
          },
          key
        );
      } else {
        // LEGACY DECRYPTION: Fallback for old data
        decrypted = await decryptSecret(
          {
            ciphertext: passwordCiphertext,
            nonce: passwordNonce,
          },
          key
        );
      }
      
      setPassword(decrypted);
      setShowPassword(true);
      toast.success("Password decrypted!");
    } catch (error) {
      console.error("Decryption failed for item:", id, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to decrypt password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleTogglePassword = () => {
    if (!showPassword && !password) {
      // Open modal to get passphrase
      setIsModalOpen(true);
    } else {
      setShowPassword(!showPassword);
      setError(null);
    }
  };

  const handleCopyPassword = async () => {
    if (password) {
      // Already decrypted, just copy
      await navigator.clipboard.writeText(password);
      toast.success("Password copied!", {
        description: "Password copied to clipboard securely.",
      });
    } else {
      // Need to decrypt first
      setIsModalOpen(true);
    }
  };

  const maskedPassword = "••••••••••••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="glass-card overflow-hidden group"
    >
      {/* Card Header (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors duration-300"
      >
        <div className="flex items-center gap-4">
          {/* Website Logo or Category Icon */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--aegis-accent-teal)]/20 to-[var(--aegis-accent-blue)]/20 flex items-center justify-center border border-[var(--aegis-accent-teal)]/30">
            {url ? (
              <WebsiteLogo 
                url={url} 
                websiteName={websiteName} 
                className="w-6 h-6 rounded"
              />
            ) : (
              <CategoryIcon className="w-5 h-5 text-[var(--aegis-accent-teal)]" strokeWidth={2} />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-lg font-semibold text-white capitalize">
              {websiteName}
            </h4>
            <p className="text-sm text-[var(--aegis-text-muted)]">
              {username || email || "No identifier"}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-[var(--aegis-text-muted)]" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--aegis-border)]">
              {/* Details Section */}
              <div className="pt-4 space-y-3">
                {username && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-medium">
                      Username
                    </label>
                    <p className="text-sm text-white mt-1">{username}</p>
                  </div>
                )}

                {email && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-medium">
                      Email
                    </label>
                    <p className="text-sm text-white mt-1">{email}</p>
                  </div>
                )}

                {url && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-medium">
                      URL
                    </label>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--aegis-accent-teal)] hover:underline flex items-center gap-1 mt-1"
                    >
                      {url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {notes && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-medium">
                      Notes
                    </label>
                    <p className="text-sm text-white mt-1 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}

                {/* Password Section */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-medium">
                    Password
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`flex-1 px-4 py-3 rounded-lg bg-[var(--aegis-bg-elevated)] border font-mono text-sm text-white ${
                      error ? "border-red-400" : "border-[var(--aegis-border)]"
                    }`}>
                      {error ? (
                        <span className="text-red-400 text-xs">{error}</span>
                      ) : showPassword && password ? (
                        password
                      ) : (
                        maskedPassword
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTogglePassword}
                      disabled={loading}
                      className="w-10 h-10 rounded-lg bg-[var(--aegis-bg-elevated)] border border-[var(--aegis-border)] flex items-center justify-center text-white hover:text-[var(--aegis-accent-teal)] hover:border-[var(--aegis-accent-teal)] transition-all duration-300 disabled:opacity-50"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-400 mt-1">
                      Try re-entering your passphrase
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyPassword}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--aegis-accent-teal)] text-[var(--aegis-bg-deep)] font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all duration-300 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy Password
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEdit}
                  className="w-10 h-10 rounded-lg bg-[var(--aegis-bg-elevated)] border border-[var(--aegis-border)] flex items-center justify-center text-white hover:text-[var(--aegis-accent-blue)] hover:border-[var(--aegis-accent-blue)] transition-all duration-300"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDelete}
                  className="w-10 h-10 rounded-lg bg-[var(--aegis-bg-elevated)] border border-[var(--aegis-border)] flex items-center justify-center text-white hover:text-red-400 hover:border-red-400 transition-all duration-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Passphrase Modal - Stateless decryption */}
      <PassphraseModal
        open={isModalOpen}
        salt={passwordSalt}
        reason="Enter passphrase to decrypt"
        onSuccess={performDecryption}
        onCancel={() => setIsModalOpen(false)}
      />
    </motion.div>
  );
}
