// @vitest-environment jsdom
import { render, cleanup } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { SettingsPreview } from "./SettingsPreview";
import type { Restaurant } from "../settings.types";

beforeEach(() => {
  cleanup();
});

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: "r1",
    name: "Test Restaurant",
    description: "A great place to eat",
    phone: "+1 555 1234",
    address: "123 Main St",
    logoUrl: null,
    primaryColor: "#2563eb",
    secondaryColor: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("SettingsPreview", () => {
  it("renders restaurant name", () => {
    const { container } = render(
      <SettingsPreview restaurant={makeRestaurant()} />,
    );
    expect(container.querySelector(".settings-preview__name")?.textContent).toBe(
      "Test Restaurant",
    );
  });

  it("renders description, phone, and address", () => {
    const { container } = render(
      <SettingsPreview restaurant={makeRestaurant()} />,
    );
    const values = container.querySelectorAll(".settings-preview__value");
    expect(values[0]?.textContent).toBe("A great place to eat");
    expect(values[1]?.textContent).toBe("+1 555 1234");
    expect(values[2]?.textContent).toBe("123 Main St");
  });

  it("renders 'Not set' for missing fields", () => {
    const { container } = render(
      <SettingsPreview
        restaurant={makeRestaurant({
          description: null,
          phone: null,
          address: null,
        })}
      />,
    );
    const values = container.querySelectorAll(".settings-preview__value");
    const notSetValues = Array.from(values).filter(
      (el) => el.textContent === "Not set",
    );
    expect(notSetValues).toHaveLength(3);
  });

  it("applies primary color to header", () => {
    const { container } = render(
      <SettingsPreview restaurant={makeRestaurant()} />,
    );
    const header = container.querySelector(".settings-preview__header");
    expect(header).toHaveStyle({ backgroundColor: "#2563eb" });
  });

  it("renders logo when logoUrl is provided", () => {
    const { container } = render(
      <SettingsPreview
        restaurant={makeRestaurant({
          logoUrl: "https://example.com/logo.png",
        })}
      />,
    );
    const img = container.querySelector(
      ".settings-preview__logo",
    ) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("https://example.com/logo.png");
  });

  it("does not render logo when logoUrl is null", () => {
    const { container } = render(
      <SettingsPreview restaurant={makeRestaurant({ logoUrl: null })} />,
    );
    expect(
      container.querySelector(".settings-preview__logo"),
    ).not.toBeInTheDocument();
  });

  it("handles null restaurant gracefully", () => {
    const { container } = render(<SettingsPreview restaurant={null} />);
    expect(container.querySelector(".settings-preview__name")?.textContent).toBe(
      "My Restaurant",
    );
    const values = container.querySelectorAll(".settings-preview__value");
    const notSetValues = Array.from(values).filter(
      (el) => el.textContent === "Not set",
    );
    expect(notSetValues).toHaveLength(3);
  });
});
