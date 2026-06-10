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
      <form onSubmit={submit} className="rise w-full max-w-xs rounded-2xl bg-panel p-6">
        <p className="mb-5 text-center text-[19px] font-semibold tracking-tight">Life</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-[10px] bg-panel2 px-3.5 py-2.5 text-[14px] text-ink placeholder:text-dim outline-none ring-acc/60 transition-shadow focus:ring-2"
        />
        {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full rounded-[10px] bg-acc py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
