import { describe, expect, it } from "vitest";
import type { IndividualScoreRow } from "./individual-scoring";
import { buildSaturdayAfternoonFoursomeGroups } from "./saturday-afternoon-seeding";

function row(
  id: string,
  name: string,
  cumulative: number | null
): IndividualScoreRow {
  return {
    playerId: id,
    playerName: name,
    teamColor: null,
    sessionStrokes: [null, null, null],
    cumulative,
    defendingChamp: false,
  };
}

function playerAt(
  groups: ReturnType<typeof buildSaturdayAfternoonFoursomeGroups>,
  foursomeLabel: string,
  seed: number
): IndividualScoreRow | null {
  const group = groups.find((g) => g.label === foursomeLabel);
  return group?.players.find((p) => p.seed === seed)?.row ?? null;
}

describe("buildSaturdayAfternoonFoursomeGroups", () => {
  it("places defending champion at Harborfields seed 1 regardless of score", () => {
    const rows = [
      row("a", "Alice", 70),
      row("b", "Bob", 72),
      row("c", "Carol", 74),
      row("d", "Dave", 76),
      row("champ", "Champion", 90),
    ];

    const groups = buildSaturdayAfternoonFoursomeGroups(rows, "champ");

    expect(playerAt(groups, "Harborfields Invitational", 1)?.playerId).toBe("champ");
    expect(playerAt(groups, "Harborfields Invitational", 2)?.playerId).toBe("a");
    expect(playerAt(groups, "Harborfields Invitational", 3)?.playerId).toBe("b");
    expect(playerAt(groups, "Harborfields Invitational", 4)?.playerId).toBe("c");
  });

  it("assigns 4th-lowest non-champion to Miller High Life seed 1", () => {
    const rows = [
      row("p1", "P1", 70),
      row("p2", "P2", 71),
      row("p3", "P3", 72),
      row("p4", "P4", 73),
      row("p5", "P5", 74),
      row("champ", "Champion", 99),
    ];

    const groups = buildSaturdayAfternoonFoursomeGroups(rows, "champ");

    expect(playerAt(groups, "Miller High Life Classic", 1)?.playerId).toBe("p4");
    expect(playerAt(groups, "Miller High Life Classic", 2)?.playerId).toBe("p5");
  });

  it("without defending champion, lowest scorer gets Harborfields seed 1", () => {
    const rows = [row("a", "Alice", 70), row("b", "Bob", 72), row("c", "Carol", 74)];

    const groups = buildSaturdayAfternoonFoursomeGroups(rows, null);

    expect(playerAt(groups, "Harborfields Invitational", 1)?.playerId).toBe("a");
    expect(playerAt(groups, "Harborfields Invitational", 2)?.playerId).toBe("b");
    expect(playerAt(groups, "Harborfields Invitational", 3)?.playerId).toBe("c");
  });

  it("marks defending champion slot", () => {
    const rows = [row("a", "Alice", 70), row("champ", "Champion", 90)];
    const groups = buildSaturdayAfternoonFoursomeGroups(rows, "champ");
    const slot = groups[0].players.find((p) => p.seed === 1);
    expect(slot?.isDefendingChampion).toBe(true);
  });
});
