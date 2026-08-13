import { describe, expect, it } from "vitest";
import { theme } from "./tokens";

describe("theme tokens", () => {
  it("defines every semantic color", () => {
    const expected: Array<keyof typeof theme.colors> = [
      "background",
      "surface",
      "surfaceHover",
      "text",
      "muted",
      "border",
      "primary",
      "primaryHover",
      "secondary",
      "success",
      "warning",
      "danger",
      "info",
    ];
    for (const name of expected) {
      expect(theme.colors[name], `color.${name}`).toBeTruthy();
    }
  });

  it("mirrors the required CSS variable surface", () => {
    expect(theme.colors.primary).toBeTypeOf("string");
    expect(theme.colors.primaryHover).toBeTypeOf("string");
    expect(theme.colors.background).toBeTypeOf("string");
    expect(theme.colors.surface).toBeTypeOf("string");
    expect(theme.colors.text).toBeTypeOf("string");
    expect(theme.colors.muted).toBeTypeOf("string");
    expect(theme.colors.border).toBeTypeOf("string");
    expect(theme.colors.success).toBeTypeOf("string");
    expect(theme.colors.warning).toBeTypeOf("string");
    expect(theme.colors.danger).toBeTypeOf("string");
  });

  it("defines the spacing scale", () => {
    expect(Object.keys(theme.spacing)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "8",
      "10",
      "12",
    ]);
  });

  it("defines the radius scale", () => {
    expect(Object.keys(theme.radius)).toEqual(["sm", "md", "lg", "full"]);
  });

  it("defines a typography hierarchy", () => {
    expect(theme.typography.sizes.h1).toBeTypeOf("string");
    expect(theme.typography.sizes.h2).toBeTypeOf("string");
    expect(theme.typography.sizes.h3).toBeTypeOf("string");
    expect(theme.typography.sizes.body).toBeTypeOf("string");
  });
});
