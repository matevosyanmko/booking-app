import { NextRequest, NextResponse } from "next/server";
import { delay, store } from "@/server/store";
import { checkBooking } from "@/server/service";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () => NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  await delay();
  const { id } = await params;
  const current = store.get(id);
  if (!current) return notFound();
  const patch = await req.json().catch(() => null);
  const next = {
    id,
    date: typeof patch?.date === "string" ? patch.date : current.date,
    start: typeof patch?.start === "string" ? patch.start : current.start,
    end: typeof patch?.end === "string" ? patch.end : current.end,
    title: typeof patch?.title === "string" ? patch.title || undefined : current.title,
    user: typeof patch?.user === "string" ? patch.user || undefined : current.user,
  };
  const failure = checkBooking(next, id);
  if (failure) return failure;
  store.set(id, next);
  return NextResponse.json(next);
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  await delay();
  const { id } = await params;
  if (!store.delete(id)) return notFound();
  return new NextResponse(null, { status: 204 });
}
