import axios from "axios";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildNewExperimentPayload,
  percentToSamplingRate,
  toApiAllocationPercent,
} from "@/lib/experiment-utils";

const API_BASE = process.env.WASABI_API_URL ?? "http://localhost:8088";
const AUTH_HEADER = `Basic ${Buffer.from("admin:admin").toString("base64")}`;

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: AUTH_HEADER,
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
});

let backendAvailable = false;
let createdExperimentId: string | undefined;
let createdAppName: string | undefined;

async function probeBackend(): Promise<boolean> {
  try {
    const res = await client.get("/api/v1/ping");
    return res.status === 200;
  } catch {
    return false;
  }
}

describe("user journey — live backend", () => {
  beforeAll(async () => {
    backendAvailable = await probeBackend();
    if (!backendAvailable) {
      console.warn(`Skipping live journeys: backend unavailable at ${API_BASE}`);
    }
  });

  afterAll(async () => {
    if (!backendAvailable || !createdExperimentId) {
      return;
    }
    await client.delete(`/api/v1/experiments/${createdExperimentId}`);
  });

  it("login and load permissions", async ({ skip }) => {
    if (!backendAvailable) {
      skip();
    }
    const login = await client.post(
      "/api/v1/authentication/login",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    expect(login.status).toBe(200);
    expect(login.data.access_token).toBeTruthy();

    const permissions = await client.get(
      "/api/v1/authorization/users/admin/permissions"
    );
    expect(permissions.status).toBe(200);
    expect(permissions.data.permissionsList?.length).toBeGreaterThan(0);
  });

  it("list experiments and applications", async ({ skip }) => {
    if (!backendAvailable) {
      skip();
    }
    const timezone = new Date().toString().match(/([-+][0-9]+)\s/)?.[1]?.replace("+", "%2B") ?? "+00";
    const experiments = await client.get(
      `/api/v1/experiments?page=1&per_page=10&filter=&sort=&timezone=${timezone}`
    );
    expect(experiments.status).toBe(200);
    expect(Array.isArray(experiments.data.experiments)).toBe(true);

    const apps = await client.get("/api/v1/applications");
    expect(apps.status).toBe(200);
    expect(Array.isArray(apps.data)).toBe(true);
  });

  it("create experiment with valid payload", async ({ skip }) => {
    if (!backendAvailable) {
      skip();
    }
    createdAppName = `JourneyApp${Date.now()}`;
    const payload = buildNewExperimentPayload({
      label: `JourneyExp${Date.now()}`,
      applicationName: createdAppName,
      description: "Automated journey test experiment",
      samplingPercent: 100,
    });

    const res = await client.post(
      "/api/v1/experiments/?createNewApplication=true",
      payload
    );
    expect(res.status).toBe(201);
    expect(res.data.id).toBeTruthy();
    expect(res.data.state).toBe("DRAFT");
    createdExperimentId = res.data.id;
  });

  it("manage buckets on created experiment", async ({ skip }) => {
    if (!backendAvailable || !createdExperimentId) {
      skip();
    }

    const createA = await client.post(
      `/api/v1/experiments/${createdExperimentId}/buckets`,
      {
        label: "control",
        allocationPercent: toApiAllocationPercent(50),
        isControl: true,
      }
    );
    expect(createA.status).toBe(201);

    const createB = await client.post(
      `/api/v1/experiments/${createdExperimentId}/buckets`,
      {
        label: "variant",
        allocationPercent: toApiAllocationPercent(50),
        isControl: false,
      }
    );
    expect(createB.status).toBe(201);

    const list = await client.get(
      `/api/v1/experiments/${createdExperimentId}/buckets`
    );
    expect(list.status).toBe(200);
    expect(list.data.buckets?.length).toBeGreaterThanOrEqual(2);
  });

  it("change experiment state to running", async ({ skip }) => {
    if (!backendAvailable || !createdExperimentId) {
      skip();
    }
    const res = await client.put(
      `/api/v1/experiments/${createdExperimentId}`,
      { state: "RUNNING" }
    );
    expect(res.status).toBe(200);
    expect(res.data.state).toBe("RUNNING");
  });

  it("submit and read feedback", async ({ skip }) => {
    if (!backendAvailable) {
      skip();
    }
    const send = await client.post("/api/v1/feedback", {
      comments: "Journey test feedback",
      score: 8,
    });
    expect(send.status).toBe(201);

    const inbox = await client.get("/api/v1/feedback");
    expect(inbox.status).toBe(200);
    expect(Array.isArray(inbox.data.feedback)).toBe(true);
  });

  it("load users roles with nested roleList shape", async ({ skip }) => {
    if (!backendAvailable) {
      skip();
    }
    const res = await client.get("/api/v1/authorization/applications");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0) {
      expect(res.data[0]).toHaveProperty("roleList");
    }
  });

  it("saves segmentation rule with rule-only PUT", async ({ skip }) => {
    if (!backendAvailable || !createdExperimentId) {
      skip();
    }
    const experimentId = createdExperimentId as string;
    const res = await client.put(`/api/v1/experiments/${experimentId}`, {
      rule: 'country == "US"',
    });
    expect(res.status).toBe(200);
    expect(res.data.rule).toBe('country == "US"');
  });

  it("update priorities with experimentIDs payload", async ({ skip }) => {
    if (!backendAvailable || !createdAppName || !createdExperimentId) {
      skip();
    }
    const appName = createdAppName as string;
    const experimentId = createdExperimentId as string;
    const res = await client.put(
      `/api/v1/applications/${encodeURIComponent(appName)}/priorities`,
      { experimentIDs: [experimentId] }
    );
    expect([200, 204]).toContain(res.status);
  });
});

describe("API payload contracts", () => {
  it("converts percent fields for backend", () => {
    expect(percentToSamplingRate(100)).toBe(1);
    expect(toApiAllocationPercent(50)).toBe(0.5);
    expect(toApiAllocationPercent(0.5)).toBe(0.5);
  });

  it("buildNewExperimentPayload excludes state", () => {
    const payload = buildNewExperimentPayload({
      label: "x",
      applicationName: "App",
      description: "desc",
      samplingPercent: 50,
    });
    expect(payload.samplingPercent).toBe(0.5);
    expect("state" in payload).toBe(false);
  });
});
