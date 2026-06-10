"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Wrong password." : "Login failed — try again.");
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <form
        onSubmit={submit}
        className="rise w-full max-w-xs rounded-xl border border-line bg-panel p-5"
      >
        <p className="mb-4 text-center font-mono text-[14px] tracking-widest text-acc">LIFE://</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-md border border-line bg-panel2 px-3 py-2 text-[14px] text-ink placeholder:text-dim outline-none focus:border-acc/60"
        />
        {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-3 w-full rounded-md border border-acc/40 bg-acc/10 py-2 text-[13.5px] font-medium text-acc transition-colors hover:bg-acc/20 disabled:opacity-50"
        >
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
