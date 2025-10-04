"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

type VaultStatsProps = {
  initialTotal: number;
};

export default function VaultStats({ initialTotal }: VaultStatsProps) {
  const sp = useSearchParams();
  const category = sp.get("category") || "";
  const search = sp.get("search") || "";

  const { data } = useQuery({
    queryKey: ["vault-stats", { category, search }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/vault/items/stats${qs.toString() ? `?${qs}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = (await res.json()) as { total: number };
      return json.total;
    },
    initialData: initialTotal,
    staleTime: 30_000,
  });

  const total = data ?? initialTotal;

  return (
    <div className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
      Total saved: <span className="font-medium text-zinc-900 dark:text-zinc-100">{total}</span>
    </div>
  );
}
