/**
 * PrimeNG's p-datepicker models a date as a JS `Date` at local midnight, and the backend's
 * `DateOnly` fields (DateOfBirth, DateOfJoining) serialize as bare "yyyy-MM-dd" strings with no
 * time/offset component. Converting between the two via `.toISOString()` / `new Date(str)` goes
 * through UTC and silently shifts the calendar day by one for any viewer whose timezone isn't
 * UTC+0 - these helpers stay entirely in local calendar fields so the day picked is the day sent
 * and the day stored is the day displayed, regardless of the browser's timezone.
 */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
