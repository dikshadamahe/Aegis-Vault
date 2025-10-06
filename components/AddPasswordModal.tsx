"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import PassphraseModal from "./passphrase-modal";
import { encryptWithEnvelope } from "@/lib/crypto";
import { useVault } from "@/providers/VaultProvider";

const passwordSchema = z.object({
  websiteName: z.string().min(1, "Website name is required"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  username: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(1, "Password is required"),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

type AddPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  categories?: Array<{ id: string; name: string }>;
};

export function AddPasswordModal({ isOpen, onClose, categories = [] }: AddPasswordModalProps) {
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { isLocked, encryptionKey, resetInactivityTimer } = useVault();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleKeyDerived = async (mek: Uint8Array) => {
    try {
      setIsSubmitting(true);
      resetInactivityTimer(); // Reset timer on vault activity
      const formData = getValues();

      // Encrypt password with envelope encryption (MEK encrypts auto-generated DEK)
      const { ciphertext, nonce, encryptedDek, dekNonce } = await encryptWithEnvelope(
        formData.password,
        mek
      );

      // Submit to API
      const res = await fetch("/api/vault/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteName: formData.websiteName,
          url: formData.url || undefined,
          username: formData.username || undefined,
          email: formData.email || undefined,
          passwordCiphertext: ciphertext,
          passwordNonce: nonce,
          passwordEncryptedDek: encryptedDek,
          passwordDekNonce: dekNonce,
          categoryId: formData.categoryId || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save password");

      toast.success("Password saved successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
      reset();
      onClose();
      setIsPassphraseModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (isLocked) {
      // Vault is locked - show passphrase modal first
      setIsPassphraseModalOpen(true);
    } else if (encryptionKey) {
      // Vault is unlocked - encrypt and save immediately
      await handleKeyDerived(encryptionKey);
    }
  };

  const handleVaultUnlocked = async () => {
    setIsPassphraseModalOpen(false);
    // After unlock, encrypt with the session key
    if (encryptionKey) {
      await handleKeyDerived(encryptionKey);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1]
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl glass-card-elevated"
              style={{
                padding: "var(--space-4)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
                    }}
                    whileHover={{ rotate: 5, scale: 1.05 }}
                  >
                    <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--aegis-text-heading)]">
                      Add New Password
                    </h2>
                    <p className="text-sm text-[var(--aegis-text-muted)]">
                      Securely store a new password entry
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--aegis-text-muted)] hover:bg-[var(--aegis-bg-card)] hover:text-[var(--aegis-text-heading)] transition-all duration-300"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Website Name - Full Width */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Website Name *
                  </label>
                  <input
                    {...register("websiteName")}
                    type="text"
                    placeholder="e.g., GitHub, Gmail, Netflix"
                    className="input-glass w-full"
                  />
                  {errors.websiteName && (
                    <p className="text-xs text-red-400">{errors.websiteName.message}</p>
                  )}
                </div>

                {/* URL - Full Width */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    URL
                  </label>
                  <input
                    {...register("url")}
                    type="text"
                    placeholder="https://example.com"
                    className="input-glass w-full"
                  />
                  {errors.url && (
                    <p className="text-xs text-red-400">{errors.url.message}</p>
                  )}
                </div>

                {/* Two Column Layout: Username & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Username
                    </label>
                    <input
                      {...register("username")}
                      type="text"
                      placeholder="username"
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Email
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="user@example.com"
                      className="input-glass w-full"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Password - Full Width */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Password *
                  </label>
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="Enter password"
                    className="input-glass w-full font-mono"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Category - Full Width */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Category
                    </label>
                    <select {...register("categoryId")} className="input-glass w-full">
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes - Full Width */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                    Notes
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Optional notes..."
                    className="input-glass w-full"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-accent flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" strokeWidth={2} />
                        Save Password
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passphrase Modal - Only shown when vault is locked */}
      {isPassphraseModalOpen && (
        <PassphraseModal
          onUnlocked={handleVaultUnlocked}
          onCancel={() => {
            setIsPassphraseModalOpen(false);
            setIsSubmitting(false);
          }}
        />
      )}
    </>
  );
}
