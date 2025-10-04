"use client";

import { useQuery } from "@tanstack/react-query";

type VaultStatsProps = {
  initialTotal: number;
};

export default function VaultStats({ initialTotal }: VaultStatsProps) {
  const { data } = useQuery({
    queryKey: ["vault-stats"],
    queryFn: async () => {
      const res = await fetch("/api/vault/items/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = (await res.json()) as { total: number };
      return json.total;
    },
    initialData: initialTotal,
    staleTime: 60_000,
  });

  const total = data ?? initialTotal;

  return (
    <div className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
      Total saved: <span className="font-medium text-zinc-900 dark:text-zinc-100">{total}</span>
    </div>
  );
}
