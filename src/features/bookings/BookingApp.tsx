"use client";

import { addDays, addHours, format, getDay, getMonth, parseISO, startOfMonth, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { bookingsClient } from "@/api/bookingsClient";
import { isEditable } from "@/domain/booking/rules";
import { isDateBefore, toDateStr, toMinutes } from "@/domain/booking/time";
import type { Booking } from "@/domain/booking/types";
import { BookingForm } from "./BookingForm";
import { useBookings } from "./useBookings";
import { Header } from "@/components/Header";
import { MeetingsSection } from "@/components/MeetingCard";


const CALENDAR_START = 9 * 60;
const HOUR_HEIGHT = 76;

export function BookingApp() {

  /**
   *  
   * Booking 
   * 
   */

  const [date, setDate] = useState(() => toDateStr());
  const [form, setForm] = useState<{ editing: Booking | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { bookings, status, reload } = useBookings(date);
  const parsedDate = parseISO(date);
  const isPastDate = isDateBefore(date, toDateStr());
  const dateLabel = format(parsedDate, "EEEE, MMMM d");
  const monthLabel = format(parsedDate, "MMMM yyyy");
  const sortedBookings = useMemo(() => [...bookings].sort((a, b) => a.start.localeCompare(b.start)), [bookings]);

  function changeDate(next: Date) {
    setDate(toDateStr(next));
    setForm(null);
    setMessage(null);
  }

  async function remove(b: Booking) {
  setBusyId(b.id);
  try {
    await bookingsClient.remove(b.id);
    setMessage("Booking deleted.");
  } catch (e) {
    setMessage(e instanceof Error ? e.message : "Could not delete the booking.");
  } finally {
    setBusyId(null);
    await reload({ silent: true });
  }
}

  return (
    <main className="app-shell">
      <Header />

      <section className="workspace">
        <aside className="sidebar">
          <button className="create-button" onClick={() => setForm({ editing: null })} disabled={isPastDate || status === "loading"}>
            <span className="plus-icon">+</span> New meeting
          </button>
          <div className="mini-calendar" aria-label="Choose a date">
            <div className="mini-calendar-heading"><strong>{monthLabel}</strong><span>⌄</span></div>
            <div className="weekday-row"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
            <div className="mini-calendar-grid">
              {Array.from({ length: 35 }, (_, index) => {
                const first = startOfMonth(parsedDate);
                const mondayOffset = (getDay(first) + 6) % 7;
                const day = addDays(first, index - mondayOffset);
                const value = toDateStr(day);
                const selected = value === date;
                const outside = getMonth(day) !== getMonth(parsedDate);
                return <button key={value} className={`${selected ? "selected" : ""} ${outside ? "outside" : ""}`} onClick={() => changeDate(day)}>{format(day, "d")}</button>;
              })}
            </div>
          </div>
          <div className="sidebar-note"><span className="dot" /> Working hours <strong>09:00–18:00</strong></div>
        </aside>

        <section className="calendar-panel" aria-label="Meeting calendar">
          <div className="calendar-toolbar">
            <div className="date-heading"><h1>{dateLabel}</h1><p>{isPastDate ? "Past date · read-only" : "Your meeting room schedule"}</p></div>
            <div className="date-controls">
              <button className="icon-button" aria-label="Previous day" onClick={() => changeDate(subDays(parsedDate, 1))}>‹</button>
              <button className="today-button" onClick={() => changeDate(new Date())}>Today</button>
              <button className="icon-button" aria-label="Next day" onClick={() => changeDate(addDays(parsedDate, 1))}>›</button>
              <label className="date-picker-label"><span className="calendar-icon">▣</span><input type="date" value={date} onChange={(e) => e.target.value && changeDate(parseISO(e.target.value))} aria-label="Select date" /></label>
            </div>
          </div>

          <div className="status-region" role="status" aria-live="polite">{message}</div>
          {status === "error" && <div role="alert" className="inline-error"><span>Could not load this schedule.</span><button onClick={() => reload()}>Retry</button></div>}

          <div className="timeline-wrap">
            <div className="timeline">
              <div className="timeline-hours" aria-hidden="true">
                {Array.from({ length: 10 }, (_, index) => <span key={index}>{format(addHours(parseISO("2020-01-01T09:00:00"), index), "HH:mm")}</span>)}
              </div>
              <div className="timeline-canvas">
                {Array.from({ length: 10 }, (_, index) => <div className="hour-line" key={index} style={{ top: index * HOUR_HEIGHT }} />)}
                {status === "loading" && <div className="loading-state" aria-busy="true"><span className="spinner" /> Loading schedule…</div>}
                {status === "success" && sortedBookings.map((booking) => {
                  const top = ((toMinutes(booking.start) - CALENDAR_START) / 60) * HOUR_HEIGHT;
                  const height = Math.max(42, ((toMinutes(booking.end) - toMinutes(booking.start)) / 60) * HOUR_HEIGHT);
                  const editable = isEditable(booking);
                  return <button key={booking.id} className={`booking-block ${editable ? "clickable" : "readonly"}`} style={{ top, height }} onClick={() => editable && setForm({ editing: booking })} aria-label={`${booking.start} to ${booking.end}, ${booking.title ?? "Untitled"}${booking.user ? `, ${booking.user}` : ""}`}>
                    <strong>{booking.title || "Untitled meeting"}</strong><span>{booking.start} – {booking.end}{booking.user && ` · ${booking.user}`}</span>
                  </button>;
                })}
                {status === "success" && sortedBookings.length === 0 && <div className="empty-state"><div className="empty-icon">✦</div><strong>Your day is clear</strong><span>No meetings booked for this date.</span></div>}
              </div>
            </div>
          </div>

          <MeetingsSection
            sortedBookings={sortedBookings}
            date={date}
            status={status}
            isPastDate={isPastDate}
            busyId={busyId}
            isEditable={isEditable}
            onAdd={() => setForm({ editing: null })}
            onEdit={(booking) => setForm({ editing: booking })}
            onDelete={remove}
          />
        </section>
      </section>

      {form && <div className="form-overlay">
        <BookingForm
          date={date}
          bookings={bookings}
          editing={form.editing}
          onStale={() => reload({ silent: true })}
          onCancel={() => setForm(null)}
          onDone={() => {
            toast.success(form.editing ? "Meeting updated successfully." : "Meeting added successfully.");
            setForm(null);

            void reload({ silent: true });
          }}
        />
      </div>}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
   
    </main>
  );
}
