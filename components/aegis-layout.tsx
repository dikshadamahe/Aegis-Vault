"use client";

import { AegisSidebar } from "./aegis-sidebar";
import { motion } from "framer-motion";
import { useState } from "react";

type AegisLayoutProps = {
  children: React.ReactNode;
  onCategoryFilter?: (categorySlug: string | null) => void;
  selectedCategory?: string | null;
};

export function AegisLayout({ children, onCategoryFilter, selectedCategory }: AegisLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[var(--aegis-bg-deep)]">
      <AegisSidebar 
        onCategoryFilter={onCategoryFilter}
        selectedCategory={selectedCategory}
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
        className="flex-1 ml-20 lg:ml-80 p-8 overflow-auto min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
}
