import { format, getHours, getMinutes, isBefore, isSameDay, isValid, parse } from "date-fns";

const pad = (n: number) => String(n).padStart(2, "0");
export const DATE_FORMAT = "yyyy-MM-dd";
const parseDate = (value: string): Date => parse(value, DATE_FORMAT, new Date(0));

export const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toHHmm = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
/** Local calendar date as YYYY-MM-DD. Dates stay strings to avoid timezone off-by-one bugs. */
export const toDateStr = (d: Date = new Date()): string =>
  format(d, DATE_FORMAT);
export const minutesOfDay = (d: Date = new Date()): number => getHours(d) * 60 + getMinutes(d);

/** Parse a local calendar date without interpreting YYYY-MM-DD as UTC. */
export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseDate(value);
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value;
};

export const isDateBefore = (left: string, right: string): boolean => isBefore(parseDate(left), parseDate(right));
export const isSameDate = (left: string, right: string): boolean => isSameDay(parseDate(left), parseDate(right));
