import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { listNotificationsQuerySchema } from "../schemas/list-notifications.schema.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { GetUserNotificationsUseCase } from "../use-cases/get-user-notifications.use-case.js";
import { MarkNotificationReadUseCase } from "../use-cases/mark-notification-read.use-case.js";
import { MarkAllNotificationsReadUseCase } from "../use-cases/mark-all-notifications-read.use-case.js";
import { prisma } from "@restaurant/database";

const router = Router();
const repo = new NotificationRepository(prisma);
const getNotifications = new GetUserNotificationsUseCase(repo);
const markRead = new MarkNotificationReadUseCase(repo);
const markAll = new MarkAllNotificationsReadUseCase(repo);

router.get(
  "/",
  authMiddleware(),
  validate(listNotificationsQuerySchema, "query"),
  async (req: any, res: any) => {
    const userId = req.user.id;
    const { page, limit } = req.query as any;
    const result = await getNotifications.execute(userId, { page, limit });
    res.json(result);
  }
);

router.patch("/:id/read", authMiddleware(), async (req: any, res: any) => {
  const userId = req.user.id;
  await markRead.execute(req.params.id, userId);
  res.status(204).send();
});

router.patch("/read-all", authMiddleware(), async (req: any, res: any) => {
  const userId = req.user.id;
  await markAll.execute(userId);
  res.status(204).send();
});

export { router as notificationRoutes };
