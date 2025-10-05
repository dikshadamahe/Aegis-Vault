"use client";

import { motion } from "framer-motion";
import { Copy, Eye, EyeOff, Edit, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type VaultCardProps = {
  id: string;
  websiteName: string;
  username?: string;
  email?: string;
  url?: string;
  category: { name: string; slug: string };
  onEdit: () => void;
  onDelete: () => void;
  onDecryptPassword: () => Promise<string>;
};

export function VaultCard({
  id,
  websiteName,
  username,
  email,
  url,
  category,
  onEdit,
  onDelete,
  onDecryptPassword,
}: VaultCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCopyPassword = async () => {
    setLoading(true);
    try {
      const decrypted = await onDecryptPassword();
      await navigator.clipboard.writeText(decrypted);
      toast.success("Password copied!", {
        description: "Password copied to clipboard securely.",
      });
    } catch (error) {
      toast.error("Failed to decrypt password");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = async () => {
    if (!showPassword && !password) {
      setLoading(true);
      try {
        const decrypted = await onDecryptPassword();
        setPassword(decrypted);
        setShowPassword(true);
      } catch (error) {
        toast.error("Failed to decrypt password");
      } finally {
        setLoading(false);
      }
    } else {
      setShowPassword(!showPassword);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-6 group relative overflow-hidden"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

      {/* Category Badge */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs px-3 py-1 rounded-full bg-[var(--aegis-bg-elevated)] text-[var(--aegis-accent-teal)] font-medium">
          {category.name}
        </span>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-blue)] hover:bg-[var(--aegis-bg-elevated)] transition-colors"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--aegis-text-muted)] hover:text-red-400 hover:bg-[var(--aegis-bg-elevated)] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Website Name */}
      <h4 className="text-xl font-semibold mb-2 text-[var(--aegis-text-heading)] capitalize">
        {websiteName}
      </h4>

      {/* User Info */}
      <div className="space-y-1 mb-4 text-sm text-[var(--aegis-text-muted)]">
        {username && <p>@{username}</p>}
        {email && <p>{email}</p>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[var(--aegis-accent-teal)] transition-colors"
          >
            {new URL(url).hostname}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Password Actions */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyPassword}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--aegis-accent-teal)] text-[var(--aegis-bg-deep)] font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          Copy Password
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTogglePassword}
          disabled={loading}
          className="w-10 h-10 rounded-lg bg-[var(--aegis-bg-elevated)] flex items-center justify-center text-[var(--aegis-text-body)] hover:text-[var(--aegis-accent-teal)] transition-colors disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Show Password */}
      {showPassword && password && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 p-3 rounded-lg bg-[var(--aegis-bg-elevated)] font-mono text-sm text-[var(--aegis-text-body)] break-all"
        >
          {password}
        </motion.div>
      )}
    </motion.div>
  );
}
