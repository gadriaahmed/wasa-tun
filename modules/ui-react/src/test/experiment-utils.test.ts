import { describe, expect, it } from "vitest";
import {
  buildNewExperimentPayload,
  experimentName,
  normalizeStatus,
  percentToSamplingRate,
  samplingRateToPercent,
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

  it("converts UI percent to API sampling rate", () => {
    expect(percentToSamplingRate(100)).toBe(1);
    expect(percentToSamplingRate(50)).toBe(0.5);
    expect(samplingRateToPercent(0.5)).toBe(50);
    expect(samplingRateToPercent(50)).toBe(50);
  });

  it("builds create payload without state field", () => {
    const start = new Date("2026-07-01T00:00:00");
    const end = new Date("2026-07-15T00:00:00");
    const payload = buildNewExperimentPayload({
      label: "My test",
      applicationName: "MyApp",
      description: "Hypothesis",
      samplingPercent: 100,
      startTime: start,
      endTime: end,
    });

    expect(payload).toMatchObject({
      label: "My test",
      applicationName: "MyApp",
      description: "Hypothesis",
      samplingPercent: 1,
    });
    expect(payload.startTime).toContain("2026-07-01T00:00:00");
    expect(payload.endTime).toContain("2026-07-15T00:00:00");
    expect("state" in payload).toBe(false);
  });
});
