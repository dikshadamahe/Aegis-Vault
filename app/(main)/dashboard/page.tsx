import AddNewPasswordDialog from "@/components/add-new-password-dialog";
import Header from "@/components/header";
import PasswordCollectionCard from "@/components/password-collection-card";
import SearchPassword from "@/components/search-password";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { VaultItem, CategoryLite } from "@/types/vault";
import VaultStats from "../../../components/vault-stats";
import Pagination from "@/components/pagination";

interface DashboarPageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

const DashboardPage = async ({
  searchParams: { category, search },
}: DashboarPageProps) => {
  // Build query string for REST API
  const qs = new URLSearchParams();
  if (category) qs.set("category", String(category));
  if (search) qs.set("search", String(search));

  const querySuffix = qs.toString() ? `?${qs}` : "";
  const [itemsRes, catsRes, statsRes] = await Promise.all([
    fetch(`/api/vault/items${querySuffix}`, { cache: "no-store" }),
    fetch(`/api/vault/categories`, { cache: "no-store" }),
    fetch(`/api/vault/items/stats${querySuffix}`, { cache: "no-store" }),
  ]);

  if (!itemsRes.ok) {
    throw new Error(`Failed to load items (${itemsRes.status})`);
  }
  if (!catsRes.ok) {
    throw new Error(`Failed to load categories (${catsRes.status})`);
  }
  if (!statsRes.ok) {
    throw new Error(`Failed to load stats (${statsRes.status})`);
  }

  const { items, hasPrev, hasNext, page, pageSize, total } = (await itemsRes.json()) as { items: VaultItem[]; hasPrev: boolean; hasNext: boolean; page: number; pageSize: number; total: number };
  const { categories } = (await catsRes.json()) as { categories: CategoryLite[] };
  const passwordsCollection = items;
  const stats = (await statsRes.json()) as { total: number };

  return (
    <>
      <Header
        title="All Passwords"
        description="Safety manage and access your passwords."
        className="mt-5"
      />

      <div className="mb-6 flex items-center space-x-3">
        <SearchPassword total={stats.total} />
        <AddNewPasswordDialog categories={categories} />
        <VaultStats initialTotal={stats.total} />
      </div>

      <div className="space-y-2.5">
        {!passwordsCollection.length ? (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>No Password Found</AlertTitle>
            <AlertDescription>
              Looks like you haven&apos;t added any passwords yet.
            </AlertDescription>
          </Alert>
        ) : (
          passwordsCollection.map((collection: VaultItem, index: number) => (
            <PasswordCollectionCard
              key={index}
              password={collection}
              categories={categories}
            />
          ))
        )}
      </div>
      <Pagination hasPrev={hasPrev} hasNext={hasNext} />
    </>
  );
};

export default DashboardPage;
