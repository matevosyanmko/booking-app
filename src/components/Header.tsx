

import { CalendarDays, User } from "lucide-react";


export function Header() {

    /**
     * 
     * Header Component .
     */


  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="text-indigo-600" aria-hidden="true">◆</span>
        <span>Room Meetings</span>
      </div>

      <p className="m-0 inline-flex items-center gap-1.5 text-sm text-slate-500">
        <CalendarDays className="size-4" aria-hidden="true" />
        <span>Meeting room booking</span>
      </p>

      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <User className="size-4" aria-hidden="true" />
        <span>Account</span>
      </div>
    </header>
  );
}

