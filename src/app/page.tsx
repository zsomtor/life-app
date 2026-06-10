import { env } from "@/lib/env";
import { todayString } from "@/lib/time";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  // Owner-only page (middleware-guarded); safe to hand the share URL to the UI.
  const shareToken = env("SHOPPING_SHARE_TOKEN");
  return <Dashboard today={todayString()} sharePath={shareToken ? `/shopping/${shareToken}` : null} />;
}
