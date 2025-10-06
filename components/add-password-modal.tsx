"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Globe, User, Mail, FileText, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { encryptWithEnvelope } from "@/lib/crypto";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { categoryIcon } from "@/constants/category-icon";
import PassphraseModal from "./passphrase-modal";
import { useSession } from "next-auth/react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type AddPasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddPasswordModal({ open, onClose }: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    websiteName: "",
    username: "",
    email: "",
    password: "",
    url: "",
    notes: "",
    categoryId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const { data: session } = useSession();

  const queryClient = useQueryClient();

  // Fetch categories directly in the modal
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Category[];
    },
    enabled: open, // Only fetch when modal is open
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, mek }: { data: typeof formData; mek: Uint8Array }) => {
      // ENVELOPE ENCRYPTION: Encrypt password with DEK, then encrypt DEK with MEK
      const passwordPayload = await encryptWithEnvelope(data.password, mek);

      // Encrypt notes if provided (using envelope encryption)
      let notesPayload = null;
      if (data.notes.trim()) {
        notesPayload = await encryptWithEnvelope(data.notes, mek);
      }

      // Build API payload with envelope encryption fields
      const payload = {
        websiteName: data.websiteName,
        username: data.username || undefined,
        email: data.email || undefined,
        url: data.url || undefined,
        category: data.categoryId,
        // Password envelope encryption fields
        passwordCiphertext: passwordPayload.ciphertext,
        passwordNonce: passwordPayload.nonce,
        passwordEncryptedDek: passwordPayload.encryptedDek,
        passwordDekNonce: passwordPayload.dekNonce,
        // For compatibility, store user's encryptionSalt alongside item
        passwordSalt: (session as any)?.encryptionSalt || "",
        // Notes envelope encryption fields (if provided)
        notesCiphertext: notesPayload?.ciphertext,
        notesNonce: notesPayload?.nonce,
        notesEncryptedDek: notesPayload?.encryptedDek,
        notesDekNonce: notesPayload?.dekNonce,
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

    // Open passphrase modal to derive MEK using user's encryptionSalt
    setIsPassphraseModalOpen(true);
  };
  
  // Handle successful passphrase entry
  const handlePassphraseSuccess = async (mek: Uint8Array) => {
    setIsPassphraseModalOpen(false);
    createMutation.mutate({ data: formData, mek });
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title & Category - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Title <span className="text-[var(--aegis-accent-teal)]">*</span>
                    </label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                      <input
                        type="text"
                        value={formData.websiteName}
                        onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                        placeholder="e.g., GitHub, Gmail, Netflix"
                        className="input-glass pl-12 w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Category <span className="text-[var(--aegis-accent-teal)]">*</span>
                    </label>
                    <div className="relative group">
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="input-glass pl-4 w-full appearance-none cursor-pointer"
                        required
                        disabled={categoriesLoading}
                      >
                        <option value="">
                          {categoriesLoading ? "Loading categories..." : "Select a category"}
                        </option>
                        {categories?.map((cat) => {
                          const Icon = categoryIcon[cat.slug];
                          return (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          );
                        })}
                      </select>
                      {/* Custom dropdown icon */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-[var(--aegis-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {categories && categories.length === 0 && (
                      <p className="text-xs text-[var(--aegis-text-muted)] mt-1">
                        No categories yet. Create one in the category manager.
                      </p>
                    )}
                  </div>
                </div>

                {/* Username & Email - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Username
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                        className="input-glass pl-12 w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="input-glass pl-12 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & URL - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Password <span className="text-[var(--aegis-accent-teal)]">*</span>
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        className="input-glass pl-12 pr-12 w-full"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-teal)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                      Website URL
                    </label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com"
                        className="input-glass pl-12 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes - Full Width */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--aegis-text-body)] mb-2">
                    Notes
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-[var(--aegis-text-muted)] group-focus-within:text-[var(--aegis-accent-teal)] transition-colors" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any additional notes (optional)"
                      rows={4}
                      className="input-glass pl-12 resize-none w-full"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-white/10">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="flex-1 px-6 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--aegis-text-body)] font-semibold transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={createMutation.isPending}
                    className="flex-1 btn-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3.5"
                  >
                    {createMutation.isPending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        <span>Encrypting...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Add Password</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
      
      {/* Passphrase Modal for encryption */}
      {isPassphraseModalOpen && (
        <PassphraseModal
          open={isPassphraseModalOpen}
          reason="Enter passphrase to encrypt password"
              onKeyDerived={handlePassphraseSuccess}
          onCancel={() => setIsPassphraseModalOpen(false)}
        />
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
