import { NotificationRepository } from "../repositories/notification.repository.js";

export class GetUserNotificationsUseCase {
  constructor(private repo: NotificationRepository) {}

  async execute(userId: string, options: { page?: number; limit?: number } = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.repo.findByUserId(userId, { skip, take: limit }),
      this.repo.prisma.notification.count({ where: { userId } }),
      this.repo.countUnread(userId),
    ]);

    return { items, total, unreadCount, page, limit };
  }
}
