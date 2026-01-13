const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notis = await Notification.find({ recipientId: req.user.userId })
      .sort({ createdAt: -1 }) 
      .limit(20)
      .populate("senderId", "displayName avatar");

    res.status(200).json({
      success: true,
      notifications: notis,
      total: notis.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user.userId, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            recipientId: req.user.userId
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};