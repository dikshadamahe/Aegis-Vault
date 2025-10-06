"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Folder, Lock, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PasswordCard } from "@/components/PasswordCard";
import { AddPasswordModal } from "@/components/AddPasswordModal";
import { ManageCategoriesModal } from "@/components/ManageCategoriesModal";
import { useAppStore } from "@/store/app-store";

type VaultItem = {
  id: string;
  websiteName: string;
  username?: string | null;
  email?: string | null;
  url?: string | null;
  passwordCiphertext: string;
  passwordNonce: string;
  passwordEncryptedDek?: string | null;
  passwordDekNonce?: string | null;
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

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const { selectedCategory } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vault-items"],
    queryFn: async () => {
      const res = await fetch("/api/vault/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      const json = await res.json();
      return json.items as VaultItem[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Array<{ id: string; name: string }>;
    },
  });

  // Filter logic
  const filteredItems = useMemo(() => {
    if (!data) return [] as VaultItem[];
    const query = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      const matchesSearch = query
        ? item.websiteName.toLowerCase().includes(query) ||
          (item.username?.toLowerCase().includes(query) ?? false) ||
          (item.email?.toLowerCase().includes(query) ?? false)
        : true;

      const matchesCategory = selectedCategory
        ? item.category?.slug === selectedCategory
        : true;

      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, selectedCategory]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 
              className="text-5xl font-bold tracking-tight mb-2 bg-gradient-to-r from-[var(--aegis-text-heading)] via-[var(--aegis-accent-primary)] to-[var(--aegis-accent-teal)] bg-clip-text text-transparent"
              style={{ 
                lineHeight: "1.2", 
                paddingBottom: "0.125rem",
                overflow: "visible" 
              }}
            >
              Aegis Vault
            </h1>
            <p className="text-[var(--aegis-text-muted)] text-lg">
              Your passwords, encrypted and secure.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setIsAddModalOpen(true)}
              className="h-12 px-6 rounded-lg flex items-center gap-2 font-medium transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
                color: "white",
                boxShadow: "var(--shadow-glow)",
              }}
              whileHover={{ scale: 1.02, y: -2, boxShadow: "0 0 32px rgba(0, 174, 239, 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add Password
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass w-full pl-12"
            style={{ height: "48px" }}
          />
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--aegis-accent-primary)] animate-spin mb-4" strokeWidth={2} />
          <p className="text-[var(--aegis-text-muted)]">Loading your vault...</p>
        </div>
      ) : error ? (
        <div className="glass-card text-center py-12" style={{ padding: "var(--space-5)" }}>
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" strokeWidth={2} />
          <h3 className="text-xl font-semibold text-[var(--aegis-text-heading)] mb-2">
            Failed to load vault
          </h3>
          <p className="text-[var(--aegis-text-muted)]">
            Please try refreshing the page
          </p>
        </div>
  ) : filteredItems.length > 0 ? (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <PasswordCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card text-center py-20"
          style={{ padding: "var(--space-6)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Lock className="w-16 h-16 text-[var(--aegis-text-muted)] mx-auto mb-4 opacity-50" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-[var(--aegis-text-heading)] mb-2">
              {searchQuery ? "No passwords found" : "Your vault is empty"}
            </h3>
            <p className="text-[var(--aegis-text-muted)] mb-6">
              {searchQuery 
                ? "Try a different search term" 
                : "Get started by adding your first password"
              }
            </p>
            {!searchQuery && (
              <motion.button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-accent"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4 inline mr-2" strokeWidth={2.5} />
                Add Your First Password
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Modals */}
      <AddPasswordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
      />
      
      <ManageCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </DashboardLayout>
  );
}
