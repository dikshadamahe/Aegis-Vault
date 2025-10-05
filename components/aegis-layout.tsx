"use client";

import { AegisSidebar } from "./aegis-sidebar";
import { motion } from "framer-motion";

export function AegisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <AegisSidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 ml-20 p-8 overflow-auto"
      >
        {children}
      </motion.main>
    </div>
  );
}
