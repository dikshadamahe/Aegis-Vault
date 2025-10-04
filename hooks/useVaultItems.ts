import { useQuery } from "@tanstack/react-query";

export function useVaultItems(params: { category?: string; search?: string }) {
  // Placeholder hook; wire up to API once implemented
  return useQuery({
    queryKey: ["vault-items", params],
    queryFn: async () => ({ items: [] as unknown[] }),
  });
}
