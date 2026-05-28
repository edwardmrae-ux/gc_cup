import { describe, expect, it } from "vitest";
import { formatSessionScoped1v1MatchPlayState } from "./leaderboard";

describe("formatSessionScoped1v1MatchPlayState", () => {
  const playerAName = "Player A";
  const playerBName = "Player B";

  it("returns All Square when tied early", () => {
    expect(
      formatSessionScoped1v1MatchPlayState({
        holesA: 2,
        holesB: 2,
        holesCompleted: 4,
        playerAName,
        playerBName,
      })
    ).toBe("All Square");
  });

  it("returns 'N up' when leader has not clinched", () => {
    expect(
      formatSessionScoped1v1MatchPlayState({
        holesA: 3,
        holesB: 1,
        holesCompleted: 4,
        playerAName,
        playerBName,
      })
    ).toBe("Player A 2 up");
  });

  it("returns clinched X&Y wording when lead is greater than holes remaining", () => {
    expect(
      formatSessionScoped1v1MatchPlayState({
        holesA: 5,
        holesB: 2,
        holesCompleted: 7,
        playerAName,
        playerBName,
      })
    ).toBe("Player A wins 3&2");
  });

  it("returns All Square when all 9 holes are complete and tied", () => {
    expect(
      formatSessionScoped1v1MatchPlayState({
        holesA: 4,
        holesB: 4,
        holesCompleted: 9,
        playerAName,
        playerBName,
      })
    ).toBe("All Square");
  });

  it("returns 'wins N up' when all 9 holes are complete with a leader", () => {
    expect(
      formatSessionScoped1v1MatchPlayState({
        holesA: 5,
        holesB: 4,
        holesCompleted: 9,
        playerAName,
        playerBName,
      })
    ).toBe("Player A wins 1 up");
  });

  it("recalculates from the latest entered scores after an earlier clinch state", () => {
    const clinchedAtSeven = formatSessionScoped1v1MatchPlayState({
      holesA: 5,
      holesB: 2,
      holesCompleted: 7,
      playerAName,
      playerBName,
    });
    const recomputedAtNine = formatSessionScoped1v1MatchPlayState({
      holesA: 5,
      holesB: 4,
      holesCompleted: 9,
      playerAName,
      playerBName,
    });

    expect(clinchedAtSeven).toBe("Player A wins 3&2");
    expect(recomputedAtNine).toBe("Player A wins 1 up");
  });
});
