import { readFile } from "node:fs/promises";
import path from "node:path";

// The user manual is authored as a standalone HTML file under
// public/user-manual/ so it can be edited — and its screenshots swapped — with
// a text editor and a file copy, no rebuild involved. This handler serves that
// file at /user-manual so the page has no app shell, no sidebar and no footer.
// The screenshots it references are served straight from public/.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANUAL_PATH = path.join(process.cwd(), "public", "user-manual", "index.html");

export async function GET() {
  const html = await readFile(MANUAL_PATH, "utf8");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
