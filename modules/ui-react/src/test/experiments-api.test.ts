import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { fetchExperiments } from "@/api/experiments";

const server = setupServer(
  http.get("/api/v1/experiments", () =>
    HttpResponse.json({
      experiments: [
        {
          id: "exp-1",
          label: "Test",
          applicationName: "MyApp",
          state: "DRAFT",
        },
      ],
    })
  )
);

describe("experiments api", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("parses experiments list", async () => {
    const result = await fetchExperiments();
    expect(result.experiments).toHaveLength(1);
    expect(result.experiments[0].label).toBe("Test");
  });
});
