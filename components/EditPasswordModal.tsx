"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PencilLine, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { encryptWithEnvelope } from "@/lib/crypto";
import { useQueryClient } from "@tanstack/react-query";
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

type CategoryOption = { id: string; name: string; slug?: string };

type EditPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    websiteName: string;
    username?: string | null;
    email?: string | null;
    url?: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  categories?: CategoryOption[];
  decryptedPassword: string | null;
  decryptedNotes: string | null;
  masterKey: Uint8Array | null;
  onUpdated?: (payload: {
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
  }) => void;
};

export function EditPasswordModal({
  isOpen,
  onClose,
  item,
  categories: categoriesProp = [],
  decryptedPassword,
  decryptedNotes,
  masterKey,
  onUpdated,
}: EditPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const categories = useMemo(() => categoriesProp, [categoriesProp]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      websiteName: item.websiteName ?? "",
      url: item.url ?? "",
      username: item.username ?? "",
      email: item.email ?? "",
      password: decryptedPassword ?? "",
      notes: decryptedNotes ?? "",
      categoryId: item.category?.id ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        websiteName: item.websiteName ?? "",
        url: item.url ?? "",
        username: item.username ?? "",
        email: item.email ?? "",
        password: decryptedPassword ?? "",
        notes: decryptedNotes ?? "",
        categoryId: item.category?.id ?? "",
      });
    }
  }, [isOpen, item, decryptedPassword, decryptedNotes, reset]);

  const handleSave = async (values: PasswordFormData) => {
    if (!masterKey) {
      toast.error("Session expired. Please authenticate again to edit this entry.");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const passwordPayload = await encryptWithEnvelope(values.password, masterKey);
      const trimmedNotes = values.notes?.trim() ?? "";
      const notesPayload = trimmedNotes
        ? await encryptWithEnvelope(trimmedNotes, masterKey)
        : null;

      const encryptionSalt = ((session as any)?.encryptionSalt ?? (session?.user as any)?.encryptionSalt) as
        | string
        | undefined;

      if (!encryptionSalt) {
        throw new Error("Missing encryption salt. Please sign out and sign back in.");
      }

      const response = await fetch(`/api/vault/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteName: values.websiteName,
          url: values.url || undefined,
          username: values.username || undefined,
          email: values.email || undefined,
          passwordCiphertext: passwordPayload.ciphertext,
          passwordNonce: passwordPayload.nonce,
          passwordEncryptedDek: passwordPayload.encryptedDek,
          passwordDekNonce: passwordPayload.dekNonce,
          passwordSalt: encryptionSalt,
          categoryId: values.categoryId || undefined,
          notesCiphertext: notesPayload?.ciphertext,
          notesNonce: notesPayload?.nonce,
          notesEncryptedDek: notesPayload?.encryptedDek,
          notesDekNonce: notesPayload?.dekNonce,
        }),
      });

      let responseBody: any = null;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        let message = "Failed to update password";
        const dataError = responseBody?.error;
        if (typeof dataError === "string") message = dataError;
        else if (dataError?.message) message = dataError.message;
        throw new Error(message);
      }

      toast.success("Password updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
      onUpdated?.({
        password: values.password,
        notes: trimmedNotes || null,
        websiteName: values.websiteName,
        username: values.username || undefined,
        email: values.email || undefined,
        url: values.url || undefined,
        categoryId: values.categoryId || undefined,
        encrypted: responseBody?.item
          ? {
              passwordCiphertext: responseBody.item.passwordCiphertext,
              passwordNonce: responseBody.item.passwordNonce,
              passwordEncryptedDek: responseBody.item.passwordEncryptedDek,
              passwordDekNonce: responseBody.item.passwordDekNonce,
              passwordSalt: responseBody.item.passwordSalt,
              notesCiphertext: responseBody.item.notesCiphertext,
              notesNonce: responseBody.item.notesNonce,
              notesEncryptedDek: responseBody.item.notesEncryptedDek,
              notesDekNonce: responseBody.item.notesDekNonce,
            }
          : undefined,
      });
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-3xl glass-card-elevated"
            style={{
              padding: "var(--space-4)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
                }}
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <PencilLine className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--aegis-text-heading)]">
                  Edit Password Entry
                </h2>
                <p className="text-sm text-[var(--aegis-text-muted)]">Update the stored credentials safely.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                  Website Name *
                </label>
                <input
                  {...register("websiteName")}
                  type="text"
                  placeholder="e.g., GitHub"
                  className="input-glass w-full"
                  disabled={isSubmitting}
                />
                {errors.websiteName && (
                  <p className="text-xs text-red-400">{errors.websiteName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                  URL
                </label>
                <input
                  {...register("url")}
                  type="text"
                  placeholder="https://example.com"
                  className="input-glass w-full"
                  disabled={isSubmitting}
                />
                {errors.url && <p className="text-xs text-red-400">{errors.url.message}</p>}
              </div>

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                  Password *
                </label>
                <input
                  {...register("password")}
                  type="text"
                  className="input-glass w-full font-mono"
                  disabled={isSubmitting}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                  Category
                </label>
                {categories.length > 0 ? (
                  <select {...register("categoryId")} className="input-glass w-full" disabled={isSubmitting}>
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[var(--aegis-text-muted)] bg-[var(--aegis-bg-card)] border border-dashed border-[var(--aegis-border)] rounded-lg p-3">
                    No categories found. Manage categories from the dashboard to organize your vault.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] font-semibold">
                  Notes
                </label>
                <textarea
                  {...register("notes")}
                  placeholder="Optional notes..."
                  className="input-glass w-full"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (!isSubmitting) onClose();
                  }}
                  className="btn-ghost"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="btn-accent flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" strokeWidth={2} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
