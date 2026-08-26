import { NotificationRepository } from "../repositories/notification.repository.js";

export class CreateNotificationUseCase {
  constructor(private repo: NotificationRepository) {}

  async execute(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.repo.create(data);
  }
}
