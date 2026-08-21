import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Modal } from "@/components/ui";
import { STAFF_ROLES } from "../users.types";

const addStaffSchema = z.object({
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
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  role: z.enum(["MANAGER", "CASHIER", "WAITER", "KITCHEN"] as const, {
    message: "Role is required",
  }),
});

type AddStaffFormValues = z.infer<typeof addStaffSchema>;

export interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddStaffFormValues) => void;
  isPending: boolean;
  error: string | null;
}

export function StaffForm({ open, onClose, onSubmit, isPending, error }: StaffFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      role: "CASHIER",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "", email: "", password: "", role: "CASHIER" });
    }
  }, [open, reset]);

  function handleFormSubmit(data: AddStaffFormValues) {
    onSubmit(data);
  }

  return (
    <Modal
      open={open}
      title="Create Staff"
      onClose={onClose}
      footer={
        <div className="staff-form__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit(handleFormSubmit)()}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create Staff"}
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
        <Input
          label="Password"
          type="password"
          placeholder="Min 8 chars, uppercase, lowercase, number, special"
          {...register("password")}
          error={errors.password?.message}
        />
        <label className="input">
          <span className="input__label">Role</span>
          <select
            className="input__control"
            {...register("role")}
          >
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
