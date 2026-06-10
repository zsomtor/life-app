"use client";

import type { ReactNode } from "react";

export function Card({
  title,
  badge,
  action,
  children,
}: {
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rise rounded-xl border border-line bg-panel">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-mut uppercase">
          {title}
          {badge}
        </h2>
        {action}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function CountBadge({ n, tone = "acc" }: { n: number; tone?: "acc" | "warn" | "danger" }) {
  const color =
    tone === "danger" ? "text-danger border-danger/40" : tone === "warn" ? "text-warn border-warn/40" : "text-acc border-acc/40";
  return (
    <span className={`rounded-full border px-1.5 font-mono text-[11px] leading-4 ${color}`}>{n}</span>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-3 text-[13px] text-dim">
      <span className="size-3 animate-spin rounded-full border border-dim border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[12px] text-danger">
      {message}
    </p>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="px-1 py-3 text-[13px] text-dim">{label}</p>;
}

export function IconButton({
  label,
  onClick,
  tone = "mut",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "mut" | "danger" | "acc" | "ok";
  children: ReactNode;
}) {
  const colors = {
    mut: "text-dim hover:text-ink",
    danger: "text-dim hover:text-danger",
    acc: "text-dim hover:text-acc",
    ok: "text-dim hover:text-ok",
  } as const;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded px-1 text-[12px] transition-colors ${colors[tone]}`}
    >
      {children}
    </button>
  );
}

export function CheckCircle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? "toggle"}
      onClick={() => onChange(!checked)}
      className={`grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors ${
        checked ? "border-ok bg-ok/20 text-ok" : "border-line text-transparent hover:border-mut"
      }`}
    >
      <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6.5 4.5 9 10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export const inputCls =
  "w-full rounded-md border border-line bg-panel2 px-2.5 py-1.5 text-[13px] text-ink placeholder:text-dim outline-none focus:border-acc/60";

export const btnCls =
  "rounded-md border border-line bg-panel2 px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:border-acc/60 hover:text-acc disabled:opacity-50";
