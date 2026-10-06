import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireCtx } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { createCustomer, listCustomers } from "@/services/crm/customer.service";

function fail(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ error: e.code }, { status: e.code === "UNAUTHENTICATED" ? 401 : 403 });
  if (e instanceof ZodError) return NextResponse.json({ error: "VALIDATION", issues: e.issues }, { status: 422 });
  return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
}

export async function GET(req: Request) {
  try {
    const ctx = await requireCtx("customer.read");
    const u = new URL(req.url);
    return NextResponse.json(await listCustomers(ctx, Number(u.searchParams.get("page") ?? 1), u.searchParams.get("q") ?? undefined));
  } catch (e) { return fail(e); }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireCtx("customer.create");
    return NextResponse.json(await createCustomer(ctx, await req.json()), { status: 201 });
  } catch (e) { return fail(e); }
}
