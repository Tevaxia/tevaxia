import { describe, it, expect } from "vitest";
import { bookingLeadDays, leadTimeBucket, LEAD_BUCKET_LABELS } from "../pms/pickup";

describe("bookingLeadDays", () => {
  it("jours positifs pour résa future", () => {
    const days = bookingLeadDays("2026-04-01T10:00:00Z", "2026-04-15");
    expect(days).toBeGreaterThanOrEqual(13);
    expect(days).toBeLessThanOrEqual(14);
  });
  it("≤ 0 pour résa jour même ou jour précédent", () => {
    const d = bookingLeadDays("2026-04-01T10:00:00Z", "2026-04-01");
    expect(d).toBeLessThanOrEqual(0);
  });
});

describe("leadTimeBucket", () => {
  it("0 jour → same_day", () => {
    expect(leadTimeBucket(0)).toBe("same_day");
  });
  it("3 jours → short", () => {
    expect(leadTimeBucket(3)).toBe("short");
  });
  it("20 jours → medium", () => {
    expect(leadTimeBucket(20)).toBe("medium");
  });
  it("60 jours → long", () => {
    expect(leadTimeBucket(60)).toBe("long");
  });
  it("100 jours → very_long", () => {
    expect(leadTimeBucket(100)).toBe("very_long");
  });
});

describe("LEAD_BUCKET_LABELS", () => {
  it("5 buckets avec labels", () => {
    expect(LEAD_BUCKET_LABELS.same_day.toLowerCase()).toContain("jour");
    expect(LEAD_BUCKET_LABELS.short).toContain("1-7");
    expect(LEAD_BUCKET_LABELS.medium).toContain("8-30");
    expect(LEAD_BUCKET_LABELS.long).toContain("31-90");
    expect(LEAD_BUCKET_LABELS.very_long).toContain("> 90");
  });
});
