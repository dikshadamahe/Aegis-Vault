"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Globe, User, Mail, FileText, Folder } from "lucide-react";
import { useState } from "react";
import { usePassphrase } from "@/providers/passphrase-provider";
import { encryptSecret } from "@/lib/crypto";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type AddPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
};

export function AddPasswordModal({ open, onClose, categories }: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    websiteName: "",
    username: "",
    email: "",
    password: "",
    url: "",
    notes: "",
    categoryId: "",
  });

  const { getKeyForSalt, genSalt } = usePassphrase();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Generate salt for this password
      const salt = genSalt();
      const saltB64 = u8ToBase64(salt);

      // Derive key from user's passphrase
      const key = await getKeyForSalt(salt);

      // Encrypt password
      const passwordPayload = await encryptSecret(data.password, key);

      // Encrypt notes if provided
      let notesPayload = null;
      if (data.notes.trim()) {
        notesPayload = await encryptSecret(data.notes, key);
      }

      // Build API payload
      const payload = {
        websiteName: data.websiteName,
        username: data.username || undefined,
        email: data.email || undefined,
        url: data.url || undefined,
        category: data.categoryId,
        passwordCiphertext: passwordPayload.ciphertext,
        passwordNonce: passwordPayload.nonce,
        passwordSalt: saltB64,
        notesCiphertext: notesPayload?.ciphertext,
        notesNonce: notesPayload?.nonce,
      };

      const res = await fetch("/api/vault/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create password" }));
        throw new Error(err.error || "Failed to create password");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Password added successfully!");
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add password");
    },
  });

  const handleClose = () => {
    setFormData({
      websiteName: "",
      username: "",
      email: "",
      password: "",
      url: "",
      notes: "",
      categoryId: "",
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.websiteName.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-card-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[var(--aegis-bg-deep)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--aegis-text-heading)]">
                      Add New Password
                    </h2>
                    <p className="text-sm text-[var(--aegis-text-muted)]">
                      Securely store a new password
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--aegis-text-muted)]" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                    Title <span className="text-[var(--aegis-accent-teal)]">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                    <input
                      type="text"
                      value={formData.websiteName}
                      onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                      placeholder="e.g., GitHub, Gmail, Netflix"
                      className="input-glass pl-12"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                    Category <span className="text-[var(--aegis-accent-teal)]">*</span>
                  </label>
                  <div className="relative">
                    <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="input-glass pl-12"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Username and Email (side by side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                        className="input-glass pl-12"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="input-glass pl-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                    Password <span className="text-[var(--aegis-accent-teal)]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="input-glass pl-12"
                      required
                    />
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com"
                      className="input-glass pl-12"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-[var(--aegis-text-body)] mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-[var(--aegis-text-muted)]" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                      rows={4}
                      className="input-glass pl-12 resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--aegis-text-body)] font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={createMutation.isPending}
                    className="flex-1 btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? "Adding..." : "Add Password"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper to convert Uint8Array to base64
function u8ToBase64(u8: Uint8Array): string {
  let binary = "";
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
  if (typeof btoa === "function") return btoa(binary);
  throw new Error("Base64 encoding not supported");
}
