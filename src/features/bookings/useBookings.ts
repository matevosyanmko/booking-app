"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { bookingsClient } from "@/api/bookingsClient";
import type { Booking } from "@/domain/booking/types";

export type Status = "loading" | "success" | "error";

export function useBookings(date: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const reqId = useRef(0);

  const reload = useCallback(async (opts: { silent?: boolean } = {}) => {
    const id = ++reqId.current; // ignore stale responses when date changes quickly
    if (!opts.silent) setStatus("loading");
    try {
      const data = await bookingsClient.list(date);
      if (id !== reqId.current) return;
      setBookings(data);
      setStatus("success");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
  }, [date]);

  useEffect(() => { void reload(); }, [reload]);
  return { bookings, status, reload };
}
