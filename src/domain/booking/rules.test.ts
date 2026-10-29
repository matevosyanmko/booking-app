import { describe, expect, it } from "vitest";
import { validateBooking, findConflicts, isPastSlot } from "./rules";
import type { Booking } from "./types";

const now = new Date(2026, 9, 28, 12, 0); // 2026-10-28 12:00 local
const D = "2026-10-29";
const existing: Booking[] = [{ id: "a", date: D, start: "10:00", end: "11:00" }];
const v = (start: string, end: string, extra: { date?: string; excludeId?: string } = {}) =>
  validateBooking({ date: extra.date ?? D, start, end }, existing, { now, excludeId: extra.excludeId });

describe("validateBooking", () => {
  it("accepts a valid booking", () => expect(v("13:00", "14:00")).toEqual([]));
  it("allows touching boundaries", () => {
    expect(v("11:00", "12:00")).toEqual([]);
    expect(v("09:00", "10:00")).toEqual([]);
  });
  it("detects overlap", () => {
    expect(v("10:30", "11:30")).toContain("OVERLAP");
    expect(v("09:30", "10:30")).toContain("OVERLAP");
    expect(v("10:00", "11:00")).toContain("OVERLAP");
  });
  it("does not conflict with itself when editing", () => expect(v("10:00", "11:30", { excludeId: "a" })).toEqual([]));
  it("enforces workday", () => {
    expect(v("08:30", "09:30")).toContain("OUT_OF_WORKDAY");
    expect(v("17:30", "18:30")).toContain("OUT_OF_WORKDAY");
    expect(v("17:30", "18:00")).toEqual([]);
  });
  it("enforces start < end", () => {
    expect(v("12:00", "12:00")).toContain("END_BEFORE_START");
    expect(v("13:00", "12:00")).toContain("END_BEFORE_START");
  });
  it("enforces duration 30min..2h", () => {
    expect(v("13:00", "13:15")).toContain("TOO_SHORT");
    expect(v("13:00", "13:30")).toEqual([]);
    expect(v("13:00", "15:00")).toEqual([]);
    expect(v("13:00", "15:30")).toContain("TOO_LONG");
  });
  it("blocks the past", () => {
    expect(v("13:00", "14:00", { date: "2026-10-27" })).toContain("PAST");
    expect(v("11:00", "12:00", { date: "2026-10-28" })).toContain("PAST");
    expect(v("12:00", "13:00", { date: "2026-10-28" })).toEqual([]);
  });
  it("rejects malformed input", () => expect(validateBooking({ date: "x", start: "9:00", end: "10:00" }, [], { now })).toEqual(["INVALID_FORMAT"]));
  it("rejects calendar dates that roll over", () => expect(validateBooking({ date: "2026-02-30", start: "10:00", end: "10:30" }, [], { now })).toEqual(["INVALID_FORMAT"]));
});

describe("helpers", () => {
  it("findConflicts ignores other dates", () =>
    expect(findConflicts({ date: "2026-10-30", start: "10:00", end: "11:00" }, existing)).toEqual([]));
  it("isPastSlot", () => expect(isPastSlot("2026-10-28", "11:59", now)).toBe(true));
});
