"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, FolderPlus, X } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryIcon } from "@/constants/category-icon";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ManageCategoriesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ManageCategoriesModal({ open, onClose }: ManageCategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Category[];
    },
    enabled: open,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/vault/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create category" }));
        throw new Error(err.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vault/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete category" }));
        throw new Error(err.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Category deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  // Seed default categories mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vault/categories/seed", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to seed categories" }));
        throw new Error(err.error || "Failed to seed categories");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Default categories added!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to seed categories");
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    createMutation.mutate(newCategoryName);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? All passwords in this category will be affected.`)) {
      deleteMutation.mutate(id);
    }
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
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-card-elevated w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center">
                    <FolderPlus className="w-5 h-5 text-[var(--aegis-bg-deep)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--aegis-text-heading)]">
                      Manage Categories
                    </h2>
                    <p className="text-sm text-[var(--aegis-text-muted)]">
                      Organize your passwords
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--aegis-text-muted)]" />
                </motion.button>
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleCreateCategory} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    className="input-glass flex-1"
                    disabled={createMutation.isPending}
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={createMutation.isPending}
                    className="btn-accent flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </motion.button>
                </div>
              </form>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-center text-[var(--aegis-text-muted)] py-8">
                    Loading categories...
                  </div>
                ) : !categories || categories.length === 0 ? (
                  <div className="text-center text-[var(--aegis-text-muted)] py-8">
                    <p className="mb-4">No categories yet. Create your first one above!</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => seedMutation.mutate()}
                      disabled={seedMutation.isPending}
                      className="btn-accent mx-auto disabled:opacity-50"
                    >
                      {seedMutation.isPending ? "Adding..." : "Add Default Categories"}
                    </motion.button>
                  </div>
                ) : (
                  categories.map((category) => {
                    const Icon = categoryIcon[category.slug];
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-4 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          {Icon && (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--aegis-accent-teal)]/20 to-[var(--aegis-accent-blue)]/20 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[var(--aegis-accent-teal)]" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-medium text-[var(--aegis-text-heading)]">
                              {category.name}
                            </h3>
                            <p className="text-sm text-[var(--aegis-text-muted)]">
                              {category.slug}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          disabled={deleteMutation.isPending}
                          className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </motion.button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--aegis-text-body)] font-medium transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
