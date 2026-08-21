// @vitest-environment jsdom
import { render, within, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StaffForm } from "./StaffForm";

function renderForm(
  overrides?: Partial<React.ComponentProps<typeof StaffForm>>,
) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  const defaultProps = {
    open: true,
    onClose,
    onSubmit,
    isPending: false,
    error: null,
    ...overrides,
  };

  act(() => {
    render(<StaffForm {...defaultProps} />);
  });

  const dialogs = document.querySelectorAll('[role="dialog"]');
  const dialog = dialogs[dialogs.length - 1] as HTMLElement;
  return { dialog, onClose, onSubmit };
}

describe("StaffForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders modal with Create Staff title", () => {
    const { dialog } = renderForm();

    expect(
      within(dialog).getByRole("heading", { name: "Create Staff" }),
    ).toBeInTheDocument();
  });

  it("renders name, email, password and role fields", () => {
    const { dialog } = renderForm();

    expect(within(dialog).getByLabelText("Name")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Email")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Password")).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onSubmit with form data when valid", async () => {
    const { dialog, onSubmit } = renderForm();
    const user = userEvent.setup();

    await user.type(within(dialog).getByLabelText("Name"), "New Waiter");
    await user.type(
      within(dialog).getByLabelText("Email"),
      "waiter@restaurant.com",
    );
    await user.type(within(dialog).getByLabelText("Password"), "StrongPass1!");
    await user.selectOptions(within(dialog).getByRole("combobox"), "WAITER");

    await user.click(
      within(dialog).getByRole("button", { name: "Create Staff" }),
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "New Waiter",
      email: "waiter@restaurant.com",
      password: "StrongPass1!",
      role: "WAITER",
    });
  });

  it("shows validation errors for invalid input", async () => {
    const { dialog, onSubmit } = renderForm();
    const user = userEvent.setup();

    await user.type(within(dialog).getByLabelText("Name"), "A");
    await user.click(
      within(dialog).getByRole("button", { name: "Create Staff" }),
    );

    await within(dialog).findByText("Name must be at least 2 characters");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("defaults the role to CASHIER and excludes OWNER", () => {
    const { dialog } = renderForm();

    const roleSelect = within(dialog).getByRole("combobox");
    expect(roleSelect).toHaveValue("CASHIER");

    const options = Array.from(roleSelect.querySelectorAll("option")).map(
      (o) => o.value,
    );
    expect(options).not.toContain("OWNER");
  });

  it("displays a server error banner", () => {
    const { dialog } = renderForm({ error: "This email is already in use." });

    expect(
      within(dialog).getByText("This email is already in use."),
    ).toBeInTheDocument();
  });

  it("disables buttons and shows pending label while submitting", () => {
    const { dialog } = renderForm({ isPending: true });

    expect(
      within(dialog).getByRole("button", { name: "Creating..." }),
    ).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { dialog, onClose } = renderForm();
    const user = userEvent.setup();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <StaffForm
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
        error={null}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
