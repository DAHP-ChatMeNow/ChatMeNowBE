const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:userId/contacts", verifyToken, userController.getContacts);

router.get("/search", verifyToken, userController.searchUsers);

// Lấy email và SĐT của user hiện tại
router.get("/me/email", verifyToken, userController.getUserEmail);

// Lấy email của user cụ thể theo userId
router.get("/:userId/email", verifyToken, userController.getUserEmailById);

// Lấy thông tin profile của user (displayName, avatar, bio, isOnline, friends)
router.get("/:userId", verifyToken, userController.getUserProfile);

router.put("/profile", verifyToken, userController.updateProfile);

router.put("/avatar", verifyToken, userController.updateAvatar);

router.put("/cover-image", verifyToken, userController.updateCoverImage);

// Friend management endpoints

router.get(
  "/friend-requests/pending",
  verifyToken,
  userController.getPendingRequests,
);

// Tìm kiếm và gửi lời mời kết bạn qua email/SĐT/tên
router.post("/search-and-add", verifyToken, userController.searchAndAddFriend);

router.post(
  "/friend-requests/:userId",
  verifyToken,
  userController.sendFriendRequest,
);

router.put(
  "/friend-requests/:requestId/accept",
  verifyToken,
  userController.acceptFriendRequest,
);

router.put(
  "/friend-requests/:requestId/reject",
  verifyToken,
  userController.rejectFriendRequest,
);

router.delete("/friends/:userId", verifyToken, userController.removeFriend);

// Legacy endpoints (keep for backward compatibility)
router.post("/friend-request", verifyToken, userController.sendFriendRequest);

router.put(
  "/friend-request/:requestId",
  verifyToken,
  userController.respondFriendRequest,
);

module.exports = router;
