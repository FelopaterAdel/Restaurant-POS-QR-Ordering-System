// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuPreviewPage from "./MenuPreviewPage";
import { useTablesQuery } from "@/features/tables/tables.queries";

vi.mock("@/features/tables/tables.queries", () => ({
  useTablesQuery: vi.fn(),
}));

vi.mock("@/features/menu/components/PublicMenuView", () => ({
  PublicMenuView: () => <div>PREVIEW MODE</div>,
}));

describe("MenuPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders preview when active table exists", () => {
    (useTablesQuery as any).mockReturnValue({
      data: [{ qrCode: "tbl_test", status: "AVAILABLE", number: 1 }],
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <MenuPreviewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/PREVIEW MODE/i)).toBeInTheDocument();
  });

  it("shows empty state when no active table", () => {
    (useTablesQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <MenuPreviewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No active table available for preview/i)).toBeInTheDocument();
  });
});
