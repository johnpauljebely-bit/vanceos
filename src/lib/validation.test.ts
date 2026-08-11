import { describe, it, expect } from "vitest";
import { nineOneOneSchema, callIntakeSchema } from "./validation";

describe("nineOneOneSchema", () => {
  const base = { postal: "2171", type: "emergency" as const, priority: "medium" as const, description: "Robbery in progress" };

  it("accepts a well-formed 911 call", () => {
    const result = nineOneOneSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a missing postal", () => {
    const rest: Record<string, unknown> = { ...base };
    delete rest.postal;
    const result = nineOneOneSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a missing type", () => {
    const rest: Record<string, unknown> = { ...base };
    delete rest.type;
    const result = nineOneOneSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid priority", () => {
    const result = nineOneOneSchema.safeParse({ ...base, priority: "urgent" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = nineOneOneSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a description over 500 characters", () => {
    const result = nineOneOneSchema.safeParse({ ...base, description: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("callIntakeSchema", () => {
  it("accepts a minimal well-formed call-intake payload", () => {
    const result = callIntakeSchema.safeParse({ status: "new", title: "Traffic Stop", panels: "All" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing required Call Title", () => {
    const result = callIntakeSchema.safeParse({ status: "new", panels: "All" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required Status", () => {
    const result = callIntakeSchema.safeParse({ title: "Traffic Stop", panels: "All" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required Panels", () => {
    const result = callIntakeSchema.safeParse({ status: "new", title: "Traffic Stop" });
    expect(result.success).toBe(false);
  });

  it("accepts an update payload carrying an existing call id", () => {
    const result = callIntakeSchema.safeParse({
      id: "abc123",
      status: "dispatched",
      title: "Traffic Stop",
      panels: "All",
      assignSelf: true,
    });
    expect(result.success).toBe(true);
  });
});
