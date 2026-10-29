import { NextRequest, NextResponse } from "next/server";
import { isValidDate } from "@/domain/booking/rules";
import { byDate, delay, store } from "@/server/store";
import { checkBooking } from "@/server/service";

export async function GET(req: NextRequest) {
  await delay();
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDate(date)) return NextResponse.json({ code: "VALIDATION", errors: ["INVALID_FORMAT"] }, { status: 422 });
  return NextResponse.json(byDate(date));
}

export async function POST(req: NextRequest) {
  await delay();
  const body = await req.json().catch(() => null);
  const input = {
    date: String(body?.date ?? ""),
    start: String(body?.start ?? ""),
    end: String(body?.end ?? ""),
    title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : undefined,
    user: typeof body?.user === "string" && body.user.trim() ? body.user.trim() : undefined,
  };
  const failure = checkBooking(input);
  if (failure) return failure;
  const booking = { id: crypto.randomUUID(), ...input };
  store.set(booking.id, booking);
  return NextResponse.json(booking, { status: 201 });
}
