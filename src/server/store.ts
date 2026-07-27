import { promises as fs } from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");

function fileFor(collection: string): string {
  return path.join(DB_DIR, `${collection}.json`);
}

export async function readCollection<T>(collection: string): Promise<T[]> {
  const raw = await fs.readFile(fileFor(collection), "utf-8");
  return JSON.parse(raw) as T[];
}

export async function writeCollection<T>(collection: string, data: T[]): Promise<void> {
  await fs.writeFile(fileFor(collection), JSON.stringify(data, null, 2) + "\n", "utf-8");
}
