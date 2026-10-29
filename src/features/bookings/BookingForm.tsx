"use client";

import { ChevronDown, Clock3, FileText, User, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { bookingsClient } from "@/api/bookingsClient";
import { ConflictError, ValidationError } from "@/api/errors";
import { ERROR_MESSAGES, MAX_DURATION, MAX_TITLE, MIN_DURATION, STEP, WORK_END, WORK_START, isPastSlot, validateBooking } from "@/domain/booking/rules";
import { toHHmm, toMinutes } from "@/domain/booking/time";
import type { Booking } from "@/domain/booking/types";

type Props = { date: string; bookings: Booking[]; editing: Booking | null; onDone: () => void; onCancel: () => void; onStale: () => Promise<void> };
const range = (from: number, to: number) => Array.from({ length: Math.max(0, Math.floor((to - from) / STEP) + 1) }, (_, i) => from + i * STEP);

export function BookingForm({ date, bookings, editing, onDone, onCancel, onStale }: Props) {

  /**
   * 
   * 
   * BookingForm Components Hooks.
   */


  const uid = useId();
  const [start, setStart] = useState(editing?.start ?? "");
  const [end, setEnd] = useState(editing?.end ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [user, setUser] = useState(editing?.user ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const startOptions = range(WORK_START, WORK_END - MIN_DURATION).map(toHHmm);
  const endOptions = useMemo(() => start ? range(toMinutes(start) + MIN_DURATION, Math.min(toMinutes(start) + MAX_DURATION, WORK_END)).map(toHHmm) : [], [start]);
  const errors = start && end ? validateBooking({ date, start, end, title, user }, bookings, { excludeId: editing?.id }) : [];
  const errId = `${uid}-err`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end || errors.length) return;
    setSubmitting(true);
    setServerError(null);
    const input = { date, start, end, title: title.trim() || undefined, user: user.trim() || undefined };
    try {
      if (editing) await bookingsClient.update(editing.id, input);
      else await bookingsClient.create(input);
      onDone();
    } catch (err) {
      if (err instanceof ConflictError) {
        setServerError("This time was just taken by another booking. Please choose a different time.");
        await onStale();
      } else if (err instanceof ValidationError) setServerError(err.errors.map((code) => ERROR_MESSAGES[code]).join(" "));
      else setServerError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-950/10" aria-labelledby={`${uid}-heading`} noValidate>
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Meeting room</p>
          <h2 id={`${uid}-heading`} className="font-display text-xl font-bold tracking-tight text-slate-900">{editing ? "Edit booking" : "New booking"}</h2><p className="mt-1 text-sm text-slate-500">{date}</p></div>
        <button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close booking form" disabled={submitting}><X className="size-5" aria-hidden="true" /></button>
      </div>
      <div className="grid gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">


          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-indigo-500" aria-hidden="true" />
              Start time
            </span>

            <div className="relative">
              <select
                className="peer h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-10 text-sm font-normal text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 invalid:text-slate-400 [&>option]:text-slate-900"
                value={start}
                onChange={(e) => { setStart(e.target.value); setEnd(""); }}
                aria-invalid={errors.length > 0}
                aria-describedby={errId}
                required
              >
                <option value="" disabled>Select…</option>
                {startOptions.map((time) => (
                  <option key={time} value={time} disabled={isPastSlot(date, time) && time !== editing?.start}>
                    {time}
                  </option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-indigo-500 peer-disabled:opacity-60"
              />
            </div>
          </label>


          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-indigo-500" aria-hidden="true" />
              End time
            </span>

            <div className="relative">
              <select
                className="peer h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-10 text-sm font-normal text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 invalid:text-slate-400 [&>option]:text-slate-900"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={!start}
                aria-invalid={errors.length > 0}
                aria-describedby={errId}
                required
              >
                <option value="" disabled>Select…</option>
                {endOptions.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>

              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition peer-focus:text-indigo-500 peer-disabled:opacity-60"
              />
            </div>
          </label>

        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-700"><span className="inline-flex items-center gap-2"><FileText className="size-4 text-indigo-500" aria-hidden="true" />Title <span className="font-normal text-slate-400">(optional)</span></span><input className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="e.g. Product sync" value={title} maxLength={MAX_TITLE + 20} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700"><span className="inline-flex items-center gap-2"><User className="size-4 text-indigo-500" aria-hidden="true" />User <span className="font-normal text-slate-400">(optional)</span></span><input className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="e.g. Alex Morgan" value={user} maxLength={MAX_TITLE + 20} onChange={(e) => setUser(e.target.value)} /></label>

        <label className="text-sm text-slate-500"><span className="font-semibold text-slate-700">Duration:</span> {start && end ? `${toMinutes(end) - toMinutes(start)} minutes` : "–"}</label>
        <p className="text-sm text-slate-500">Bookings can be between {MIN_DURATION} and {MAX_DURATION} minutes long, in {STEP}-minute increments.</p>
      </div>
      <div className="flex flex-col gap-5 border-t border-slate-100 px-6 py-5">

        <div id={errId} role="alert" aria-live="polite" className="min-h-5 text-sm text-red-600">{errors.map((code) => <p key={code} className="mb-1">{ERROR_MESSAGES[code]}</p>)}{serverError && <p className="mb-1">{serverError}</p>}</div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" className="rounded-lg bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50" onClick={onCancel} disabled={submitting}>Cancel</button><button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || !start || !end || errors.length > 0}>{submitting ? "Saving…" : editing ? "Save changes" : "Create booking"}</button></div>
      </div>
    </form>
  );
}
