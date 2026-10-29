
"use client";


import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Booking, MeetingsSectionProps } from "../domain/booking/types";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";


export function MeetingsSection({
    sortedBookings,
    date,
    status,
    isPastDate,
    busyId,
    isEditable,
    onAdd,
    onEdit,
    onDelete,
}: MeetingsSectionProps) {

    /**
     * 
     * MeetingsSection Component .
     */


    const [pendingDelete, setPendingDelete] = useState<Booking | null>(null);


    return (
        <div className="mt-[30px]">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="m-0 text-lg font-bold">Meetings</h2>
                    <span className="text-xs text-[#77818e]">
                        {sortedBookings.length} {sortedBookings.length === 1 ? "meeting" : "meetings"}
                    </span>
                </div>
                {!isPastDate && (
                    <button className="cursor-pointer font-bold text-[#3769ed]" onClick={onAdd}>
                        + Add meeting
                    </button>
                )}
            </div>

            {status === "success" && sortedBookings.length > 0 && (
                <ul className="m-0 grid list-none gap-2 p-0" aria-label={`Meetings on ${date}`}>
                    {sortedBookings.map((booking) => {
                        const editable = isEditable(booking);
                        return (
                            <li
                                key={booking.id}
                                className="flex items-center gap-3 rounded-[9px] border border-[#e7ebf0] bg-white px-[15px] py-[13px]"
                            >
                                <span className="h-[35px] w-1 rounded-lg bg-[#7756d8]" />
                                <div className="grid flex-1 gap-0.5">
                                    <strong className="text-[13px]">{booking.title || "Untitled meeting"}</strong>
                                    <span className="text-xs text-[#77818e]">
                                        {booking.start} – {booking.end}
                                        {booking.user && ` · ${booking.user}`}
                                        {!editable && " · Past"}
                                    </span>
                                </div>

                                {editable && (
                                    <div className="flex gap-[5px]">
                                        <button
                                            className="cursor-pointer p-1.5 text-xs font-bold text-[#3769ed]"
                                            onClick={() => onEdit(booking)}
                                            disabled={busyId === booking.id}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="inline-flex cursor-pointer items-center gap-1 p-1.5 text-xs font-bold text-[#d85555]"
                                            //   onClick={() => onDelete(booking)}
                                            onClick={() => setPendingDelete(booking)}
                                            disabled={busyId === booking.id}
                                            aria-label={`Delete ${booking.title || "untitled meeting"}`}
                                        >
                                            <Trash2 className="size-4" aria-hidden="true" />{" "}
                                            <span className="sr-only sm:not-sr-only">
                                                {busyId === booking.id ? "Deleting…" : "Delete"}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}


            <ConfirmDeleteModal
                booking={pendingDelete}
                busy={pendingDelete !== null && busyId === pendingDelete.id}
                onCancel={() => setPendingDelete(null)}
                onConfirm={async () => {
                    if (!pendingDelete) return;
                    try {
                        await onDelete(pendingDelete);
                    } finally {
                        setPendingDelete(null);
                    }
                }}
            />
        </div>
    );
}