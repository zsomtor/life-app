/**
 * Central place to read configuration. Everything is read lazily so the app
 * can boot (and run with the in-memory repo) before any secrets exist.
 */

export function env(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === "" ? undefined : v;
}

export function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function flag(name: string): boolean {
  const v = env(name)?.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const APP_TIMEZONE = () => env("APP_TIMEZONE") ?? "Europe/Budapest";
