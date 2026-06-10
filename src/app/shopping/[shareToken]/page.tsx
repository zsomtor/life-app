import { isValidShareToken } from "@/lib/share";
import { ShoppingList } from "@/components/ShoppingList";

export const dynamic = "force-dynamic";

/**
 * Public shopping list — reachable with just the share link, no login.
 * Grants read/write to the shopping list only; nothing else is exposed.
 */
export default async function SharedShoppingPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  if (!isValidShareToken(shareToken)) {
    return (
      <main className="grid min-h-dvh place-items-center p-4">
        <p className="text-[14px] text-dim">This link is not valid (anymore).</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-3 pt-6 pb-16 sm:px-4">
      <header className="mb-4 flex items-baseline justify-between px-1">
        <h1 className="text-[19px] font-semibold tracking-tight">Shopping list 🛒</h1>
        <span className="text-[11px] text-dim">live · refreshes automatically</span>
      </header>
      <div className="rise rounded-2xl bg-panel p-3">
        <ShoppingList apiBase={`/api/share/shopping/${encodeURIComponent(shareToken)}`} pollMs={5000} />
      </div>
    </main>
  );
}
