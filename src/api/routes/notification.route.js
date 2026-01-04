const express = require("express");
const router = express.Router();
const notiController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get("/", verifyToken, notiController.getNotifications);


router.put("/:id/read", verifyToken, notiController.markAsRead);


router.put("/read-all", verifyToken, notiController.markAllAsRead);

router.delete("/:id", verifyToken, notiController.deleteNotification);

module.exports = router;