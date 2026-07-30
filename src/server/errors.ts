import { NextResponse } from "next/server";

/**
 * An error with a message that is safe to show the user and an HTTP status to
 * return it with. Repositories throw these for rule violations (a duplicate
 * rate card combination, deleting a category that is still in use) so route
 * handlers can turn them into a response without knowing the rule.
 */
export class DomainError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}

interface PrismaKnownError {
  code?: string;
  meta?: { target?: unknown; field_name?: unknown; modelName?: unknown };
}

function prismaCode(error: unknown): PrismaKnownError | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as PrismaKnownError;
  return typeof candidate.code === "string" ? candidate : null;
}

/**
 * Turns an error into a JSON response. DomainErrors keep their message and
 * status; Prisma constraint violations become a 409 with a readable message;
 * anything else is logged and reported as a generic 500 so internals are not
 * leaked to the client.
 */
export function errorResponse(error: unknown, fallback = "Request failed."): NextResponse {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const known = prismaCode(error);
  if (known) {
    switch (known.code) {
      case "P2002":
        return NextResponse.json(
          { error: "A record with these details already exists." },
          { status: 409 }
        );
      case "P2003":
        return NextResponse.json(
          { error: "This record is referenced by other records and cannot be changed." },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  console.error("[api]", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

/** True when the error is a unique-constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return prismaCode(error)?.code === "P2002";
}

/** True when the error is a foreign-key constraint violation. */
export function isForeignKeyViolation(error: unknown): boolean {
  return prismaCode(error)?.code === "P2003";
}
