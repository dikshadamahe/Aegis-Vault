"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Key, Plus, Settings, ChevronLeft, ChevronRight, LogOut, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { categoryIcon } from "@/constants/category-icon";
import { useVault } from "@/providers/VaultProvider";

const navItems = [
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/generator", label: "Generator", icon: Key },
];

type SidebarProps = {
  onCategoryFilter?: (categorySlug: string | null) => void;
  selectedCategory?: string | null;
};

export function Sidebar({ onCategoryFilter, selectedCategory }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isLocked, lockVault } = useVault();

  // Fetch categories with icons
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
        width: isExpanded ? 280 : 80
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] // Custom easing for premium feel
      }}
      className="fixed left-0 top-0 h-screen glass-card border-r border-[var(--aegis-border)] flex flex-col z-50 overflow-hidden"
      style={{ 
        padding: "var(--space-4) var(--space-2)",
      }}
    >
      {/* Logo Section */}
      <motion.div 
        className="mb-8 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push("/vault")}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
              boxShadow: "0 0 24px rgba(0, 174, 239, 0.4)"
            }}
            whileHover={{ 
              boxShadow: "0 0 32px rgba(0, 174, 239, 0.6)",
              rotate: 5
            }}
            transition={{ duration: 0.3 }}
          >
            <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <h1 className="text-2xl font-bold tracking-tight text-[var(--aegis-text-heading)]">
                  Aegis Vault
                </h1>
                <p className="text-xs text-[var(--aegis-text-muted)] tracking-wide">
                  Secure Password Manager
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 mb-6">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.1 * idx,
                ease: [0.16, 1, 0.3, 1]
              }}
              onClick={() => router.push(item.href)}
              className={`
                relative h-12 rounded-lg flex items-center gap-4 px-4 overflow-hidden
                transition-all duration-300
                ${isActive 
                  ? "text-[var(--aegis-bg-deep)]" 
                  : "text-[var(--aegis-text-body)] hover:text-[var(--aegis-text-heading)]"
                }
              `}
              whileHover={{ x: 4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isActive 
                  ? "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)"
                  : "transparent",
                boxShadow: isActive ? "var(--shadow-glow)" : "none",
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Divider */}
      {categories && categories.length > 0 && (
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="h-px bg-[var(--aegis-border)] mb-6 mx-2"
          style={{ transformOrigin: "left" }}
        />
      )}

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs uppercase tracking-wider text-[var(--aegis-text-muted)] mb-3 px-4 font-semibold"
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.4 + (0.05 * idx),
                  ease: [0.16, 1, 0.3, 1]
                }}
                onClick={() => handleCategoryClick(category.slug)}
                className={`
                  w-full h-11 rounded-lg flex items-center gap-4 px-4
                  transition-all duration-300
                  ${isSelected
                    ? "bg-[var(--aegis-bg-elevated)] border border-[var(--aegis-accent-primary)] text-[var(--aegis-accent-primary)]"
                    : "text-[var(--aegis-text-body)] hover:bg-[var(--aegis-bg-card)] hover:text-[var(--aegis-text-heading)]"
                  }
                `}
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium tracking-tight whitespace-nowrap text-left flex-1"
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

      {/* Bottom Controls - Fixed alignment */}
      <div className="mt-auto pt-6 flex flex-col gap-2">
        {/* Lock Vault Button */}
        {!isLocked && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={lockVault}
            className="w-full h-11 rounded-lg flex items-center gap-3 px-4 text-[var(--aegis-text-body)] hover:bg-[var(--aegis-accent-primary)]/10 hover:text-[var(--aegis-accent-primary)] transition-all duration-300 border border-[var(--aegis-border)] hover:border-[var(--aegis-accent-primary)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LockKeyhole className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium tracking-tight"
                >
                  Lock Vault
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
        
        {/* Collapse Toggle - Always at bottom left */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-11 rounded-lg flex items-center gap-3 px-4 text-[var(--aegis-text-body)] hover:bg-[var(--aegis-bg-card)] hover:text-[var(--aegis-text-heading)] transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium tracking-tight">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
          )}
        </motion.button>

        {/* Logout Button - Restored and always visible */}
        {session?.user && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onClick={handleLogout}
            className="w-full h-11 rounded-lg flex items-center gap-3 px-4 text-[var(--aegis-text-body)] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium tracking-tight"
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
