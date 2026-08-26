import { NotificationRepository } from "../repositories/notification.repository.js";

export class MarkNotificationReadUseCase {
  constructor(private repo: NotificationRepository) {}

  async execute(id: string, userId: string) {
    return this.repo.markAsRead(id, userId);
  }
}
