import { describe, expect, it } from "vitest";
import { effectiveStablefordTotals } from "./team-points";

describe("effectiveStablefordTotals", () => {
  it("returns computed totals when no overrides", () => {
    expect(effectiveStablefordTotals(24, 21)).toEqual({
      teamA: 24,
      teamB: 21,
      isOverridden: false,
    });
  });

  it("returns override values when both are set", () => {
    expect(effectiveStablefordTotals(24, 21, 26, 20)).toEqual({
      teamA: 26,
      teamB: 20,
      isOverridden: true,
    });
  });

  it("allows partial override on one side", () => {
    expect(effectiveStablefordTotals(24, 21, 26, null)).toEqual({
      teamA: 26,
      teamB: 21,
      isOverridden: true,
    });
  });
});
