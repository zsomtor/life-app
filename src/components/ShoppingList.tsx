"use client";

import { useState } from "react";
import { api, broadcastRefresh, useApi } from "./useApi";
import { CheckCircle, Empty, ErrorNote, IconButton, Loading, inputCls } from "./ui";

type PublicItem = { id: string; name: string; quantity: string | null; checked: boolean };

/**
 * Shopping list UI shared by the dashboard card and the public share page.
 * `apiBase` is either /api/v1/shopping or /api/share/shopping/<token> —
 * both expose GET/POST on the base and PATCH/DELETE on `${base}/${id}`.
 */
export function ShoppingList({ apiBase, pollMs = 10_000 }: { apiBase: string; pollMs?: number }) {
  const { data, error, loading } = useApi<{ items: PublicItem[] }>(apiBase, pollMs);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      broadcastRefresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const addItem = () =>
    run(async () => {
      if (!name.trim() || busy) return;
      setBusy(true);
      try {
        await api(apiBase, "POST", { name, quantity: qty || null });
        setName("");
        setQty("");
      } finally {
        setBusy(false);
      }
    });

  const items = data?.items ?? [];
  const open = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  const row = (i: PublicItem) => (
    <li key={i.id} className="group flex items-center gap-2.5 py-1.5">
      <CheckCircle
        checked={i.checked}
        label={`check ${i.name}`}
        onChange={(checked) => run(() => api(`${apiBase}/${i.id}`, "PATCH", { checked }))}
      />
      <p className={`min-w-0 flex-1 truncate text-[13.5px] ${i.checked ? "text-dim line-through" : ""}`}>
        {i.name}
      </p>
      {i.quantity && <span className="font-mono text-[11.5px] text-dim">{i.quantity}</span>}
      <span className="opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton label="Delete item" tone="danger" onClick={() => run(() => api(`${apiBase}/${i.id}`, "DELETE"))}>
          ✕
        </IconButton>
      </span>
    </li>
  );

  return (
    <div>
      <form
        className="mb-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add item…"
          className={`${inputCls} min-w-0 flex-1`}
        />
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="qty"
          aria-label="Quantity"
          className={`${inputCls} w-16 shrink-0`}
        />
        {/* keeps Enter-to-submit working: forms with 2+ fields need a submit button */}
        <button type="submit" hidden aria-hidden />
      </form>
      {actionError && <ErrorNote message={actionError} />}
      {loading && !data ? (
        <Loading />
      ) : error && !data ? (
        <ErrorNote message={error} />
      ) : items.length === 0 ? (
        <Empty label="List is empty." />
      ) : (
        <>
          <ul className="divide-y divide-line/60">{open.map(row)}</ul>
          {done.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer list-none py-1 text-[12px] text-dim hover:text-mut">
                {done.length} in the basket ✓
              </summary>
              <ul className="divide-y divide-line/60">{done.map(row)}</ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
