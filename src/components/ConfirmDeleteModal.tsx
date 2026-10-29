"use client";

import { useEffect, useRef } from "react";
import type { Booking } from "../domain/booking/types";

type ConfirmDeleteModalProps = {
  booking: Booking | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({ booking, busy, onConfirm, onCancel }: ConfirmDeleteModalProps) {

    /**
     * 
     * ConfirmDeleteModal Component .
     */


  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (booking && !dialog.open) dialog.showModal();
    if (!booking && dialog.open) dialog.close();
  }, [booking]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-meeting-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      className="m-auto w-[min(100%,360px)] rounded-[14px] border-0 bg-white p-0 text-[#15202b] shadow-[0_20px_70px_#15202b38] backdrop:bg-[#14203366]"
    >
      {booking && (
        <div className="grid gap-4 p-[26px]">
          <div className="grid gap-1.5">
            <h2 id="delete-meeting-title" className="m-0 text-lg font-bold">
              Delete meeting?
            </h2>
            <p className="m-0 text-[13px] text-[#77818e]">
              “{booking.title || "Untitled meeting"}” ({booking.start} – {booking.end}) will be
              removed. This can’t be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="cursor-pointer rounded-[7px] bg-[#f1f3f6] px-4 py-2.5 font-bold text-[#15202b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
         <button
  type="button"
  onClick={onConfirm}
  disabled={busy}
  className="cursor-pointer rounded-[7px] bg-[#d85555] px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  {busy ? "Deleting…" : "Delete"}
</button>
          </div>
        </div>
      )}
    </dialog>
  );
}