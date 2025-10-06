"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Folder, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { categoryIcon } from "@/constants/category-icon";

type ManageCategoriesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type CategoryFormData = {
  name: string;
};

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Array<{ id: string; name: string; slug: string }>;
    },
    enabled: isOpen,
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/vault/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name }),
      });

      if (!res.ok) throw new Error("Failed to create category");

      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      setDeletingId(categoryId);
      const res = await fetch(`/api/vault/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category");

      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
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
            className="relative w-full max-w-2xl glass-card-elevated"
            style={{
              padding: "var(--space-4)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
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
                  <Folder className="w-5 h-5 text-white" strokeWidth={2.5} />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--aegis-text-heading)]">
                    Manage Categories
                  </h2>
                  <p className="text-sm text-[var(--aegis-text-muted)]">
                    Organize your passwords with categories
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

            {/* Add Category Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    {...register("name", { required: "Category name is required" })}
                    type="text"
                    placeholder="Category name (e.g., Work, Personal)"
                    className="input-glass w-full"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
                    color: "white",
                    boxShadow: "var(--shadow-glow)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Plus className="w-4 h-4" strokeWidth={2} />
                  )}
                  Add
                </motion.button>
              </div>
            </form>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[var(--aegis-accent-primary)] animate-spin" strokeWidth={2} />
                </div>
              ) : categories && categories.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {categories.map((category, idx) => {
                    const Icon = categoryIcon[category.slug] || Folder;
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: idx * 0.05,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="glass-card flex items-center justify-between group"
                        style={{ padding: "var(--space-3)" }}
                      >
                        <div className="flex items-center gap-4">
                          <motion.div
                            className="w-10 h-10 rounded-lg bg-[var(--aegis-bg-elevated)] flex items-center justify-center text-[var(--aegis-accent-primary)]"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </motion.div>
                          <div>
                            <h3 className="text-base font-semibold text-[var(--aegis-text-heading)] tracking-tight">
                              {category.name}
                            </h3>
                            <p className="text-xs text-[var(--aegis-text-muted)]">
                              {category.slug}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--aegis-text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {deletingId === category.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--aegis-text-muted)]">
                  <Folder className="w-12 h-12 mb-3 opacity-50" strokeWidth={1.5} />
                  <p className="text-sm">No categories yet. Create one above.</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-4 border-t border-[var(--aegis-border)] flex justify-end">
              <motion.button
                onClick={onClose}
                className="btn-ghost"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
