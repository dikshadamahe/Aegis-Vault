"use client";

import { AegisLayout } from "@/components/aegis-layout";
import { VaultCard } from "@/components/vault-card";
import { AddPasswordModal } from "@/components/add-password-modal";
import { ManageCategoriesModal } from "@/components/manage-categories-modal";
import { motion } from "framer-motion";
import { Plus, Search, FolderCog } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePassphrase } from "@/providers/passphrase-provider";
import { decryptSecret } from "@/lib/crypto";

type VaultItem = {
  id: string;
  websiteName: string;
  username?: string;
  email?: string;
  url?: string;
  category: { id: string; name: string; slug: string };
  passwordCiphertext: string;
  passwordNonce: string;
  passwordSalt: string;
};

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <AegisLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
        transition={{ duration: 0.4, delay: 0.1 }}
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

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-glass md:w-64"
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

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
          className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          title="Manage Categories"
        >
          <FolderCog className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Vault Grid */}
      {isLoading ? (
        <div className="text-center text-[var(--aegis-text-muted)] py-20">
          Loading vault...
        </div>
      ) : !data || data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20"
        >
          <div className="glass-card-elevated p-12 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-[var(--aegis-bg-deep)]" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Your vault is empty</h3>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {data.map((item) => (
            <VaultCard
              key={item.id}
              {...item}
              onEdit={() => {}}
              onDelete={() => {}}
              onDecryptPassword={() => handleDecryptPassword(item)}
            />
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
