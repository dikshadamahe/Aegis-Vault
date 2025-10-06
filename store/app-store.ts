import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";

type AppStoreValue = {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
};

const AppStoreContext = createContext<AppStoreValue | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const value = useMemo<AppStoreValue>(
    () => ({
      selectedCategory,
      setSelectedCategory,
    }),
    [selectedCategory]
  );

  return createElement(AppStoreContext.Provider, { value }, children);
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return context;
}
