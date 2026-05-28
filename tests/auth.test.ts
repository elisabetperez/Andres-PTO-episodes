import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

describe("signSession + verifySession", () => {
  it("round-trips a valid session and returns its payload", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    expect(verifySession(cookie, SECRET)).not.toBeNull();
  });

  it("rejects a cookie signed with a different secret", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    expect(verifySession(cookie, "other-secret-aaaaaaaaaaaaaaaaaaaaa")).toBeNull();
  });

  it("rejects a tampered cookie", () => {
    const cookie = signSession({ exp: Date.now() + 60_000 }, SECRET);
    const [payload, sig] = cookie.split(".");
    const tampered = payload.replace(/.$/, "X") + "." + sig;
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  it("rejects an expired cookie", () => {
    const cookie = signSession({ exp: Date.now() - 1 }, SECRET);
    expect(verifySession(cookie, SECRET)).toBeNull();
  });

  it("rejects a malformed cookie", () => {
    expect(verifySession("not-a-cookie", SECRET)).toBeNull();
    expect(verifySession("", SECRET)).toBeNull();
    expect(verifySession("only.one.part.too.many", SECRET)).toBeNull();
  });
});
