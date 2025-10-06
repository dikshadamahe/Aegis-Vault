"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div 
      className="min-h-screen flex"
      style={{ 
        background: "var(--aegis-bg-deep)",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <motion.main
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="flex-1 overflow-auto"
        style={{
          marginLeft: "280px", // Match sidebar expanded width
          padding: "var(--space-5)",
          minHeight: "100vh",
        }}
      >
        <motion.div variants={itemVariants}>
          {children}
        </motion.div>
      </motion.main>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top-left glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--aegis-accent-primary) 0%, transparent 70%)",
          }}
        />
        
        {/* Bottom-right glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--aegis-accent-teal) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}
