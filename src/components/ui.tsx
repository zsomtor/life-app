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
    <section className="rise rounded-2xl bg-panel">
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          {title}
          {badge}
        </h2>
        {action}
      </header>
      <div className="px-3 pb-3">{children}</div>
    </section>
  );
}

export function CountBadge({ n, tone = "mut" }: { n: number; tone?: "mut" | "acc" | "warn" | "danger" }) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-warn"
        : tone === "acc"
          ? "text-acc"
          : "text-dim";
  return <span className={`font-mono text-[13px] font-medium ${color}`}>{n}</span>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-1.5 py-3 text-[13px] text-dim">
      <span className="size-3 animate-spin rounded-full border border-dim border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] text-danger">{message}</p>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="px-1.5 py-3 text-[13px] text-dim">{label}</p>;
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

/** Apple Reminders-style round checkbox: hollow ring -> filled accent circle. */
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
      className={`grid size-[20px] shrink-0 place-items-center rounded-full border-[1.5px] transition-all ${
        checked
          ? "border-acc bg-acc text-white"
          : "border-dim/70 text-transparent hover:border-mut"
      }`}
    >
      <svg viewBox="0 0 12 12" className="size-[10px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6.5 4.5 9 10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Base input — frameless, iOS-style filled field. Size at the call site. */
export const inputCls =
  "rounded-[10px] bg-panel2 px-3 py-1.5 text-[13px] text-ink placeholder:text-dim outline-none ring-acc/60 transition-shadow focus:ring-2";

export const btnCls =
  "rounded-[10px] bg-panel2 px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-line disabled:opacity-40";

export const btnPrimaryCls =
  "rounded-[10px] bg-acc px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40";
