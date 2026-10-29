import type { Booking } from "@/domain/booking/types";
import type { ErrorCode } from "@/domain/booking/rules";

export class ApiError extends Error {
  constructor(public status: number, message = `Request failed (${status})`) { super(message); }
}
export class ConflictError extends ApiError {
  constructor(public conflicts: Booking[]) { super(409, "Booking conflict"); }
}
export class ValidationError extends ApiError {
  constructor(public errors: ErrorCode[]) { super(422, "Validation failed"); }
}
export class NotFoundError extends ApiError {
  constructor() { super(404, "Booking not found"); }
}
