"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Shield, Key, LogOut, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoryIcon } from "@/constants/category-icon";

const navItems = [
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/generator", label: "Generator", icon: Key },
];

type AegisSidebarProps = {
  onCategoryFilter?: (categorySlug: string | null) => void;
  selectedCategory?: string | null;
};

export function AegisSidebar({ onCategoryFilter, selectedCategory }: AegisSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/sign-in");
  };

  const handleCategoryClick = (categorySlug: string) => {
    if (pathname === "/vault") {
      onCategoryFilter?.(selectedCategory === categorySlug ? null : categorySlug);
    }
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isExpanded ? 240 : 80
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen glass-card border-r border-[var(--aegis-border)] flex flex-col py-8 z-50 overflow-hidden"
    >
      {/* Logo */}
      <div className="px-4 mb-12">
        <motion.div
          className="cursor-pointer flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/vault")}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center shadow-[0_0_20px_rgba(0,191,165,0.3)] flex-shrink-0">
            <Shield className="w-6 h-6 text-[var(--aegis-bg-deep)]" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-white whitespace-nowrap overflow-hidden"
              >
                Aegis Vault
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-3 px-4 mb-6">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <motion.button
              key={item.href}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * idx, ease: "easeInOut" }}
              onClick={() => router.push(item.href)}
              className={`
                h-12 rounded-lg flex items-center gap-3 px-3 transition-all duration-300
                ${
                  isActive
                    ? "bg-[var(--aegis-accent-teal)] text-[var(--aegis-bg-deep)] shadow-[0_0_20px_rgba(0,191,165,0.4)]"
                    : "text-white hover:text-[var(--aegis-accent-teal)] hover:bg-[var(--aegis-bg-card)]"
                }
              `}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Divider */}
      {categories && categories.length > 0 && (
        <div className="border-t border-[var(--aegis-border)] mx-4 mb-6" />
      )}

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-thin">
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] mb-3 px-3"
            >
              Categories
            </motion.p>
          )}
          {categories.map((category, idx) => {
            const Icon = categoryIcon[category.slug] || Shield;
            const isSelected = selectedCategory === category.slug;
            return (
              <motion.button
                key={category.id}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + 0.05 * idx, ease: "easeInOut" }}
                onClick={() => handleCategoryClick(category.slug)}
                className={`
                  w-full h-12 rounded-lg flex items-center gap-3 px-3 transition-all duration-300
                  ${
                    isSelected
                      ? "bg-[var(--aegis-accent-teal)]/20 text-[var(--aegis-accent-teal)] border border-[var(--aegis-accent-teal)]"
                      : "text-white hover:text-[var(--aegis-accent-teal)] hover:bg-[var(--aegis-bg-card)]"
                  }
                `}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden text-left flex-1"
                    >
                      {category.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-4 space-y-3 mt-auto">
        {/* Expand/Collapse Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-12 rounded-lg flex items-center justify-center gap-3 text-white hover:text-[var(--aegis-accent-teal)] hover:bg-[var(--aegis-bg-card)] transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isExpanded ? (
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          ) : (
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          )}
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User / Logout */}
        {session?.user && (
          <motion.button
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeInOut" }}
            onClick={handleLogout}
            className="w-full h-12 rounded-lg flex items-center justify-center gap-3 text-white hover:text-red-400 hover:bg-[var(--aegis-bg-card)] transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
}
