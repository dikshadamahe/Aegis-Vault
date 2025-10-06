"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Shield, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AccountPasswordModal from "./account-password-modal";
import { encryptWithEnvelope } from "@/lib/crypto";
import { useSession } from "next-auth/react";

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
  categories?: Array<{ id: string; name: string; slug?: string }>;
};

export function AddPasswordModal({ isOpen, onClose, categories: categoriesProp = [] }: AddPasswordModalProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [seedTriggered, setSeedTriggered] = useState(false);

  const shouldFetchCategories = isOpen && categoriesProp.length === 0;

  const { data: fetchedCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Array<{ id: string; name: string; slug: string }>;
    },
    staleTime: 1000 * 30,
    enabled: shouldFetchCategories,
  });

  const {
    mutate: seedCategories,
    isPending: isSeedingCategories,
  } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vault/categories/seed", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to seed categories" }));
        throw new Error(body.error || "Failed to seed categories");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to seed categories");
      setSeedTriggered(false);
    },
  });

  useEffect(() => {
    if (
      shouldFetchCategories &&
      !isLoadingCategories &&
      fetchedCategories.length === 0 &&
      !seedTriggered &&
      !isSeedingCategories
    ) {
      setSeedTriggered(true);
      seedCategories();
    }
  }, [
    shouldFetchCategories,
    isLoadingCategories,
    fetchedCategories.length,
    seedTriggered,
    isSeedingCategories,
    seedCategories,
  ]);

  const categories = useMemo(
    () => (categoriesProp.length > 0 ? categoriesProp : fetchedCategories),
    [categoriesProp, fetchedCategories]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleAuthenticatedKey = async (mek: Uint8Array) => {
    try {
      setIsSubmitting(true);
      const formData = getValues();

      // Encrypt password with envelope encryption (MEK encrypts auto-generated DEK)
      const passwordPayload = await encryptWithEnvelope(formData.password, mek);
      const notesPayload = formData.notes && formData.notes.trim()
        ? await encryptWithEnvelope(formData.notes.trim(), mek)
        : null;

      const encryptionSalt = ((session as any)?.encryptionSalt ?? (session?.user as any)?.encryptionSalt) as
        | string
        | undefined;

      // Submit to API
      const res = await fetch("/api/vault/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteName: formData.websiteName,
          url: formData.url || undefined,
          username: formData.username || undefined,
          email: formData.email || undefined,
          passwordCiphertext: passwordPayload.ciphertext,
          passwordNonce: passwordPayload.nonce,
          passwordEncryptedDek: passwordPayload.encryptedDek,
          passwordDekNonce: passwordPayload.dekNonce,
          passwordSalt: encryptionSalt,
          categoryId: formData.categoryId || undefined,
          notesCiphertext: notesPayload?.ciphertext,
          notesNonce: notesPayload?.nonce,
          notesEncryptedDek: notesPayload?.encryptedDek,
          notesDekNonce: notesPayload?.dekNonce,
        }),
      });

      if (!res.ok) throw new Error("Failed to save password");

      toast.success("Password saved successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
      reset();
      onClose();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (isSubmitting) return;
    setIsAuthModalOpen(true);
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
                {isLoadingCategories || isSeedingCategories ? (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Category
                    </label>
                    <div className="input-glass w-full flex items-center gap-2 text-[var(--aegis-text-muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      {isSeedingCategories
                        ? "Preparing default categories..."
                        : "Loading categories..."}
                    </div>
                  </div>
                ) : categories.length > 0 ? (
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
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                      Category
                    </label>
                    <p className="text-xs text-[var(--aegis-text-muted)] bg-[var(--aegis-bg-card)] border border-dashed border-[var(--aegis-border)] rounded-lg p-3">
                      No categories available yet. Default categories should appear shortly; try reopening this dialog if they do not.
                    </p>
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

      <AccountPasswordModal
        open={isAuthModalOpen}
        submitLabel="Encrypt"
        title="Encrypt Password"
        description="Confirm with your account password to encrypt and store this entry."
        onAuthenticated={handleAuthenticatedKey}
        onCancel={() => {
          if (!isSubmitting) {
            setIsAuthModalOpen(false);
          }
        }}
      />
    </>
  );
}
