import { NotificationRepository } from "../repositories/notification.repository.js";
import { prisma } from "@restaurant/database";

const repo = new NotificationRepository(prisma);

const ROLE_MAP = {
  ORDER_CREATED: ["KITCHEN"],
  ORDER_READY: ["WAITER"],
  PAYMENT_RECEIVED: ["OWNER", "MANAGER"],
  ORDER_CANCELLED: ["OWNER", "MANAGER"],
  LOW_STOCK: ["OWNER", "MANAGER"],
} as const;

export async function createNotificationForRoles(
  type: keyof typeof ROLE_MAP,
  data: { title: string; message: string; entityType?: string; entityId?: string }
) {
  const roles = ROLE_MAP[type];
  const users = await prisma.user.findMany({
    where: { role: { in: roles as any }, status: "ACTIVE" },
    select: { id: true },
  });

  await Promise.all(
    users.map((u: { id: string }) =>
      repo.create({
        userId: u.id,
        type,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
      })
    )
  );
}
