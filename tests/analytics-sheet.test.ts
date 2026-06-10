import { describe, expect, it } from "vitest";
import { parseSheetRows, summarizeVideos } from "@/lib/integrations/analytics-sheet";

// Rows mirror the real BAZU analytics sheet layout (first tab).
const rows: string[][] = [
  ["ID", "GUEST", "LINK", "Posztolás napja", "CTR 24H", "CTR 2D", "CTR 5D", "CTR 7D", "CTR 14D", "CTR 30D", "AVD", "APV", "LENGTH", "", ""],
  ["1", "MANUEL: Senki se tudja", "https://www.youtube.com/watch?v=Pej7UdS2ZHk", "2026.03.19.", "7.50%", "5.30%", "4.60%", "", "4.90%", "4.85%", "16:16", "28.65%", "0:56:50", "91491", "PODCAST"],
  ["4", "Dubaji vállalkozók", "https://www.youtube.com/watch?v=T7LCQTu7StA", "2026.06.01.", "6.40%", "4.80%", "4.80%", "", "4.50%", "", "5:08", "35.92%", "0:14:19", "43983", "UTCAI"],
  ["18", "ki áll a kedvenc italaid mögött?", "https://www.youtube.com/watch?v=KXAWwVWC-tM", "2026.05.20.", "", "", "", "", "", "", "1:10", "53.12%", "0:02:12", "21052", "SHORT"],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // blank
  ["281", "Nem YouTube sor (másik tab)", "2026.01.27.", "", "", "", "58"], // foreign-tab row, no link
];

describe("analytics sheet parsing", () => {
  it("parses video rows and skips headers/blanks/foreign rows", () => {
    const videos = parseSheetRows(rows);
    expect(videos).toHaveLength(3);
    expect(videos[0]).toMatchObject({
      title: "MANUEL: Senki se tudja",
      publishedAt: "2026-03-19",
      views: 91491,
      ctr: "4.85%",
      type: "PODCAST",
      isShort: false,
    });
    // falls back to the latest filled CTR column when 30D is empty
    expect(videos[1].ctr).toBe("4.50%");
    expect(videos[2].isShort).toBe(true);
  });

  it("summarizes totals and last-30-days split by long-form vs shorts", () => {
    const summary = summarizeVideos(parseSheetRows(rows), "2026-06-10");
    expect(summary.longform).toEqual({ count: 2, totalViews: 91491 + 43983 });
    expect(summary.shorts).toEqual({ count: 1, totalViews: 21052 });
    expect(summary.publishedLast30Days.count).toBe(2);
    expect(summary.publishedLast30Days.longformViews).toBe(43983);
    expect(summary.publishedLast30Days.shortViews).toBe(21052);
    expect(summary.topAllTime[0].views).toBe(91491);
  });
});
