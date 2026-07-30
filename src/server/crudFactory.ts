import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "./audit";
import { errorResponse } from "./errors";
import { getRepository, type CollectionName } from "./repositories";

// Generic CRUD endpoints for the collections whose behaviour is entirely
// "read, create, update, delete, write an audit entry". Collection-specific
// rules (name resolution, uniqueness, still-in-use checks) live in the
// repository for that collection, and ID allocation lives in ./ids.

interface Entity {
  id: string;
}

interface CrudOptions<T extends Entity> {
  collection: CollectionName;
  auditModule: string;
  labelField: keyof T;
}

function stripActor(body: Record<string, unknown>): {
  actor: string;
  data: Record<string, unknown>;
} {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

function label<T extends Entity>(item: T, field: keyof T): string {
  const value = item[field];
  return value === undefined || value === null ? item.id : String(value);
}

export function collectionRoutes<T extends Entity>(opts: CrudOptions<T>) {
  const repository = () => getRepository<T>(opts.collection);

  async function GET() {
    try {
      return NextResponse.json(await repository().list());
    } catch (error) {
      return errorResponse(error, `Failed to load ${opts.auditModule}.`);
    }
  }

  async function POST(req: NextRequest) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const { actor, data } = stripActor(body);
      const created = await repository().create(data);
      await appendAuditLog({
        user: actor,
        action: `Create ${opts.auditModule}`,
        module: opts.auditModule,
        details: `Created ${label(created, opts.labelField)}`,
      });
      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      return errorResponse(error, `Failed to save ${opts.auditModule}.`);
    }
  }

  return { GET, POST };
}

export function itemRoutes<T extends Entity>(opts: CrudOptions<T>) {
  const repository = () => getRepository<T>(opts.collection);

  async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      const item = await repository().find(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(item);
    } catch (error) {
      return errorResponse(error, `Failed to load ${opts.auditModule}.`);
    }
  }

  async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      const body = (await req.json()) as Record<string, unknown>;
      const { actor, data } = stripActor(body);
      const updated = await repository().update(id, data);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await appendAuditLog({
        user: actor,
        action: `Update ${opts.auditModule}`,
        module: opts.auditModule,
        details: `Updated ${label(updated, opts.labelField)}`,
      });
      return NextResponse.json(updated);
    } catch (error) {
      return errorResponse(error, `Failed to save ${opts.auditModule}.`);
    }
  }

  async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await ctx.params;
      const actor = new URL(req.url).searchParams.get("actor") ?? "System";
      const removed = await repository().remove(id);
      if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await appendAuditLog({
        user: actor,
        action: `Delete ${opts.auditModule}`,
        module: opts.auditModule,
        details: `Deleted ${label(removed, opts.labelField)}`,
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      return errorResponse(error, `Failed to remove ${opts.auditModule}.`);
    }
  }

  return { GET, PUT, DELETE };
}
