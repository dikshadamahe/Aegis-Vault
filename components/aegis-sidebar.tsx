"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Shield, Key, LogOut, Lock } from "lucide-react";

const navItems = [
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/generator", label: "Generator", icon: Key },
];

export function AegisSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/sign-in");
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-0 top-0 h-screen w-20 glass-card border-r border-[var(--aegis-border)] flex flex-col items-center py-8 z-50"
    >
      {/* Logo */}
      <motion.div
        className="mb-12 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/vault")}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center shadow-[0_0_20px_rgba(0,191,165,0.3)]">
          <Shield className="w-6 h-6 text-[var(--aegis-bg-deep)]" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <motion.button
              key={item.href}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * idx, ease: "easeOut" }}
              onClick={() => router.push(item.href)}
              className={`
                w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-200 relative group
                ${
                  isActive
                    ? "bg-[var(--aegis-accent-teal)] text-[var(--aegis-bg-deep)] shadow-[0_0_20px_rgba(0,191,165,0.4)]"
                    : "text-[var(--aegis-text-muted)] hover:text-[var(--aegis-text-body)] hover:bg-[var(--aegis-bg-card)]"
                }
              `}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon className="w-5 h-5" strokeWidth={2} />
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 rounded-lg bg-[var(--aegis-bg-elevated)] text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* User / Logout */}
      {session?.user && (
        <motion.button
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={handleLogout}
          className="w-14 h-14 rounded-lg flex items-center justify-center text-[var(--aegis-text-muted)] hover:text-red-400 hover:bg-[var(--aegis-bg-card)] transition-all duration-200 group relative"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 rounded-lg bg-[var(--aegis-bg-elevated)] text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
            Logout
          </div>
        </motion.button>
      )}
    </motion.aside>
  );
}
