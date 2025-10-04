import AddNewPasswordDialog from "@/components/add-new-password-dialog";
import Header from "@/components/header";
import PasswordCollectionCard from "@/components/password-collection-card";
import SearchPassword from "@/components/search-password";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { VaultItem, CategoryLite } from "@/types/vault";

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

  const [itemsRes, catsRes] = await Promise.all([
    fetch(`/api/vault/items${qs.toString() ? `?${qs}` : ""}`, { cache: "no-store" }),
    fetch(`/api/vault/categories`, { cache: "no-store" }),
  ]);

  if (!itemsRes.ok) {
    throw new Error(`Failed to load items (${itemsRes.status})`);
  }
  if (!catsRes.ok) {
    throw new Error(`Failed to load categories (${catsRes.status})`);
  }

  const { items } = (await itemsRes.json()) as { items: VaultItem[] };
  const { categories } = (await catsRes.json()) as { categories: CategoryLite[] };
  const passwordsCollection = items;
  const total = items.length;

  return (
    <>
      <Header
        title="All Passwords"
        description="Safety manage and access your passwords."
        className="mt-5"
      />

      <div className="mb-6 flex items-center space-x-3">
        <SearchPassword total={total} />
        <AddNewPasswordDialog categories={categories} />
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
    </>
  );
};

export default DashboardPage;
