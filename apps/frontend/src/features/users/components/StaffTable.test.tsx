// @vitest-environment jsdom
import { render, screen, within, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { StaffTable, StaffTableSkeleton } from "./StaffTable";
import type { Staff } from "../users.types";

const mockStaff: Staff[] = [
  {
    id: "user_1",
    name: "John Doe",
    email: "john@restaurant.com",
    role: "CASHIER",
    status: "ACTIVE",
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user_2",
    name: "Jane Smith",
    email: "jane@restaurant.com",
    role: "WAITER",
    status: "SUSPENDED",
    lastLoginAt: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
];

let mockRole = "OWNER";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Test Owner",
      email: "owner@test.com",
      role: mockRole,
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function renderTable(
  overrides?: Partial<React.ComponentProps<typeof StaffTable>>,
) {
  const onSelect = vi.fn();
  const onToggleStatus = vi.fn();

  const defaultProps = {
    staff: mockStaff,
    onSelect,
    onToggleStatus,
    ...overrides,
  };

  act(() => {
    render(<StaffTable {...defaultProps} />);
  });

  return { onSelect, onToggleStatus };
}

describe("StaffTable", () => {
  beforeEach(() => {
    mockRole = "OWNER";
  });

  afterEach(() => {
    cleanup();
  });

  it("renders one row per staff member with name, email, role and status", () => {
    renderTable();

    const rows = document.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByText("john@restaurant.com")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("Jane Smith")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("SUSPENDED")).toBeInTheDocument();
  });

  it("calls onSelect when a staff name is clicked", async () => {
    const { onSelect } = renderTable();
    const user = userEvent.setup();

    await user.click(screen.getByText("John Doe"));

    expect(onSelect).toHaveBeenCalledWith(mockStaff[0]);
  });

  it("calls onSelect when Details is clicked", async () => {
    const { onSelect } = renderTable();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: "Details" })[0]);

    expect(onSelect).toHaveBeenCalledWith(mockStaff[0]);
  });

  it("shows Suspend for ACTIVE staff and Activate for SUSPENDED staff", () => {
    renderTable();

    expect(
      screen.getByRole("button", { name: "Suspend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Activate" }),
    ).toBeInTheDocument();
  });

  it("calls onToggleStatus when Suspend is clicked", async () => {
    const { onToggleStatus } = renderTable();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Suspend" }));

    expect(onToggleStatus).toHaveBeenCalledWith(mockStaff[0]);
  });

  it("calls onToggleStatus when Activate is clicked", async () => {
    const { onToggleStatus } = renderTable();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Activate" }));

    expect(onToggleStatus).toHaveBeenCalledWith(mockStaff[1]);
  });

  it("hides status actions for non-OWNER roles while keeping Details", () => {
    mockRole = "MANAGER";
    renderTable();

    expect(
      screen.queryByRole("button", { name: "Suspend" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Activate" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Details" }),
    ).toHaveLength(2);
  });
});

describe("StaffTableSkeleton", () => {
  it("renders the requested number of skeleton rows", () => {
    const { container } = render(<StaffTableSkeleton rows={3} />);

    expect(container.querySelectorAll(".staff-table-skeleton__row")).toHaveLength(
      3,
    );
  });

  it("renders 5 rows by default", () => {
    const { container } = render(<StaffTableSkeleton />);

    expect(container.querySelectorAll(".staff-table-skeleton__row")).toHaveLength(
      5,
    );
  });
});
