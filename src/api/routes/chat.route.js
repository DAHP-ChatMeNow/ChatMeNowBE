const express = require("express");
const router = express.Router();
const chatController = require("../controllers/ChatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Lấy danh sách conversations
router.get("/conversations", verifyToken, chatController.getConversations);

// Tạo group conversation
router.post("/conversations", verifyToken, chatController.createGroupConversation);

// Lấy chi tiết conversation
router.get("/conversations/:id", verifyToken, chatController.getConversationDetails);

// Lấy hoặc tạo private conversation
router.get("/private/:partnerId", verifyToken, chatController.getOrCreatePrivateConversation);

// Lấy thông tin partner trong private conversation
router.get("/conversations/:conversationId/partner", verifyToken, chatController.getPrivateConversationPartner);

// Lấy messages của conversation
router.get("/conversations/:conversationId/messages", verifyToken, chatController.getMessages);

// Gửi message
router.post("/messages", verifyToken, chatController.sendMessage);

// Nhóm: thêm thành viên
router.post("/conversations/:conversationId/members", verifyToken, chatController.addMemberToGroup);

// Nhóm: xóa thành viên
router.delete("/conversations/:conversationId/members/:memberId", verifyToken, chatController.removeMemberFromGroup);

// Nhóm: giải tán
router.delete("/conversations/:conversationId", verifyToken, chatController.dissolveGroup);

module.exports = router;