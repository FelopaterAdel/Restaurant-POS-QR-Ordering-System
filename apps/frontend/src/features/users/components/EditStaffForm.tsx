import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import { STAFF_ROLES } from "../users.types";
import type { Staff } from "../users.types";

const editStaffSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),
  role: z.enum(["MANAGER", "CASHIER", "WAITER", "KITCHEN"] as const, {
    message: "Role is required",
  }),
});

type EditStaffFormValues = z.infer<typeof editStaffSchema>;

export interface EditStaffFormProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSubmit: (data: EditStaffFormValues) => void;
  isPending: boolean;
  error: string | null;
}

export function EditStaffForm({
  open,
  staff,
  onClose,
  onSubmit,
  isPending,
  error,
}: EditStaffFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      name: staff?.name ?? "",
      email: staff?.email ?? "",
      role: staff?.role ?? "CASHIER",
    },
  });

  useEffect(() => {
    if (open && staff) {
      reset({
        name: staff.name,
        email: staff.email,
        role: staff.role,
      });
    }
  }, [open, staff, reset]);

  function handleFormSubmit(data: EditStaffFormValues) {
    onSubmit(data);
  }

  function handleClose() {
    if (isDirty) {
      if (!window.confirm("Unsaved changes will be discarded. Continue?")) {
        return;
      }
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Edit Staff"
      onClose={handleClose}
      footer={
        <div className="staff-form__actions">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(handleFormSubmit)()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form
        className="staff-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(handleFormSubmit)(e);
        }}
      >
        {error && (
          <div className="staff-form__error" role="alert">
            {error}
          </div>
        )}
        <Input
          label="Name"
          placeholder="e.g. John Doe"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="e.g. john@restaurant.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <label className="input">
          <span className="input__label">Role</span>
          <select className="input__control" {...register("role")}>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role?.message && (
            <span className="input__error" role="alert">
              {errors.role.message}
            </span>
          )}
        </label>
      </form>
    </Modal>
  );
}
