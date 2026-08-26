import { NotificationRepository } from "../repositories/notification.repository.js";

export class MarkAllNotificationsReadUseCase {
  constructor(private repo: NotificationRepository) {}

  async execute(userId: string) {
    return this.repo.markAllAsRead(userId);
  }
}
