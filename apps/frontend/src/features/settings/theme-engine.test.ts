// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { applyBranding, resetBranding } from "./theme-engine";

describe("theme-engine", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
    resetBranding();
  });

  it("sets primary color CSS variable", () => {
    applyBranding({ primaryColor: "#2563eb" });

    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe(
      "#2563eb",
    );
  });

  it("derives hover color from primary", () => {
    applyBranding({ primaryColor: "#ffffff" });

    const hover = document.documentElement.style.getPropertyValue(
      "--color-primary-hover",
    );
    expect(hover).toBeTruthy();
    expect(hover).not.toBe("#ffffff");
  });

  it("derives subtle color from primary", () => {
    applyBranding({ primaryColor: "#dc2626" });

    const subtle = document.documentElement.style.getPropertyValue(
      "--color-primary-subtle",
    );
    expect(subtle).toContain("rgb");
  });

  it("sets secondary color CSS variable", () => {
    applyBranding({ secondaryColor: "#7c3aed" });

    expect(
      document.documentElement.style.getPropertyValue("--color-secondary"),
    ).toBe("#7c3aed");
  });

  it("sets both colors at once", () => {
    applyBranding({ primaryColor: "#059669", secondaryColor: "#f1f5f9" });

    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe(
      "#059669",
    );
    expect(
      document.documentElement.style.getPropertyValue("--color-secondary"),
    ).toBe("#f1f5f9");
  });

  it("does nothing when no colors provided", () => {
    applyBranding({});
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
  });

  it("does nothing for null values", () => {
    applyBranding({ primaryColor: null, secondaryColor: null });
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
  });

  it("resetBranding removes overridden variables", () => {
    applyBranding({ primaryColor: "#dc2626" });
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe(
      "#dc2626",
    );

    resetBranding();
    expect(document.documentElement.style.getPropertyValue("--color-primary")).toBe("");
  });

  it("deriveHoverColor produces darker shade", () => {
    applyBranding({ primaryColor: "#ff0000" });
    const hover = document.documentElement.style.getPropertyValue(
      "--color-primary-hover",
    );
    const r = parseInt(hover.slice(1, 3), 16);
    expect(r).toBeLessThan(255);
  });
});
