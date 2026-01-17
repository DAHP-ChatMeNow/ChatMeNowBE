const Notification = require("../models/notification.model");

class NotificationService {
  /**
   * Lấy danh sách thông báo
   */
  async getNotifications(userId) {
    const notis = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("senderId", "displayName avatar")
      .populate("referenced");

    return {
      notifications: notis,
      total: notis.length,
    };
  }

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notificationId) {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    return { success: true };
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  /**
   * Xóa thông báo
   */
  async deleteNotification(userId, notificationId) {
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId,
    });
    return { success: true };
  }
}

module.exports = new NotificationService();
