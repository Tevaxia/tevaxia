/** Parse the selected locale's number syntax, without guessing or partial parsing. */
export function parseLocalizedNumber(text: string, locale: string): number | null {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const decimal = parts.find(part => part.type === "decimal")?.value ?? ".";
  const group = parts.find(part => part.type === "group")?.value;
  let input = text.trim();
  if (!input) return null;
  const sign = input.startsWith("-") ? -1 : 1;
  if (/^[+-]/.test(input)) input = input.slice(1);
  // French grouping can be pasted as ordinary, non-breaking or narrow spaces.
  if (group && /\s/u.test(group)) input = input.replace(/[ \u00a0\u202f]/g, group);
  const segments = input.split(decimal);
  if (segments.length > 2 || (segments.length === 2 && !/^\d+$/.test(segments[1]))) return null;
  const integer = segments[0];
  let digits = integer;
  if (group && integer.includes(group)) {
    const groups = integer.split(group);
    if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some(value => !/^\d{3}$/.test(value))) return null;
    digits = groups.join("");
  }
  if (!/^\d+$/.test(digits)) return null;
  const value = sign * Number(digits + (segments.length === 2 ? "." + segments[1] : ""));
  return Number.isFinite(value) ? value : null;
}

export function validateLocalizedNumber(text: string, locale: string, min: number, max: number, step: number):
  { value: number; error?: never } | { error: "format" | "range" | "step"; value?: never } {
  const value = parseLocalizedNumber(text, locale);
  if (value === null) return { error: "format" };
  if (value < min || value > max) return { error: "range" };
  const steps = (value - min) / step;
  if (step > 0 && Math.abs(steps - Math.round(steps)) > 1e-7) return { error: "step" };
  return { value };
}
