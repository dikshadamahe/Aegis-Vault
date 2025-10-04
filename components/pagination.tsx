"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Pagination({ hasPrev, hasNext }: { hasPrev: boolean; hasNext: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const setPage = (p: number) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (p <= 1) qs.delete("page"); else qs.set("page", String(p));
    router.push(`${pathname}?${qs.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!hasPrev}>Prev</Button>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">Page {page}</span>
      <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!hasNext}>Next</Button>
    </div>
  );
}
