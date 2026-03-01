import { describe, it, expect } from "vitest";
import { ROLES_KEY, Roles } from "./roles.decorator";

describe("Roles Decorator", () => {
  it("uses correct metadata key", () => {
    expect(ROLES_KEY).toBe("roles");
  });

  it("Roles is a function", () => {
    expect(typeof Roles).toBe("function");
  });

  it("Roles returns a function when called with roles", () => {
    const decorator = Roles("admin", "manager");
    expect(typeof decorator).toBe("function");
  });
});
