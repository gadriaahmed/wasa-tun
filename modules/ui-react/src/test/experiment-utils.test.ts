import { describe, expect, it } from "vitest";
import {
  experimentName,
  normalizeStatus,
  stateActionLabel,
} from "@/lib/experiment-utils";

describe("experiment-utils", () => {
  it("prefers label over name", () => {
    expect(
      experimentName({ id: "1", label: "Label", name: "Name", applicationName: "app" })
    ).toBe("Label");
  });

  it("normalizes stopped to paused", () => {
    expect(normalizeStatus("stopped")).toBe("PAUSED");
  });

  it("maps state actions", () => {
    expect(stateActionLabel("TERMINATED")).toBe("terminate");
    expect(stateActionLabel("PAUSED")).toBe("stop");
  });
});
