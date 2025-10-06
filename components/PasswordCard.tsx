"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Copy, ExternalLink, Lock, PencilLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Favicon } from "./ui/Favicon";
import AccountPasswordModal from "./account-password-modal";
import { decryptWithEnvelope, decryptSecret } from "@/lib/crypto";
import { toast } from "sonner";
import { categoryIcon } from "@/constants/category-icon";
import { EditPasswordModal } from "./EditPasswordModal";

type PasswordCardProps = {
  item: {
    id: string;
    websiteName: string;
    username?: string | null;
    email?: string | null;
    url?: string | null;
    passwordCiphertext: string;
    passwordNonce: string;
    passwordEncryptedDek?: string | null;
    passwordDekNonce?: string | null;
    passwordSalt?: string | null;
    notesCiphertext?: string | null;
    notesNonce?: string | null;
    notesEncryptedDek?: string | null;
    notesDekNonce?: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  categories?: Array<{ id: string; name: string; slug?: string }>;
};

export function PasswordCard({ item, categories = [] }: PasswordCardProps) {
  const [localItem, setLocalItem] = useState(item);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [decryptedNotes, setDecryptedNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"view" | "edit" | null>(null);
  const masterKeyRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    setLocalItem(item);
    setDecrypted(null);
    setDecryptedNotes(null);
    setShowPassword(false);
    setError(null);
    setIsExpanded(false);
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    setPendingAction(null);
    masterKeyRef.current = null;
  }, [item]);

  useEffect(() => {
    return () => {
      masterKeyRef.current = null;
    };
  }, []);

  const normalizedUrl = normalizeUrl(localItem.url);
  const categorySlug = localItem.category?.slug;
  const CategoryGlyph = categorySlug ? categoryIcon[categorySlug] : undefined;
  const hasEncryptedNotes = Boolean(
    localItem.notesCiphertext && (localItem.notesNonce || (localItem.notesEncryptedDek && localItem.notesDekNonce))
  );
  const maskedPassword = "••••••••••••";

  // Decrypt password using the session key
  const decryptSecrets = async (key: Uint8Array) => {
    try {
      setIsDecrypting(true);
      setError(null);
      let password: string;

      if (localItem.passwordEncryptedDek && localItem.passwordDekNonce) {
        // Envelope encryption (current architecture)
        password = await decryptWithEnvelope(
          {
            ciphertext: localItem.passwordCiphertext,
            nonce: localItem.passwordNonce,
            encryptedDek: localItem.passwordEncryptedDek,
            dekNonce: localItem.passwordDekNonce,
          },
          key
        );
      } else if (localItem.passwordCiphertext && localItem.passwordNonce) {
        // Legacy fallback (no encrypted DEK stored)
        password = await decryptSecret(
          {
            ciphertext: localItem.passwordCiphertext,
            nonce: localItem.passwordNonce,
          },
          key
        );
      } else {
        throw new Error("Encrypted password payload is incomplete.");
      }

      setDecrypted(password);
      if (localItem.notesCiphertext) {
        try {
          let notes: string | null = null;
          if (localItem.notesEncryptedDek && localItem.notesDekNonce && localItem.notesNonce) {
            notes = await decryptWithEnvelope(
              {
                ciphertext: localItem.notesCiphertext,
                nonce: localItem.notesNonce,
                encryptedDek: localItem.notesEncryptedDek,
                dekNonce: localItem.notesDekNonce,
              },
              key
            );
          } else if (localItem.notesNonce) {
            notes = await decryptSecret(
              {
                ciphertext: localItem.notesCiphertext,
                nonce: localItem.notesNonce,
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
      setPendingAction("view");
      setIsModalOpen(true);
    }
  };

  const handleAccountPasswordSuccess = async (key: Uint8Array) => {
    try {
      await decryptSecrets(key);
      masterKeyRef.current = key;
      if (pendingAction === "edit") {
        setIsEditModalOpen(true);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleEditClick = () => {
    if (isDecrypting) return;
    if (decrypted && masterKeyRef.current) {
      setIsEditModalOpen(true);
      setPendingAction(null);
      return;
    }
    setPendingAction("edit");
    setIsModalOpen(true);
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

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    masterKeyRef.current = null;
    setPendingAction(null);
  };

  const handleEditSuccess = (payload: {
    password: string;
    notes: string | null;
    websiteName: string;
    username?: string;
    email?: string;
    url?: string;
    categoryId?: string;
    encrypted?: {
      passwordCiphertext: string;
      passwordNonce: string;
      passwordEncryptedDek?: string | null;
      passwordDekNonce?: string | null;
      passwordSalt?: string | null;
      notesCiphertext?: string | null;
      notesNonce?: string | null;
      notesEncryptedDek?: string | null;
      notesDekNonce?: string | null;
    };
  }) => {
    setDecrypted(payload.password);
    setDecryptedNotes(payload.notes);
    setShowPassword(true);
    setLocalItem((prev) => {
      const nextCategory = (() => {
        if (payload.categoryId === undefined) {
          return prev.category ?? null;
        }
        if (!payload.categoryId) {
          return null;
        }
        const lookup = categories.find((category) => category.id === payload.categoryId);
        if (lookup) {
          return {
            id: lookup.id,
            name: lookup.name,
            slug: lookup.slug ?? prev.category?.slug ?? lookup.name.toLowerCase(),
          };
        }
        if (prev.category?.id === payload.categoryId) {
          return prev.category;
        }
        return null;
      })();

      return {
        ...prev,
        websiteName: payload.websiteName,
        username: payload.username ?? (payload.username === undefined ? prev.username ?? null : null),
        email: payload.email ?? (payload.email === undefined ? prev.email ?? null : null),
        url: payload.url ?? (payload.url === undefined ? prev.url ?? null : null),
        category: nextCategory,
        passwordCiphertext: payload.encrypted?.passwordCiphertext ?? prev.passwordCiphertext,
        passwordNonce: payload.encrypted?.passwordNonce ?? prev.passwordNonce,
        passwordEncryptedDek: payload.encrypted?.passwordEncryptedDek ?? prev.passwordEncryptedDek,
        passwordDekNonce: payload.encrypted?.passwordDekNonce ?? prev.passwordDekNonce,
        passwordSalt: payload.encrypted?.passwordSalt ?? prev.passwordSalt,
        notesCiphertext: payload.encrypted?.notesCiphertext ?? prev.notesCiphertext,
        notesNonce: payload.encrypted?.notesNonce ?? prev.notesNonce,
        notesEncryptedDek: payload.encrypted?.notesEncryptedDek ?? prev.notesEncryptedDek,
        notesDekNonce: payload.encrypted?.notesDekNonce ?? prev.notesDekNonce,
      };
    });
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
            {CategoryGlyph ? (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--aegis-border)] bg-[var(--aegis-bg-card)] text-[var(--aegis-accent-primary)]"
                aria-hidden
              >
                <CategoryGlyph className="h-6 w-6" strokeWidth={2.25} />
              </span>
            ) : (
              <Favicon domain={normalizedUrl?.hostname ?? localItem.websiteName} size={96} className="w-12 h-12" />
            )}
          </motion.div>

          {/* Website Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--aegis-text-heading)] tracking-tight truncate">
              {localItem.websiteName}
            </h3>
            {localItem.username && (
              <p className="text-sm text-[var(--aegis-text-muted)] truncate">
                {localItem.username}
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
                        value={localItem.username ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {localItem.username && (
                        <motion.button
                          onClick={() => handleCopy(localItem.username, "Username")}
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
                        value={localItem.email ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {localItem.email && (
                        <motion.button
                          onClick={() => handleCopy(localItem.email ?? "", "Email")}
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
                        value={localItem.url ?? "Not provided"}
                        readOnly
                        className="input-glass flex-1 text-sm"
                      />
                      {normalizedUrl?.href && (
                        <motion.a
                          href={normalizedUrl.href}
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
                        ? "Notes are encrypted. Unlock with your account password."
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

                <div className="flex items-center justify-end gap-3 pt-2">
                  <motion.button
                    onClick={handleEditClick}
                    className="group flex items-center gap-2 rounded-xl border border-[var(--aegis-border)] bg-[var(--aegis-bg-card)] px-5 py-2 text-sm font-medium text-[var(--aegis-text-heading)] transition-all duration-300 disabled:opacity-60"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isDecrypting}
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--aegis-bg-elevated)] text-[var(--aegis-accent-primary)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
                      <PencilLine className="h-4 w-4" strokeWidth={2.1} />
                    </span>
                    <span className="bg-gradient-to-r from-[var(--aegis-text-heading)] to-[var(--aegis-accent-primary)] bg-clip-text text-transparent">
                      Edit Entry
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Authentication modal reused for decrypting and editing */}
      <AccountPasswordModal
        open={isModalOpen}
        submitLabel={pendingAction === "edit" ? "Unlock" : "Decrypt"}
        title={pendingAction === "edit" ? "Unlock Entry" : "Decrypt Password"}
        description={
          pendingAction === "edit"
            ? "Enter your account password to decrypt and enable editing for this entry."
            : "Enter your account password to decrypt this entry."
        }
        onAuthenticated={handleAccountPasswordSuccess}
        onCancel={() => {
          setIsModalOpen(false);
          setPendingAction(null);
        }}
      />

      <EditPasswordModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        item={localItem}
        categories={categories}
        decryptedPassword={decrypted}
        decryptedNotes={decryptedNotes}
        masterKey={masterKeyRef.current}
        onUpdated={handleEditSuccess}
      />
    </>
  );
}

function normalizeUrl(rawUrl: string | null | undefined): { href: string; hostname: string } | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return { href: url.href, hostname: url.hostname.replace(/^www\./, "") };
  } catch (error) {
    console.warn("Failed to normalize URL", rawUrl, error);
    return undefined;
  }
}
