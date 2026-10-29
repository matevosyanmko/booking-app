export type Booking = {
  id: string;
  date: string; 
  start: string; 
  end: string; 
  title?: string;
  user?: string; // Optional attendee/owner display name.
};


export type BookingInput = Omit<Booking, "id">;



export type MeetingsSectionProps = {
  sortedBookings: Booking[];
  date: string;
  status: "loading" | "success" | "error";
  isPastDate: boolean;
  busyId: string | null;
  isEditable: (booking: Booking) => boolean;
  onAdd: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
};