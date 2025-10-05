"use client";

import { AegisLayout } from "@/components/aegis-layout";
import { PasswordAccordionCard } from "@/components/password-accordion-card";
import { AddPasswordModal } from "@/components/add-password-modal";
import { ManageCategoriesModal } from "@/components/manage-categories-modal";
import { motion } from "framer-motion";
import { Plus, Search, FolderCog } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePassphrase } from "@/providers/passphrase-provider";
import { decryptSecret } from "@/lib/crypto";

type VaultItem = {
  id: string;
  websiteName: string;
  username?: string;
  email?: string;
  url?: string;
  notes?: string;
  category: { id: string; name: string; slug: string };
  passwordCiphertext: string;
  passwordNonce: string;
  passwordSalt: string;
};

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const { getKeyForSalt } = usePassphrase();

  // Fetch vault items
  const { data, isLoading } = useQuery({
    queryKey: ["vault-items", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/vault/items?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch vault items");
      const json = await res.json();
      return json.items as VaultItem[];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/vault/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      return json.categories as Array<{ id: string; name: string; slug: string }>;
    },
  });

  const handleDecryptPassword = async (item: VaultItem) => {
    const key = await getKeyForSalt(item.passwordSalt);
    const decrypted = await decryptSecret(
      {
        ciphertext: item.passwordCiphertext,
        nonce: item.passwordNonce,
      },
      key
    );
    return decrypted;
  };

  // Group passwords by category
  const groupedPasswords = useMemo(() => {
    if (!data) return {};
    
    const groups: Record<string, VaultItem[]> = {};
    data.forEach((item) => {
      const categoryName = item.category.name;
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    
    return groups;
  }, [data]);

  const categoryKeys = Object.keys(groupedPasswords);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const categoryContainer = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut",
        staggerChildren: 0.06,
      },
    },
  };

  const handleCategoryFilter = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
  };

  return (
    <AegisLayout 
      onCategoryFilter={handleCategoryFilter}
      selectedCategory={selectedCategory}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[var(--aegis-text-heading)] to-[var(--aegis-accent-teal)] bg-clip-text text-transparent">
          Aegis Vault
        </h1>
        <p className="text-[var(--aegis-text-muted)] text-lg">
          Your passwords, encrypted and secure.
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeInOut" }}
        className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--aegis-text-muted)]" />
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass pl-12"
          />
        </div>

        {/* Add New Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddModalOpen(true)}
          className="btn-accent flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add New
        </motion.button>

        {/* Manage Categories Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCategoriesModalOpen(true)}
          className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-300"
          title="Manage Categories"
        >
          <FolderCog className="w-5 h-5 text-white" />
        </motion.button>
      </motion.div>

      {/* Vault Content */}
      {isLoading ? (
        <div className="text-center text-[var(--aegis-text-muted)] py-20">
          Loading vault...
        </div>
      ) : !data || data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="text-center py-20"
        >
          <div className="glass-card-elevated p-12 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-[var(--aegis-bg-deep)]" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-white">Your vault is empty</h3>
            <p className="text-[var(--aegis-text-muted)] mb-6">
              Start by adding your first password
            </p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-accent">
              Add Your First Password
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          {categoryKeys.map((categoryName) => (
            <motion.div
              key={categoryName}
              variants={categoryContainer}
              className="space-y-4"
            >
              {/* Category Header */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--aegis-border)] to-transparent" />
                <h2 className="text-2xl font-bold text-white">
                  {categoryName}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--aegis-border)] to-transparent" />
              </motion.div>

              {/* Password Cards for this Category */}
              <div className="space-y-3">
                {groupedPasswords[categoryName].map((item) => (
                  <PasswordAccordionCard
                    key={item.id}
                    {...item}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onDecryptPassword={() => handleDecryptPassword(item)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Password Modal */}
      <AddPasswordModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        open={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </AegisLayout>
  );
}
