import { describe, it, expect } from "vitest";
import { handleCalculation } from "../api-utils";

function mkReq(body: unknown): Request {
  return new Request("http://test/api/v1/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function mkReqBadJson(): Request {
  return new Request("http://test/api/v1/test", {
    method: "POST",
    body: "{not: valid json",
  });
}

describe("handleCalculation", () => {
  it("returns success + data on valid input", async () => {
    const res = await handleCalculation(
      mkReq({ a: 2, b: 3 }),
      (input: { a: number; b: number }) => ({ sum: input.a + input.b }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ sum: 5 });
  });

  it("returns 400 on invalid JSON body", async () => {
    const res = await handleCalculation(
      mkReqBadJson(),
      () => ({}),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Invalid JSON");
  });

  it("returns 400 when required fields missing", async () => {
    const res = await handleCalculation(
      mkReq({ a: 1 }),
      () => ({}),
      ["a", "b", "c"],
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Missing required fields");
    expect(json.error).toContain("b");
    expect(json.error).toContain("c");
  });

  it("passes when all required fields present", async () => {
    const res = await handleCalculation(
      mkReq({ a: 1, b: 2 }),
      (input: { a: number; b: number }) => ({ mul: input.a * input.b }),
      ["a", "b"],
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ mul: 2 });
  });

  it("returns 400 when calculFn throws", async () => {
    const res = await handleCalculation(
      mkReq({ x: 1 }),
      () => { throw new Error("Division by zero"); },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Division by zero");
  });

  it("handles non-Error throws with 'Unknown calculation error'", async () => {
    const res = await handleCalculation(
      mkReq({ x: 1 }),
      () => { throw "string error"; },
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Unknown calculation");
  });

  it("accepts empty required fields list as no-check", async () => {
    const res = await handleCalculation(
      mkReq({ anything: "goes" }),
      (input: { anything: string }) => ({ echo: input.anything }),
      [],
    );
    expect(res.status).toBe(200);
  });
});
