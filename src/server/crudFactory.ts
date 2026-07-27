import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "./store";
import { appendAuditLog } from "./audit";

interface Entity {
  id: string;
}

interface CrudOptions<T extends Entity> {
  collection: string;
  idPrefix: string;
  auditModule: string;
  labelField: keyof T;
}

function stripActor(body: Record<string, unknown>): { actor: string; data: Record<string, unknown> } {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export function collectionRoutes<T extends Entity>(opts: CrudOptions<T>) {
  async function GET() {
    const items = await readCollection<T>(opts.collection);
    return NextResponse.json(items);
  }

  async function POST(req: NextRequest) {
    const body = (await req.json()) as Record<string, unknown>;
    const { actor, data } = stripActor(body);
    const items = await readCollection<T>(opts.collection);
    let maxSeq = 0;
    for (const item of items) {
      const match = /(\d+)$/.exec(item.id);
      if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
    }
    const id = `${opts.idPrefix}-${String(maxSeq + 1).padStart(3, "0")}`;
    const created = { ...data, id } as T;
    items.push(created);
    await writeCollection(opts.collection, items);
    await appendAuditLog({
      user: actor,
      action: `Create ${opts.auditModule}`,
      module: opts.auditModule,
      details: `Created ${String(created[opts.labelField])}`,
    });
    return NextResponse.json(created, { status: 201 });
  }

  return { GET, POST };
}

export function itemRoutes<T extends Entity>(opts: CrudOptions<T>) {
  async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const items = await readCollection<T>(opts.collection);
    const item = items.find((i) => i.id === id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }

  async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;
    const { actor, data } = stripActor(body);
    const items = await readCollection<T>(opts.collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = { ...items[idx], ...data, id } as T;
    items[idx] = updated;
    await writeCollection(opts.collection, items);
    await appendAuditLog({
      user: actor,
      action: `Update ${opts.auditModule}`,
      module: opts.auditModule,
      details: `Updated ${String(updated[opts.labelField])}`,
    });
    return NextResponse.json(updated);
  }

  async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const actor = url.searchParams.get("actor") ?? "System";
    const items = await readCollection<T>(opts.collection);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [removed] = items.splice(idx, 1);
    await writeCollection(opts.collection, items);
    await appendAuditLog({
      user: actor,
      action: `Delete ${opts.auditModule}`,
      module: opts.auditModule,
      details: `Deleted ${String(removed[opts.labelField])}`,
    });
    return NextResponse.json({ success: true });
  }

  return { GET, PUT, DELETE };
}
